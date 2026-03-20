const MCRReport = require('../models/mcrReport.model');
const MCRStateConfig = require('../models/mcrStateConfig.model');
const FinancialCondition = require('../models/financialCondition.model');
const Loan = require('../models/loan.model');
const LoanCompensation = require('../models/loanCompensation.model');
const LoanStatusHistory = require('../models/loanStatusHistory.model');
const Lender = require('../models/lender.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { isJumbo } = require('../config/conformingLimits');
const mcrExport = require('../services/mcrExport.service');

// =====================================================
// MCR REPORT GENERATION & MANAGEMENT
// =====================================================

/**
 * Generate MCR Report
 * POST /api/v1/mcr/generate
 * 
 * Step 1 of the 2-step flow: Takes year, period, states, reportType
 * and generates the frozen report snapshot.
 */
exports.generateReport = async (req, res, next) => {
  try {
    const { year, period, states, reportType, loanOfficerId } = req.body;

    if (!year || !period) {
      return next(new ApiError('Year and period are required', 400));
    }

    // Normalize states — empty/undefined means all states
    const stateList = Array.isArray(states) && states.length > 0 ? states : null;

    // Determine date range for the period
    const { startDate, endDate } = getPeriodDates(year, period);

    // Prevent generating reports for periods that haven't started yet
    const today = new Date();
    if (startDate > today) {
      const startLabel = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return next(new ApiError(
        `Cannot generate MCR report for ${period} ${year} — this period has not started yet (starts ${startLabel})`,
        400
      ));
    }

    // Get lender info — admin can specify a lenderId, company users query all company lenders
    let lender;
    let loanQuery;
    let reportCompanyId = null;

    if (req.user.role === 'admin' && !req.body.lenderId) {
      // Admin generating a platform-wide report (all lenders/loans)
      loanQuery = { excludeFromMCR: { $ne: true } };
      // lender stays null — report not scoped to a single lender
    } else if (req.body.lenderId && req.user.role === 'admin') {
      // Admin generating on behalf of a specific lender
      lender = await Lender.findById(req.body.lenderId).populate('user', 'firstName lastName nmls');
      if (!lender) {
        return next(new ApiError('Specified lender not found', 404));
      }
      loanQuery = { lender: lender._id, excludeFromMCR: { $ne: true } };
      reportCompanyId = lender.company || null;
    } else if (req.user.role === 'company') {
      // Company user: aggregate all lenders in this company
      const companyLenders = await Lender.find({ company: req.user.company });
      if (!companyLenders.length) {
        return next(new ApiError('No lenders found for this company', 404));
      }
      lender = companyLenders[0]; // Use first lender for report lender field
      const lenderIds = companyLenders.map(l => l._id);
      loanQuery = { lender: { $in: lenderIds }, excludeFromMCR: { $ne: true } };
      reportCompanyId = req.user.company;
    } else {
      // Lender generating for themselves
      lender = await Lender.findOne({ user: req.user._id });
      if (!lender) {
        return next(new ApiError('Lender profile not found', 404));
      }
      loanQuery = { lender: lender._id, excludeFromMCR: { $ne: true } };
      reportCompanyId = lender.company || null;
    }

    // Build fallback LO for loans without assignedLoanOfficer (single-lender reports only)
    let fallbackLO = null;
    if (req.user.role === 'lender') {
      fallbackLO = { _id: req.user._id, firstName: req.user.firstName || '', lastName: req.user.lastName || '', nmls: req.user.nmls || '' };
    } else if (req.body.lenderId && req.user.role === 'admin' && lender?.user && typeof lender.user === 'object') {
      fallbackLO = { _id: lender.user._id, firstName: lender.user.firstName || '', lastName: lender.user.lastName || '', nmls: lender.user.nmls || '' };
    }

    // Only filter by state if specific states were provided
    if (stateList) {
      loanQuery['property.state'] = { $in: stateList };
    }

    // If LO report, filter by specific loan officer
    if (reportType === 'LO' && loanOfficerId) {
      loanQuery.assignedLoanOfficer = loanOfficerId;
    }

    // Fetch all relevant loans with compensation data
    const loans = await Loan.find(loanQuery)
      .populate('assignedLoanOfficer', 'firstName lastName nmls')
      .populate('loanParameters.selectedProgramId', 'programType programName')
      .lean();

    const loanIds = loans.map(l => l._id);

    // Fetch compensation data for all loans
    const compensations = await LoanCompensation.find({ loan: { $in: loanIds } }).lean();
    const compMap = {};
    compensations.forEach(c => { compMap[c.loan.toString()] = c; });

    // Filter loans to only those that belong to this specific period:
    // A loan is included only if its applicationDate (or createdAt fallback) falls WITHIN the period.
    // Loans from previous periods are NOT carried forward.
    const periodLoans = loans.filter(loan => {
      const comp = compMap[loan._id.toString()];
      const relevantDate = comp?.applicationDate || loan.createdAt;
      return relevantDate >= startDate && relevantDate <= endDate;
    });
    const periodLoanIds = periodLoans.map(l => l._id);

    // Fetch status histories for time-travel queries (only for period-relevant loans)
    const statusHistories = await LoanStatusHistory.find({
      loan: { $in: periodLoanIds },
      createdAt: { $lte: endDate }
    }).sort({ loan: 1, createdAt: -1 }).lean();

    // Build a map of loan -> status as of endDate
    const statusAtEndDate = {};
    const statusDuringPeriod = {};
    const processedLoans = new Set();

    for (const sh of statusHistories) {
      const loanIdStr = sh.loan.toString();
      if (!statusAtEndDate[loanIdStr]) {
        statusAtEndDate[loanIdStr] = sh.newStatus;
      }

      // Track all status changes during the period for pipeline calculations
      if (sh.createdAt >= startDate && sh.createdAt <= endDate) {
        if (!statusDuringPeriod[loanIdStr]) {
          statusDuringPeriod[loanIdStr] = [];
        }
        statusDuringPeriod[loanIdStr].push(sh);
      }
    }

    // Calculate all 5 MCR tabs (using only period-relevant loans)
    let applicationData = calculateApplicationData(periodLoans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate);
    applicationData = applyPipelinePlugs(applicationData);
    const closedLoanData = calculateClosedLoanData(periodLoans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate);
    const revenueData = calculateRevenueData(periodLoans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate);
    const mloData = calculateMLOData(periodLoans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate, fallbackLO);
    const rmlaData = calculateRMLAData(periodLoans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate);

    // Build validationErrors array for core AC990 + data completeness checks
    const validationErrors = [];

    // Helper to safely get total amounts from closedLoanData channel totals
    const getTotalAmount = (code) => {
      const row = closedLoanData?.[code];
      if (!row) return 0;
      const brokeredAmt = row.brokered?.amount || 0;
      const nonDelegatedAmt = row.nonDelegated?.amount || 0;
      return brokeredAmt + nonDelegatedAmt;
    };

    const ac990Total = getTotalAmount('AC990');
    const dimCodes = ['AC190', 'AC290', 'AC390', 'AC590', 'AC790', 'AC1290'];
    dimCodes.forEach(code => {
      const dimTotal = getTotalAmount(code);
      if (dimTotal !== ac990Total) {
        validationErrors.push({
          code: `AC990_MISMATCH_${code}`,
          severity: 'error',
          message: `Dimensional total ${code} (${dimTotal.toLocaleString()}) does not match AC990 (${ac990Total.toLocaleString()}).`
        });
      }
    });

    // RMLA LTV completeness: funded loans missing usable LTV
    const fundedWithMissingLTV = rmlaData?._meta?.fundedWithMissingLTV || 0;
    if (fundedWithMissingLTV > 0) {
      validationErrors.push({
        code: 'RMLA_MISSING_LTV',
        severity: 'warning',
        message: `${fundedWithMissingLTV} funded loans are missing LTV data for RMLA weighted-average calculations.`
      });
    }

    // Determine the actual states present in the data (from period loans only)
    const actualStates = stateList || [...new Set(periodLoans.map(l => l.property?.state).filter(Boolean))].sort();

    // Calculate per-state breakdowns
    const perStateData = {};
    for (const state of actualStates) {
      const stateLoans = periodLoans.filter(l => l.property && l.property.state === state);
      const stateCompMap = {};
      stateLoans.forEach(l => {
        const lid = l._id.toString();
        if (compMap[lid]) stateCompMap[lid] = compMap[lid];
      });
      const stateApplicationData = applyPipelinePlugs(
        calculateApplicationData(stateLoans, stateCompMap, statusAtEndDate, statusDuringPeriod, startDate, endDate)
      );
      perStateData[state] = {
        applicationData: stateApplicationData,
        closedLoanData: calculateClosedLoanData(stateLoans, stateCompMap, statusAtEndDate, statusDuringPeriod, startDate, endDate),
        revenueData: calculateRevenueData(stateLoans, stateCompMap, statusAtEndDate, statusDuringPeriod, startDate, endDate),
        mloData: calculateMLOData(stateLoans, stateCompMap, statusAtEndDate, statusDuringPeriod, startDate, endDate, fallbackLO),
        rmlaData: calculateRMLAData(stateLoans, stateCompMap, statusAtEndDate, statusDuringPeriod, startDate, endDate)
      };
    }

    // Count excluded loans (reuse the same loanQuery base, just swap the exclude flag)
    const excludedQueryBase = { ...loanQuery, excludeFromMCR: true };
    // remove the $ne false constraint if present, keep the lender scope
    delete excludedQueryBase.excludeFromMCR;
    excludedQueryBase.excludeFromMCR = true;
    const excludedCount = await Loan.countDocuments(excludedQueryBase);

    // Create report snapshot
    const report = await MCRReport.create({
      lender: lender?._id || undefined,
      company: reportCompanyId,
      generatedBy: req.user._id,
      year,
      period,
      startDate,
      endDate,
      states: actualStates,
      reportType: reportType || 'Company',
      loanOfficer: reportType === 'LO' ? loanOfficerId : null,
      applicationData,
      closedLoanData,
      revenueData,
      mloData,
      rmlaData,
      perStateData,
      fileName: `MCR_${year}_${period}_${actualStates.length > 0 ? actualStates.join('-') : 'ALL'}_${Date.now()}`,
      totalLoansIncluded: periodLoans.length,
      totalLoansExcluded: excludedCount,
      validationErrors
    });

    res.status(201).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all saved MCR reports
 * GET /api/v1/mcr/reports
 */
exports.getReports = async (req, res, next) => {
  try {
    let reportFilter;

    if (req.user.role === 'admin' && !req.query.lenderId) {
      // Admin with no filter — return ALL reports platform-wide
      reportFilter = {};
    } else if (req.query.lenderId && req.user.role === 'admin') {
      // Admin querying a specific lender's reports
      const lender = await Lender.findById(req.query.lenderId);
      if (!lender) {
        return next(new ApiError('Specified lender not found', 404));
      }
      reportFilter = { lender: lender._id };
    } else if (req.user.role === 'company') {
      // Company user: see all reports for the company
      reportFilter = { company: req.user.company };
    } else {
      // Lender: see their own reports
      const lender = await Lender.findOne({ user: req.user._id });
      if (!lender) {
        return next(new ApiError('Lender profile not found', 404));
      }
      reportFilter = { lender: lender._id };
    }

    const reports = await MCRReport.find(reportFilter)
      .select('fileName year period states reportType status createdAt generatedBy totalLoansIncluded totalLoansExcluded')
      .populate('generatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific saved report
 * GET /api/v1/mcr/reports/:id
 */
exports.getReport = async (req, res, next) => {
  try {
    const report = await MCRReport.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName')
      .populate('loanOfficer', 'firstName lastName nmls');

    if (!report) {
      return next(new ApiError('Report not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update report status (draft → final → submitted)
 * PUT /api/v1/mcr/reports/:id
 */
exports.updateReport = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const report = await MCRReport.findByIdAndUpdate(
      req.params.id,
      { $set: { status, notes } },
      { new: true, runValidators: true }
    );

    if (!report) {
      return next(new ApiError('Report not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a draft report
 * DELETE /api/v1/mcr/reports/:id
 */
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await MCRReport.findById(req.params.id);

    if (!report) {
      return next(new ApiError('Report not found', 404));
    }

    if (report.status === 'submitted') {
      return next(new ApiError('Cannot delete a submitted report', 400));
    }

    await MCRReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export report as Excel or XML
 * GET /api/v1/mcr/reports/:id/export?format=excel|xml&state=all|CA
 */
exports.exportReport = async (req, res, next) => {
  try {
    const { format, state } = req.query;
    const report = await MCRReport.findById(req.params.id);

    if (!report) {
      return next(new ApiError('Report not found', 404));
    }

    // Optionally load Financial Condition data for this period
    let fcData = null;
    try {
      const companyId = report.company || req.user.company;
      fcData = await FinancialCondition.findOne({
        company: companyId,
        year: report.year,
        quarter: report.period
      });
    } catch (e) { /* FC data is optional */ }

    if (format === 'excel') {
      const buffer = await mcrExport.generateExcel(report, fcData, state || 'all');
      const filename = `MCR_${report.year}_${report.period}${state && state !== 'all' ? '_' + state : ''}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    if (format === 'xml') {
      const companyInfo = { nmlsId: req.user.nmlsId || '', name: req.user.companyName || '' };
      const xml = mcrExport.generateXML(report, fcData, state || 'all', companyInfo);
      const filename = `MCR_${report.year}_${report.period}${state && state !== 'all' ? '_' + state : ''}.xml`;
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(xml);
    }

    // Default: JSON export
    const exportData = state && state !== 'all' && report.perStateData
      ? (report.perStateData instanceof Map ? report.perStateData.get(state) : report.perStateData[state]) || {}
      : {
          applicationData: report.applicationData,
          closedLoanData: report.closedLoanData,
          revenueData: report.revenueData,
          mloData: report.mloData,
          rmlaData: report.rmlaData
        };

    res.status(200).json({
      status: 'success',
      format: 'json',
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// MCR STATE CONFIG
// =====================================================

/**
 * Get all state configs for the company
 * GET /api/v1/mcr/states
 */
exports.getStateConfigs = async (req, res, next) => {
  try {
    const lender = await Lender.findOne({ user: req.user._id });
    const companyId = lender ? lender.company : null;

    const configs = await MCRStateConfig.find({ company: companyId })
      .sort({ stateCode: 1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: configs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update state-specific MCR settings
 * PUT /api/v1/mcr/states/:stateCode
 */
exports.updateStateConfig = async (req, res, next) => {
  try {
    const { stateCode } = req.params;
    const lender = await Lender.findOne({ user: req.user._id });
    const companyId = lender ? lender.company : null;

    if (!companyId) {
      return next(new ApiError('Company not found', 404));
    }

    const config = await MCRStateConfig.findOneAndUpdate(
      { company: companyId, stateCode: stateCode.toUpperCase() },
      { $set: { ...req.body, company: companyId, stateCode: stateCode.toUpperCase() } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// FINANCIAL CONDITION
// =====================================================

/**
 * Get Financial Condition data for a period
 * GET /api/v1/mcr/financial-condition/:year/:quarter
 */
exports.getFinancialCondition = async (req, res, next) => {
  try {
    const { year, quarter } = req.params;
    const lender = await Lender.findOne({ user: req.user._id });
    const companyId = lender ? lender.company : null;

    let fc = await FinancialCondition.findOne({
      company: companyId,
      year: parseInt(year),
      quarter
    });

    if (!fc) {
      // Return empty structure
      fc = { year: parseInt(year), quarter, company: companyId };
    }

    res.status(200).json({
      status: 'success',
      data: fc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save/update Financial Condition data
 * PUT /api/v1/mcr/financial-condition/:year/:quarter
 */
exports.saveFinancialCondition = async (req, res, next) => {
  try {
    const { year, quarter } = req.params;
    const lender = await Lender.findOne({ user: req.user._id });
    const companyId = lender ? lender.company : null;

    if (!companyId) {
      return next(new ApiError('Company not found', 404));
    }

    const fc = await FinancialCondition.findOneAndUpdate(
      { company: companyId, year: parseInt(year), quarter },
      { $set: { ...req.body, company: companyId, year: parseInt(year), quarter } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: fc
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CALCULATION ENGINE HELPERS
// =====================================================

/**
 * Get start and end dates for a reporting period
 */
function getPeriodDates(year, period) {
  const quarterMap = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
    Annual: { start: `${year}-01-01`, end: `${year}-12-31` }
  };

  const dates = quarterMap[period];
  return {
    startDate: new Date(`${dates.start}T00:00:00.000Z`),
    endDate: new Date(`${dates.end}T23:59:59.999Z`)
  };
}

/**
 * Helper: Get closed/funded loans in period
 *
 * For MCR, a loan is considered closed/funded for the quarter ONLY when:
 * - It has an explicit fundedDate or closingDate in the compensation record
 *   within the period, AND
 * - Its status-as-of-end-of-period is a terminal funded/closed status
 *   (Closed or Funded).
 *
 * This keeps Closed Loan Data (Tab 2), Revenue, MLO attribution, and RMLA
 * perfectly aligned with AC070 in the Application Data tab.
 */
function getFundedLoansInPeriod(loans, compMap, statusAtEndDate, startDate, endDate) {
  return loans.filter(loan => {
    const comp = compMap[loan._id.toString()];
    if (!comp) return false;

    const currentStatus = statusAtEndDate[loan._id.toString()] || loan.status;
    if (currentStatus !== 'Closed' && currentStatus !== 'Funded') {
      return false;
    }

    const { fundedDate, closingDate } = comp;
    const inRange = (d) => d && d >= startDate && d <= endDate;

    return inRange(fundedDate) || inRange(closingDate);
  });
}

/**
 * Helper: Get loan amount
 */
function getLoanAmount(loan) {
  return loan.loanDetails?.loanAmount ||
    loan.loanDetails?.requestedLoanAmount ||
    loan.loanParameters?.loanAmount || 0;
}

/**
 * Tab 1: Application Data (AC010–AC090)
 * Pipeline flow — apps received, denied, withdrawn, funded, ending pipeline
 */
function calculateApplicationData(loans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate) {
  const result = {
    // AC010: Beginning Pipeline (apps in pipeline at start of period)
    AC010: { amount: 0, count: 0 },
    // AC020: Applications Received during period
    AC020: { amount: 0, count: 0 },
    // AC030: Approved but not Accepted
    AC030: { amount: 0, count: 0 },
    // AC040: Applications Denied during period
    AC040: { amount: 0, count: 0 },
    // AC050: Applications Withdrawn during period
    AC050: { amount: 0, count: 0 },
    // AC060: Closed Incomplete (file closed without action)
    AC060: { amount: 0, count: 0 },
    // AC070: Loans Closed and Funded during period (own bucket — separate from AC050)
    AC070: { amount: 0, count: 0 },
    // AC080: Ending Pipeline (still active at end of period)
    AC080: { amount: 0, count: 0 }
  };

  // --- AC020–AC090: classify activity during the period & ending pipeline ---
  for (const loan of loans) {
    const amount = getLoanAmount(loan);
    const comp = compMap[loan._id.toString()];
    const loanIdStr = loan._id.toString();
    const transitions = statusDuringPeriod[loanIdStr] || [];
    // The loan's status as-of the period end date (time-travel)
    const currentStatus = statusAtEndDate[loanIdStr] || loan.status;

    // AC020: Applications received — loans whose application was received during this period
    // Use compensation.applicationDate when available, otherwise fall back to the loan's own
    // application date or createdAt so that loans without a comp record are still counted.
    const applicationDate =
      (comp && comp.applicationDate) ||
      loan.loanDetails?.applicationDate ||
      loan.applicationDate ||
      loan.createdAt;

    if (applicationDate && applicationDate >= startDate && applicationDate <= endDate) {
      result.AC020.count++;
      result.AC020.amount += amount;
    }

    // --- EXIT CATEGORIES: mutually exclusive based on status-as-of-endDate ---
    // A loan can only be in ONE exit category. We use the status at end-of-period
    // as the authoritative classification. This prevents double-counting when a loan
    // has multiple date fields set from testing or status cycling.
    if (currentStatus === 'Approved-Not-Accepted') {
      // AC030: Approved but not Accepted — commitment issued but not closed
      const approvedNotAcceptedInPeriod = transitions.some(t => t.newStatus === 'Approved-Not-Accepted');
      if (approvedNotAcceptedInPeriod) {
        result.AC030.count++;
        result.AC030.amount += amount;
      }
    } else if (currentStatus === 'Declined') {
      // AC040: Denied — loan's status as of period end is Declined
      // Only count if the denial happened during this period
      const deniedInPeriod = transitions.some(t => t.newStatus === 'Declined')
        || (comp && comp.denialDate && comp.denialDate >= startDate && comp.denialDate <= endDate);
      if (deniedInPeriod) {
        result.AC040.count++;
        result.AC040.amount += amount;
      } else {
        // Was denied before this period — not in pipeline, not an exit this period
        // Don't count it anywhere (it's already gone from the pipeline)
      }
    } else if (currentStatus === 'Withdrawn') {
      // AC050: Withdrawn — loan's status as of period end is Withdrawn
      const withdrawnInPeriod = transitions.some(t => t.newStatus === 'Withdrawn')
        || (comp && comp.withdrawnDate && comp.withdrawnDate >= startDate && comp.withdrawnDate <= endDate);
      if (withdrawnInPeriod) {
        result.AC050.count++;
        result.AC050.amount += amount;
      }
    } else if (currentStatus === 'Closed' || currentStatus === 'Funded') {
      // AC070: Loans Closed and Funded — own bucket, distinct from Withdrawn (AC050)
      const closedFundedInPeriod = transitions.some(t => t.newStatus === 'Closed' || t.newStatus === 'Funded')
        || (comp && comp.fundedDate && comp.fundedDate >= startDate && comp.fundedDate <= endDate)
        || (comp && comp.closingDate && comp.closingDate >= startDate && comp.closingDate <= endDate);
      if (closedFundedInPeriod) {
        result.AC070.count++;
        result.AC070.amount += amount;
      }
    } else if (currentStatus === 'Closed-Incomplete') {
      // AC060: File Closed for Incompleteness
      const closedIncompleteInPeriod = transitions.some(t => t.newStatus === 'Closed-Incomplete')
        || (comp && comp.closedIncompleteDate && comp.closedIncompleteDate >= startDate && comp.closedIncompleteDate <= endDate);
      if (closedIncompleteInPeriod) {
        result.AC060.count++;
        result.AC060.amount += amount;
      }
    } else {
      // AC080: Ending pipeline — loan is still active (non-terminal status)
      result.AC080.count++;
      result.AC080.amount += amount;
    }
  }

  // --- AC010: Beginning Pipeline snapshot (as-of startDate) ---
  //
  // "Beginning pipeline" is defined as loans that were active in the pipeline
  // at the moment the period started (day before startDate through startDate).
  // We approximate this by:
  // - Including loans whose applicationDate is BEFORE the period, and
  // - Whose status at the end of the PREVIOUS period was still non-terminal.
  //
  // Since statusAtEndDate is keyed to the current period end, we can't time-travel
  // directly here without more granular history; instead we approximate by:
  // - Any loan with applicationDate < startDate that is NOT in a terminal status
  //   by the end of the period counts as beginning pipeline.
  // This is a conservative, snapshot-style approximation that avoids negative AC010.

  for (const loan of loans) {
    const comp = compMap[loan._id.toString()];
    const appDate = comp?.applicationDate || loan.createdAt;
    if (!appDate || appDate >= startDate) continue;

    const statusAtEnd = statusAtEndDate[loan._id.toString()] || loan.status;
    const terminalStatuses = ['Declined', 'Withdrawn', 'Closed', 'Funded', 'Closed-Incomplete', 'Approved-Not-Accepted'];
    if (!terminalStatuses.includes(statusAtEnd)) {
      const amount = getLoanAmount(loan);
      result.AC010.count++;
      result.AC010.amount += amount;
    }
  }

  return result;
}

/**
 * Helper: Derive AC065 (net dollar changes) and AC063 (net count changes) plugs
 * so that the NMLS pipeline identity holds:
 *   AC080 = AC010 + AC020 - AC030 - AC040 - AC050 - AC060 + AC065 + AC063 - AC070
 * We compute AC065.amount and AC063.count as plugs based on already-computed buckets.
 */
function applyPipelinePlugs(appData) {
  if (!appData) return appData;

  const num = (val) => Number(val) || 0;

  const ac010 = appData.AC010 || {};
  const ac020 = appData.AC020 || {};
  const ac030 = appData.AC030 || {};
  const ac040 = appData.AC040 || {};
  const ac050 = appData.AC050 || {};
  const ac060 = appData.AC060 || {};
  const ac070 = appData.AC070 || {};
  const ac080 = appData.AC080 || {};

  const amt80 = num(ac080.amount);
  const cnt80 = num(ac080.count);

  const amtSum = num(ac010.amount) + num(ac020.amount)
    - num(ac030.amount) - num(ac040.amount) - num(ac050.amount)
    - num(ac060.amount) - num(ac070.amount);
  const cntSum = num(ac010.count) + num(ac020.count)
    - num(ac030.count) - num(ac040.count) - num(ac050.count)
    - num(ac060.count) - num(ac070.count);

  // AC065: net dollar changes (plug on amount side)
  const ac065 = { amount: amt80 - amtSum };
  // AC063: net application changes (plug on count side)
  const ac063 = { amount: 0, count: cnt80 - cntSum };

  appData.AC065 = ac065;
  appData.AC063 = ac063;

  // AC066: Total Application Pipeline (should equal AC070 + AC080)
  const ac066Amount = num(ac010.amount) + num(ac020.amount)
    - num(ac030.amount) - num(ac040.amount) - num(ac050.amount) - num(ac060.amount)
    + num(ac065.amount) + num(ac063.amount);
  const ac066Count = num(ac010.count) + num(ac020.count)
    - num(ac030.count) - num(ac040.count) - num(ac050.count) - num(ac060.count)
    + num(ac063.count);

  appData.AC066 = { amount: ac066Amount, count: ac066Count };

  return appData;
}

/**
 * Tab 2: Closed Loan Data (AC100–AC990)
 * Breakdown of funded loans by type, property, purpose, lien, QM status
 */
function calculateClosedLoanData(loans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate) {
  const funded = getFundedLoansInPeriod(loans, compMap, statusAtEndDate, startDate, endDate);

  const mkEntry = (label) => ({
    label,
    brokered: { amount: 0, count: 0 },
    nonDelegated: { amount: 0, count: 0 }
  });

  const result = {
    // FORWARD MORTGAGES – LOAN TYPE (by program/government backing)
    AC100: mkEntry('Conventional'),
    AC110: mkEntry('FHA-Insured'),
    AC120: mkEntry('VA-Guaranteed'),
    AC130: mkEntry('FSA/RHS-Guaranteed'),
    AC190: mkEntry('Total Loan Type – Forward Mortgages'),
    // PROPERTY TYPE
    AC200: mkEntry('One to Four Family Dwelling'),
    AC210: mkEntry('Manufactured Housing'),
    AC290: mkEntry('Total Property Type'),
    // PURPOSE OF LOAN OR APPLICATION
    AC300: mkEntry('Home Purchase'),
    AC310: mkEntry('Home Improvement'),
    AC320: mkEntry('Refinancing'),
    AC390: mkEntry('Total Purpose of Loan or Application'),
    // HOEPA
    AC400: mkEntry('HOEPA'),
    // LIEN STATUS
    AC500: mkEntry('First Lien'),
    AC510: mkEntry('Subordinate Lien'),
    AC520: mkEntry('Not Secured by a Lien'),
    AC590: mkEntry('Total Lien Status'),
    // FEE INFORMATION (flat dollar amounts, no channel split)
    AC600: { label: 'Broker Fees Collected-Forward Mortgages', amount: 0 },
    AC610: { label: 'Lender Fees Collected-Forward Mortgages', amount: 0 },
    // REVERSE MORTGAGES
    AC700: mkEntry('HECM-Standard'),
    AC710: mkEntry('HECM-Saver'),
    AC720: mkEntry('Proprietary/Other'),
    AC790: mkEntry('Total Loan Type – Reverse Mortgages'),
    // QM AND NON-QM
    AC920: mkEntry('Qualified Mortgage (QM)'),
    AC930: mkEntry('Non-Qualified Mortgage'),
    AC940: mkEntry('Not Subject to QM'),
    AC990: mkEntry('Total Closed Loans'),
    // REPURCHASE
    AC1000: mkEntry('Loans Made and Assigned but Required to Repurchase in Period'),
    // SERVICED LOANS
    AC1200: mkEntry('Closed Loans During the Quarter with Servicing Retained'),
    AC1210: mkEntry('Closed Loans During the Quarter with Servicing Released'),
    AC1290: mkEntry('Total Closed Loans')
  };

  // Helper: add a loan to a result code under the correct channel
  const add = (key, isBrokered, amount) => {
    if (!result[key]) return;
    const sub = isBrokered ? result[key].brokered : result[key].nonDelegated;
    if (sub) { sub.count++; sub.amount += amount; }
  };

  for (const loan of funded) {
    const amount = getLoanAmount(loan);
    const comp = compMap[loan._id.toString()] || {};

    // Determine funding method routing: Brokered vs Non-Delegated/Delegated
    const fundingMethod = loan.fundingMethod || 'Brokered';
    const isBrokered = fundingMethod === 'Brokered';

    // Determine if reverse mortgage
    const isReverse = loan.isReverseMortgage || loan.loanDetails?.loanType === 'Reverse Mortgage';

    if (!isReverse) {
      // FORWARD MORTGAGES – LOAN TYPE (determined by LoanProgram.programType)
      const programType = (loan.loanParameters?.selectedProgramId?.programType || '').toLowerCase();
      if (programType === 'fha') {
        add('AC110', isBrokered, amount);
      } else if (programType === 'va') {
        add('AC120', isBrokered, amount);
      } else if (programType === 'usda') {
        add('AC130', isBrokered, amount);
      } else {
        // conventional, jumbo, other, or unknown → Conventional
        add('AC100', isBrokered, amount);
      }

      // FEE INFORMATION (forward mortgages only)
      result.AC600.amount += (comp.brokerCompensation || 0) + (comp.originationFee || 0) + (comp.brokerFlatFees || 0);
      result.AC610.amount += (comp.lenderFeesCollected || 0) + (comp.processingFee || 0);
    } else {
      // REVERSE MORTGAGES – classify by explicit reverseMortgageType when available
      const subtype = loan.reverseMortgageType || '';
      if (subtype === 'HECM-Saver') {
        add('AC710', isBrokered, amount);
      } else if (subtype === 'HECM-Standard') {
        add('AC700', isBrokered, amount);
      } else {
        add('AC720', isBrokered, amount);
      }
    }

    // PROPERTY TYPE
    if (loan.property?.propertyType === 'Manufactured Home') {
      add('AC210', isBrokered, amount);
    } else {
      add('AC200', isBrokered, amount); // all other residential = One to Four Family
    }

    // PURPOSE OF LOAN OR APPLICATION
    const loanType = loan.loanDetails?.loanType || '';
    if (loanType === 'Purchase') {
      add('AC300', isBrokered, amount);
    } else if (loanType === 'Home Improvement' || loanType === 'HELOC') {
      add('AC310', isBrokered, amount);
    } else if (['Refinance', 'Cash-Out Refinance', 'Construction'].includes(loanType)) {
      add('AC320', isBrokered, amount);
    } else {
      add('AC300', isBrokered, amount); // default to purchase
    }

    // HOEPA
    if (loan.hoeparFlag) {
      add('AC400', isBrokered, amount);
    }

    // LIEN STATUS
    const lienPos = comp.lienPosition || '1st';
    if (['1st', 'First', 'First Lien', 'first'].includes(lienPos)) {
      add('AC500', isBrokered, amount);
    } else if (['2nd', 'Second', 'Subordinate', 'second'].includes(lienPos)) {
      add('AC510', isBrokered, amount);
    } else if (['Not Secured', 'Not Secured by Lien', 'Unsecured'].includes(lienPos)) {
      add('AC520', isBrokered, amount);
    } else {
      add('AC500', isBrokered, amount); // default first lien
    }

    // QM AND NON-QM
    const qmStatus = loan.qmStatus || '';
    if (['QM-Safe Harbor', 'QM-Rebuttable Presumption'].includes(qmStatus)) {
      add('AC920', isBrokered, amount);
    } else if (qmStatus === 'Non-QM') {
      add('AC930', isBrokered, amount);
    } else if (['Not Subject to QM', 'Exempt'].includes(qmStatus)) {
      add('AC940', isBrokered, amount);
    } else {
      add('AC920', isBrokered, amount); // default QM
    }

    // SERVICED LOANS
    if (comp.servicingDisposition === 'Retained') {
      add('AC1200', isBrokered, amount);
    } else if (comp.servicingDisposition === 'Released') {
      add('AC1210', isBrokered, amount);
    }

    // REPURCHASE
    if (loan.requiredRepurchase || comp.requiredRepurchase) {
      add('AC1000', isBrokered, amount);
    }
  }

  // Compute section totals
  const sumTo = (srcKeys, targetKey) => {
    ['brokered', 'nonDelegated'].forEach(ch => {
      result[targetKey][ch].amount = srcKeys.reduce((s, k) => s + (result[k][ch]?.amount || 0), 0);
      result[targetKey][ch].count  = srcKeys.reduce((s, k) => s + (result[k][ch]?.count  || 0), 0);
    });
  };

  sumTo(['AC100', 'AC110', 'AC120', 'AC130'], 'AC190');
  sumTo(['AC200', 'AC210'], 'AC290');
  sumTo(['AC300', 'AC310', 'AC320'], 'AC390');
  sumTo(['AC500', 'AC510', 'AC520'], 'AC590');
  sumTo(['AC700', 'AC710', 'AC720'], 'AC790');
  sumTo(['AC920', 'AC930', 'AC940'], 'AC990');
  sumTo(['AC1200', 'AC1210'], 'AC1290');

  return result;
}

/**
 * Tab 3: Revenue Data (AC1010–AC1290)
 */
function calculateRevenueData(loans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate) {
  const funded = getFundedLoansInPeriod(loans, compMap, statusAtEndDate, startDate, endDate);

  const result = {
    AC1010: { amount: 0, label: 'Origination Fees' },
    AC1020: { amount: 0, label: 'Service Release Premiums (SRP)' },
    AC1030: { amount: 0, label: 'Yield Spread Premiums (YSP)' },
    AC1040: { amount: 0, label: 'Discount Points' },
    AC1050: { amount: 0, label: 'Broker Compensation' },
    AC1060: { amount: 0, label: 'Processing Fees' },
    AC1070: { amount: 0, label: 'Pass-Through Fees' },
    AC1080: { amount: 0, label: 'Broker Flat Fees' },
    AC1090: { amount: 0, label: 'Lender Fees Collected' },
    AC1100: { amount: 0, label: 'Gross Revenue from Mortgage Origination Operations' },
    // Servicing Disposition
    AC1200: { count: 0, amount: 0, label: 'Servicing Released' },
    AC1210: { count: 0, amount: 0, label: 'Servicing Retained' }
  };

  for (const loan of funded) {
    const comp = compMap[loan._id.toString()] || {};

    result.AC1010.amount += comp.originationFee || 0;
    result.AC1020.amount += comp.srpAmount || 0;
    result.AC1030.amount += comp.yspAmount || 0;
    result.AC1040.amount += comp.discountPoints || 0;
    result.AC1050.amount += comp.brokerCompensation || 0;
    result.AC1060.amount += comp.processingFee || 0;
    result.AC1070.amount += comp.passThruFees || 0;
    result.AC1080.amount += comp.brokerFlatFees || 0;
    result.AC1090.amount += comp.lenderFeesCollected || 0;

    // Servicing Disposition
    if (comp.servicingDisposition === 'Released') {
      result.AC1200.count++;
      result.AC1200.amount += getLoanAmount(loan);
    } else if (comp.servicingDisposition === 'Retained') {
      result.AC1210.count++;
      result.AC1210.amount += getLoanAmount(loan);
    }
  }

  // Total Gross Revenue
  result.AC1100.amount = result.AC1010.amount + result.AC1020.amount + result.AC1030.amount +
    result.AC1040.amount + result.AC1050.amount + result.AC1060.amount +
    result.AC1070.amount + result.AC1080.amount + result.AC1090.amount;

  return result;
}

/**
 * Tab 4: MLO Data — Per-Loan Officer attribution
 */
function calculateMLOData(loans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate, fallbackLO = null) {
  const loMap = {};  // keyed by LO user ID

  for (const loan of loans) {
    const lo = loan.assignedLoanOfficer || fallbackLO;
    if (!lo) continue;

    const loId = lo._id ? lo._id.toString() : lo.toString();
    if (!loMap[loId]) {
      loMap[loId] = {
        loanOfficerId: loId,
        firstName: lo.firstName || 'Unknown',
        lastName: lo.lastName || '',
        nmlsId: lo.nmls || lo.nmlsId || '',
        loanCount: 0,
        totalAmount: 0
      };
    }

    loMap[loId].loanCount++;
    loMap[loId].totalAmount += getLoanAmount(loan);
  }

  // Convert to array and add averages
  const mloArray = Object.values(loMap).map(lo => ({
    ...lo,
    averageAmount: lo.loanCount > 0 ? Math.round(lo.totalAmount / lo.loanCount) : 0
  }));

  return {
    loanOfficers: mloArray.sort((a, b) => b.totalAmount - a.totalAmount),
    totalLOCount: mloArray.length
  };
}

/**
 * Tab 5: RMLA Section II (I010–I460)
 * Risk characteristics — product type, channel, LTV, doc type, rate type
 */
function calculateRMLAData(loans, compMap, statusAtEndDate, statusDuringPeriod, startDate, endDate) {
  const funded = getFundedLoansInPeriod(loans, compMap, statusAtEndDate, startDate, endDate);

  const result = {
    // Product Type (I010–I080)
    productType: {
      governmentFixed: { count: 0, amount: 0 },   // I010
      governmentARM: { count: 0, amount: 0 },     // I020
      conventionalFixed: { count: 0, amount: 0 },  // I030
      conventionalARM: { count: 0, amount: 0 },    // I040
      jumboFixed: { count: 0, amount: 0 },          // I050
      jumboARM: { count: 0, amount: 0 },            // I060
      otherFixed: { count: 0, amount: 0 },          // I070
      otherARM: { count: 0, amount: 0 }             // I080
    },
    // Channel (I210–I240)
    channel: {
      brokered: { count: 0, amount: 0 },           // I210
      closedRetail: { count: 0, amount: 0 },       // I220
      closedCorrespondent: { count: 0, amount: 0 }, // I230
      tableFunded: { count: 0, amount: 0 }          // I240
    },
    // Risk Characteristics
    riskCharacteristics: {
      altDoc: { count: 0, amount: 0 },              // I270
      interestOnly: { count: 0, amount: 0 },        // I280
      optionARM: { count: 0, amount: 0 },           // I290
      prepaymentPenalty: { count: 0, amount: 0 },   // I300
      mortgageInsurance: { count: 0, amount: 0 },   // I330
      piggybackSecond: { count: 0, amount: 0 }      // I340
    },
    // Purpose
    purpose: {
      purchase: { count: 0, amount: 0 },             // I350
      refinance: { count: 0, amount: 0 }              // I360
    },
    // LTV Distribution
    ltvDistribution: {
      lt60: { count: 0, amount: 0 },                 // ≤60%
      lt70: { count: 0, amount: 0 },                 // 60.01–70%
      lt80: { count: 0, amount: 0 },                 // 70.01–80%
      lt90: { count: 0, amount: 0 },                 // 80.01–90%
      lt95: { count: 0, amount: 0 },                 // 90.01–95%
      lt100: { count: 0, amount: 0 },                // 95.01–100%
      gt100: { count: 0, amount: 0 }                 // >100%
    },
    // Weighted Averages
    weightedAverages: {
      ltv: 0,
      couponRate: 0,
      warehousePeriod: 0
    },
    // Pull-Through
    pullThrough: {
      appsReceived: 0,
      loansFunded: 0,
      ratio: 0
    }
  };

  let totalWeightedLTV = 0;
  let totalWeightedRate = 0;
  let totalWeightedWarehouse = 0;
  let totalFundedAmount = 0;

  let fundedWithMissingLTV = 0;

  for (const loan of funded) {
    const comp = compMap[loan._id.toString()] || {};

    // Use HELOC credit line amount for 2nd-lien HELOCs, otherwise standard loan amount
    let amount = getLoanAmount(loan);
    if (comp.lienPosition === '2nd' && comp.secondLienType === 'HELOC' && comp.creditLineAmount > 0) {
      amount = comp.creditLineAmount;
    }
    const programType = loan.loanParameters?.selectedProgramId?.programType || '';
    const isARM = comp.amortizationType === 'ARM' || comp.amortizationType === 'Option ARM';
    const isGov = ['fha', 'va', 'usda'].includes(programType);
    const isConventional = programType === 'conventional';
    const isJumboLoan = programType === 'jumbo' || isJumbo(amount);

    // Product Type
    if (isGov && !isARM) result.productType.governmentFixed.count++, result.productType.governmentFixed.amount += amount;
    else if (isGov && isARM) result.productType.governmentARM.count++, result.productType.governmentARM.amount += amount;
    else if (isConventional && !isARM) result.productType.conventionalFixed.count++, result.productType.conventionalFixed.amount += amount;
    else if (isConventional && isARM) result.productType.conventionalARM.count++, result.productType.conventionalARM.amount += amount;
    else if (isJumboLoan && !isARM) result.productType.jumboFixed.count++, result.productType.jumboFixed.amount += amount;
    else if (isJumboLoan && isARM) result.productType.jumboARM.count++, result.productType.jumboARM.amount += amount;
    else if (!isARM) result.productType.otherFixed.count++, result.productType.otherFixed.amount += amount;
    else result.productType.otherARM.count++, result.productType.otherARM.amount += amount;

    // Channel: use fundingMethod for high-level routing, with leadSource as secondary hint
    const channelMap = {
      Brokered: 'brokered',
      'Non-Delegated': 'closedRetail',
      Delegated: 'closedCorrespondent'
    };
    const fm = loan.fundingMethod || 'Brokered';
    let ch = channelMap[fm] || 'closedRetail';
    // For table-funded scenarios, prefer Table-Funded bucket when indicated
    if (loan.leadSource === 'Table-Funded') {
      ch = 'tableFunded';
    }
    result.channel[ch].count++;
    result.channel[ch].amount += amount;

    // Risk Characteristics
    if (loan.docType && loan.docType !== 'Full Doc') {
      result.riskCharacteristics.altDoc.count++;
      result.riskCharacteristics.altDoc.amount += amount;
    }
    if (loan.interestOnlyFlag) {
      result.riskCharacteristics.interestOnly.count++;
      result.riskCharacteristics.interestOnly.amount += amount;
    }
    if (comp.amortizationType === 'Option ARM') {
      result.riskCharacteristics.optionARM.count++;
      result.riskCharacteristics.optionARM.amount += amount;
    }
    if (loan.hasPrepaymentPenalty) {
      result.riskCharacteristics.prepaymentPenalty.count++;
      result.riskCharacteristics.prepaymentPenalty.amount += amount;
    }
    if (loan.hasMortgageInsurance) {
      result.riskCharacteristics.mortgageInsurance.count++;
      result.riskCharacteristics.mortgageInsurance.amount += amount;
    }
    if (loan.isPiggybackSecond) {
      result.riskCharacteristics.piggybackSecond.count++;
      result.riskCharacteristics.piggybackSecond.amount += amount;
    }

    // Purpose
    const loanType = loan.loanDetails?.loanType || '';
    if (loanType === 'Purchase') {
      result.purpose.purchase.count++;
      result.purpose.purchase.amount += amount;
    } else {
      result.purpose.refinance.count++;
      result.purpose.refinance.amount += amount;
    }

    // LTV Distribution with fallback:
    // - Prefer stored financialCalculations.ltv
    // - If missing/zero but we have loanAmount + property value, compute it on the fly
    let ltv = loan.financialCalculations?.ltv || 0;
    if ((!ltv || ltv <= 0) && loan.property?.propertyValue && amount > 0) {
      ltv = (amount / loan.property.propertyValue) * 100;
    }
    if (!ltv || ltv <= 0) {
      fundedWithMissingLTV += 1;
    }
    if (ltv <= 60) { result.ltvDistribution.lt60.count++; result.ltvDistribution.lt60.amount += amount; }
    else if (ltv <= 70) { result.ltvDistribution.lt70.count++; result.ltvDistribution.lt70.amount += amount; }
    else if (ltv <= 80) { result.ltvDistribution.lt80.count++; result.ltvDistribution.lt80.amount += amount; }
    else if (ltv <= 90) { result.ltvDistribution.lt90.count++; result.ltvDistribution.lt90.amount += amount; }
    else if (ltv <= 95) { result.ltvDistribution.lt95.count++; result.ltvDistribution.lt95.amount += amount; }
    else if (ltv <= 100) { result.ltvDistribution.lt100.count++; result.ltvDistribution.lt100.amount += amount; }
    else { result.ltvDistribution.gt100.count++; result.ltvDistribution.gt100.amount += amount; }

    // Weighted average accumulators
    totalWeightedLTV += ltv * amount;
    const rate = comp.finalRate || loan.loanParameters?.interestRate || 0;
    totalWeightedRate += rate * amount;
    totalWeightedWarehouse += (comp.warehousePeriodDays || 0) * amount;
    totalFundedAmount += amount;
  }

  // Weighted averages
  if (totalFundedAmount > 0) {
    result.weightedAverages.ltv = Math.round((totalWeightedLTV / totalFundedAmount) * 100) / 100;
    result.weightedAverages.couponRate = Math.round((totalWeightedRate / totalFundedAmount) * 1000) / 1000;
    result.weightedAverages.warehousePeriod = Math.round(totalWeightedWarehouse / totalFundedAmount);
  }

  // Pull-Through Ratio
  // Applications Received should count loans whose application was received during the period.
  // Prefer compensation.applicationDate, but fall back to other date fields so we don't
  // undercount loans that exist in the period but have incomplete compensation dates.
  const appsInPeriod = loans.filter(l => {
    const c = compMap[l._id.toString()];
    const applicationDate =
      (c && c.applicationDate) ||
      l.loanDetails?.applicationDate ||
      l.applicationDate ||
      l.createdAt;
    return applicationDate && applicationDate >= startDate && applicationDate <= endDate;
  }).length;
  result.pullThrough.appsReceived = appsInPeriod;
  result.pullThrough.loansFunded = funded.length;
  result.pullThrough.ratio = appsInPeriod > 0
    ? Math.round((funded.length / appsInPeriod) * 10000) / 100
    : 0;

  // Attach simple metadata for downstream validation / readiness checks
  result._meta = {
    fundedWithMissingLTV
  };

  return result;
}

/**
 * Get all lenders — admin only, used for "Generate as Loan Officer" feature
 * GET /api/v1/mcr/lenders
 */
exports.getLendersForMCR = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new ApiError('Only admins can list lenders', 403));
    }
    const lenders = await Lender.find({ isActive: { $ne: false } })
      .populate('user', 'firstName lastName email')
      .populate('company', 'companyName')
      .select('user company nmls title')
      .lean();

    const result = lenders.map(l => ({
      _id: l._id,
      name: l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : 'Unknown',
      email: l.user?.email || '',
      nmls: l.nmls || '',
      title: l.title || '',
      companyName: l.company?.companyName || '',
    }));

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// Export internal functions for unit testing
exports._internal = {
  getPeriodDates,
  getFundedLoansInPeriod,
  getLoanAmount,
  calculateApplicationData,
  calculateClosedLoanData,
  calculateRevenueData,
  calculateMLOData,
  calculateRMLAData
};
