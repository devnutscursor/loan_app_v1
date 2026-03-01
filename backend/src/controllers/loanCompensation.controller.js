const LoanCompensation = require('../models/loanCompensation.model');
const Loan = require('../models/loan.model');
const LoanStatusHistory = require('../models/loanStatusHistory.model');
const Borrower = require('../models/borrower.model');
const ApiError = require('../utils/apiError');

/**
 * Get compensation data for a loan
 * Used by: Audit & Dates tab, Funding/Revenue tab, MCR Data Audit tab
 */
exports.getCompensation = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    // Verify user has access to this loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }

    // Get or create compensation record — use save() to trigger auto-fill hook
    let compensation = await LoanCompensation.findOne({ loan: loanId });
    if (!compensation) {
      compensation = new LoanCompensation({ loan: loanId });
      await compensation.save(); // triggers pre-save auto-fill
    }

    res.status(200).json({
      status: 'success',
      data: compensation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update compensation data for a loan
 * Used by: Audit & Dates tab (dates), Funding/Revenue tab (financial data)
 */
exports.updateCompensation = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    // Verify user has access to this loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }

    // Get or create, apply updates, then save() to trigger auto-fill hook
    let compensation = await LoanCompensation.findOne({ loan: loanId });
    if (!compensation) {
      compensation = new LoanCompensation({ loan: loanId });
    }
    // Apply request body fields
    Object.assign(compensation, req.body, { loan: loanId });
    await compensation.save(); // triggers pre-save auto-fill (loanRevenue calc, date derivations, etc.)

    res.status(200).json({
      status: 'success',
      data: compensation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync MCR defaults for an existing loan.
 * Backfills MCR classification fields on the Loan model that weren't set when the loan was created,
 * and triggers LoanCompensation auto-fill for derived fields.
 * Also backfills audit dates from status history if available.
 * 
 * POST /api/v1/loan-compensation/:loanId/sync-mcr
 */
exports.syncMCRDefaults = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }

    let loanChanged = false;

    // --- Backfill MCR classification defaults on Loan ---
    const defaults = {
      leadSource: 'Retail',
      docType: 'Full Doc',
      qmStatus: 'QM-Safe Harbor',
    };
    for (const [field, defaultVal] of Object.entries(defaults)) {
      if (loan[field] === undefined || loan[field] === null || loan[field] === '') {
        loan[field] = defaultVal;
        loanChanged = true;
      }
    }

    // --- Backfill property address from borrower's current address if missing ---
    if (!loan.property?.state || !loan.property?.city) {
      try {
        // First try loan.borrowerDetails.currentAddress (stored on loan itself)
        const borrowerAddr = loan.borrowerDetails?.currentAddress || {};
        let addrFound = false;
        
        if (!loan.property) loan.property = {};
        if (!loan.property.state && borrowerAddr.state) {
          loan.property.state = borrowerAddr.state;
          loanChanged = true;
          addrFound = true;
        }
        if (!loan.property.city && borrowerAddr.city) {
          loan.property.city = borrowerAddr.city;
          loanChanged = true;
          addrFound = true;
        }
        if (!loan.property.streetAddress && borrowerAddr.streetAddress) {
          loan.property.streetAddress = borrowerAddr.streetAddress;
          loanChanged = true;
          addrFound = true;
        }

        // If borrowerDetails didn't have it, try the Borrower model's primaryAddress
        if (!addrFound) {
          const borrower = await Borrower.findById(loan.borrower).lean();
          if (borrower?.primaryAddress) {
            if (!loan.property.state && borrower.primaryAddress.state) {
              loan.property.state = borrower.primaryAddress.state;
              loanChanged = true;
            }
            if (!loan.property.city && borrower.primaryAddress.city) {
              loan.property.city = borrower.primaryAddress.city;
              loanChanged = true;
            }
            if (!loan.property.streetAddress && borrower.primaryAddress.addressLine1) {
              loan.property.streetAddress = borrower.primaryAddress.addressLine1;
              loanChanged = true;
            }
          }
        }
      } catch (addrErr) {
        console.error('Could not backfill property address:', addrErr.message);
      }
    }

    // --- Backfill property type default if missing ---
    if (!loan.property?.propertyType) {
      if (!loan.property) loan.property = {};
      loan.property.propertyType = 'Single Family Home';
      loanChanged = true;
    }

    // Save loan (triggers the MCR auto-fill pre-save hook for isReverseMortgage, hasMortgageInsurance, qmStatus heuristics)
    if (loanChanged) {
      loan.markModified('property');
      await loan.save();
    }

    // --- Backfill audit dates from status history ---
    let comp = await LoanCompensation.findOne({ loan: loanId });
    if (!comp) {
      comp = new LoanCompensation({ loan: loanId });
    }

    const history = await LoanStatusHistory.find({ loan: loanId }).sort({ createdAt: 1 }).lean();
    const dateMap = {
      'Application Submitted': 'applicationDate',
      'Conditional Approval': 'approvalDate',
      'Clear to Close': 'clearToCloseDate',
      'Declined': 'denialDate',
      'Withdrawn': 'withdrawnDate',
      'Closed-Incomplete': 'closedIncompleteDate',
      'Closed': 'closingDate',
      'Funded': 'fundedDate'
    };

    for (const entry of history) {
      const dateField = dateMap[entry.newStatus];
      if (dateField && !comp[dateField]) {
        comp[dateField] = entry.createdAt;
      }
    }

    // If no status history but loan has a status that implies a date, backfill from loan timestamps
    if (!comp.applicationDate && ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval',
        'Clear to Close', 'Closed', 'Funded', 'Declined', 'Withdrawn', 'Closed-Incomplete'].includes(loan.status)) {
      comp.applicationDate = loan.createdAt;
    }

    await comp.save(); // triggers auto-fill for finalRate, amortizationType, lienPosition, noteDate, firstPaymentDate, etc.

    // Return updated data
    const updatedLoan = await Loan.findById(loanId).lean();
    const updatedComp = await LoanCompensation.findOne({ loan: loanId }).lean();

    res.status(200).json({
      status: 'success',
      data: {
        loan: updatedLoan,
        compensation: updatedComp,
        synced: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get status history for a loan
 * Used by: Audit & Dates tab (status history table)
 */
exports.getStatusHistory = async (req, res, next) => {
  try {
    const { loanId } = req.params;

    const history = await LoanStatusHistory.find({ loan: loanId })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'firstName lastName email role')
      .lean();

    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
};
