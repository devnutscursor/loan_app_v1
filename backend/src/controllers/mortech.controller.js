const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const { createMortechAPI } = require('../services/mortech.service');
const { deriveProductListFromCategory } = require('../utils/mortechProgramMapping');
const { filterRatesByHousingEvent, isHousingEventActive, classifyMortgageProductText } = require('../utils/housingEventSeasoning');
const { filterRatesByBankruptcy, isBankruptcyActive, bankruptcyFilterContextFromBody } = require('../utils/bankruptcySeasoning');
const {
  validateNonOccupantForMortechRequest,
  resolveBorrowersFromMortechBody,
} = require('../utils/nonOccupantCoBorrower');
const {
  applyEscrowWaiverFilter,
  mapMortgageTypeToEscrowLoanType,
} = require('../utils/escrowWaiver');
const {
  validateSelfEmployedNonQmBankStatementLtv,
  shouldPivotToNonQmDocsFromBody,
  filterRatesBySelfEmployedNonQmPivot,
} = require('../utils/selfEmployedProductRouting');
const { fthbRoutingFromBody } = require('../utils/firstTimeHomebuyerProductRouting');
const {
  computeUsdaEligibility,
  isRuralActive,
  filterRatesByRuralUsda,
  resolveUsdaProductIds,
} = require('../utils/ruralUsdaRouting');
const {
  solarRoutingFromBody,
  evaluateSolarRules,
  adjustMortechRequestForSolar,
  resolveNonQmProductIds,
  filterRatesBySolarBlocksAgency,
  validateSolarDetails,
} = require('../utils/solarRouting');
const {
  miRoutingFromBody,
  validateMiDetails,
  adjustMortechRequestForMi,
} = require('../utils/miRouting');
const {
  compensationFromBody,
  validateCompensation,
  applyCompensationToRate,
} = require('../utils/compensationRouting');
const { checkUsdaEligibility } = require('../services/affordableAmi.service');
const { syncMortechCatalog, getUniqueProducts } = require('../services/mortechCatalog.service');
const { MortechProduct } = require('../models/mortechCatalog.model');

const mapLoanPurposeToMortech = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const raw = value.toString().trim();
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const normalized = raw.toLowerCase();
  if (normalized.includes('cash')) return 2;
  if (normalized.includes('rate') || normalized.includes('refi')) return 1;
  return 0;
};

const mapOccupancyToMortech = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const raw = value.toString().trim();
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const normalized = raw.toLowerCase();
  if (normalized.includes('second')) return 2;
  if (normalized.includes('invest') || normalized.includes('non-owner')) return 1;
  return 0;
};

/** Remove Mortech trailing vendor id e.g. "PENNYMAC NON-DELEGATED(6354)" → "PENNYMAC NON-DELEGATED" */
const stripMortechVendorIdSuffix = (name) => {
  if (name == null || typeof name !== 'string') return name ?? '';
  return name.replace(/\s*\(\d+\)\s*$/u, '').trim();
};

const mapPropertyTypeToMortech = (value, attachmentType, numberOfUnits) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const raw = value.toString().trim();
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const normalized = raw.toLowerCase();
  const isDetached = String(attachmentType || '').toLowerCase() === 'detached';
  const units = parseInt(numberOfUnits, 10) || 1;

  // Single Family (1-4 Units) / PUD → always 1-unit SFR (proptype 0)
  // Must be checked BEFORE unit-count substring checks because "1-4 units"
  // contains "4 unit" as a substring which would otherwise match wrongly.
  if (normalized.includes('single family') || normalized.includes('pud')) return 0;

  // Multi-family: use numberOfUnits to pick 2/3/4-unit codes
  if (normalized.includes('multi') || normalized.includes('duplex')) {
    if (units === 2) return 1;
    if (units === 3) return 2;
    if (units === 4) return 3;
    return 1;
  }
  // Explicit unit counts in string (legacy paths)
  if (normalized.includes('2 unit')) return 1;
  if (normalized.includes('3 unit')) return 2;
  if (normalized.includes('4 unit')) return 3;

  if (normalized.includes('co-op') || normalized.includes('cooperative')) return 4;
  if (normalized.includes('manufactured') || normalized.includes('mobile')) return 5;

  // Condo: detached condo (20) vs attached condo (6)
  if (normalized.includes('condo')) return isDetached ? 20 : 6;

  // Townhouse is always attached
  if (normalized.includes('town')) return 15;

  // PUD / Single Family → 0 (1 unit)
  return 0;
};

const normalizeTargetPrice = (value) => {
  if (value === undefined || value === null || value === '') return -999;
  const num = Number(value);
  return Number.isNaN(num) ? -999 : num;
};

const parseTermYears = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).toLowerCase().trim();
  const match = text.match(/\d+/);
  if (!match) return null;
  const years = parseInt(match[0], 10);
  return Number.isNaN(years) ? null : years;
};

const matchesRequestedTerm = (rate, requestedYears) => {
  if (!Number.isFinite(requestedYears)) return true;
  const termFromLoanTerm = parseTermYears(rate.loanTerm);
  const termMatches = Number.isFinite(termFromLoanTerm) ? termFromLoanTerm === requestedYears : false;
  const text = `${rate.productName || ''} ${rate.loanProgram || ''}`.toLowerCase();
  const textMatches =
    text.includes(`${requestedYears} yr fixed`) || text.includes(`${requestedYears} year fixed`);
  return termMatches || textMatches;
};


const buildMortechRequest = (body) => {
  const {
    loan_amount,
    appraisedvalue,
    fico,
    propertyZip,
    propertyState,
    propertyCounty,
    loanpurpose,
    proptype,
    occupancy,
    loanProduct1,
    loanAmount,
    propertyValue,
    creditScore,
    loanPurpose,
    loanTerm,
    productCategory,
    productList: bodyProductList,
    vaFirstTimeUse,
    filterId,
    includeMI = false,
    waiveEscrow = false,
    militaryVeteran = false,
    lockDays,
    secondMortgageAmount = 0,
    targetPrice,
    targetprice,
    view,
    // ─── New PPE fields ───
    downPayment,
    lienPosition,
    cltv,
    closingDate,
    firstPaymentDate,
    taxes,
    insurance,
    firstTimeHomeBuyer,
    selfEmployed,
    amiIlpaWaiver,
    interestOnly,
    lenderPaidYSP,
    parent_id,
    propertyType,
    program,
    annualIncome,
    coverageType,
    includeUpfrontFee,
    attachmentType,
    numberOfUnits,
    mortgageType,
    vaType,
    // ── MI Estimator (per MI Pricing SOP) ──
    // These are forwarded directly by the frontend's miMortechOverrides().
    // Values mirror Mortech's native param names so we can spread them untouched.
    pmiCompany,
    noMI,
    financeMI: bodyFinanceMI,
  } = body;

  const finalLoanAmount = loan_amount || loanAmount;
  const finalPropertyValue = appraisedvalue || propertyValue;
  const finalCreditScore = fico || creditScore || 740;
  const finalLoanPurpose = loanpurpose || loanPurpose || 'Purchase';
  const finalPropertyType = proptype || propertyType || 'Single Family';
  const finalAttachmentType = attachmentType || '';
  const finalNumberOfUnits = numberOfUnits || 1;
  const finalLoanTerm = loanProduct1 || loanTerm || '30 year fixed';
  const finalTargetPrice = normalizeTargetPrice(targetPrice ?? targetprice);
  /** Match loan-officer-platform: productList pricing expects state; default CA when omitted */
  const finalPropertyState = propertyState || 'CA';
  /** Always send lock period (LO uses lockDays + api maps to lockindays=30) */
  const finalLockDays = lockDays || '30';

  const safeSecondMortgageAmount = (() => {
    if (secondMortgageAmount === undefined || secondMortgageAmount === null) return 0;
    if (typeof secondMortgageAmount === 'string') {
      if (secondMortgageAmount === '' || secondMortgageAmount === '0') return 0;
      const parsed = parseInt(secondMortgageAmount, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return secondMortgageAmount;
  })();

  /** Explicit productList from client (comma-separated IDs) overrides category+term mapping. */
  let productList;
  if (bodyProductList != null && String(bodyProductList).trim() !== '') {
    productList = String(bodyProductList).trim();
  }

  let selectedProgramKey;
  if (typeof productCategory === 'string' && productCategory.trim() !== '') {
    const derived = deriveProductListFromCategory(productCategory.trim(), body.loanTerm ?? finalLoanTerm);
    selectedProgramKey = derived.programKey;
    if (!productList && derived.productList) {
      productList = derived.productList;
    }
  }

  // Derive program key from mortgageType string when productCategory is unavailable (productList flow)
  const mortgageTypeKey = (() => {
    const mt = String(mortgageType || '').toLowerCase().trim();
    if (mt === 'fha') return 'fha';
    if (mt === 'va') return 'va';
    if (mt === 'usda') return 'usda';
    return null;
  })();

  const shouldSetFinanceMI = selectedProgramKey === 'fha' || selectedProgramKey === 'va'
    || mortgageTypeKey === 'fha' || mortgageTypeKey === 'va';
  const normalizedVaType = (() => {
    const n = parseInt(vaType, 10);
    return Number.isInteger(n) && n >= 0 && n <= 2 ? String(n) : '0';
  })();

  const safeNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };

  const base = {
    ...(finalPropertyState && { propertyState: finalPropertyState }),
    propertyZip,
    ...(propertyCounty && { propertyCounty }),
    appraisedvalue: finalPropertyValue,
    loan_amount: finalLoanAmount,
    ...(safeNum(downPayment) > 0 && { downPayment: safeNum(downPayment) }),
    fico: finalCreditScore,
    loanpurpose: mapLoanPurposeToMortech(finalLoanPurpose),
    proptype: mapPropertyTypeToMortech(finalPropertyType, finalAttachmentType, finalNumberOfUnits),
    occupancy: mapOccupancyToMortech(occupancy || 'Primary'),
    targetPrice: finalTargetPrice,

    // Lien position: 1=first (default), 2=second
    ...(lienPosition && String(lienPosition) === '2' && { lienPosition: 2 }),

    // NOTE: intentionally omitting DTIPercent from outbound Mortech request for now.

    // CLTV (decimal, e.g. 0.97)
    ...(safeNum(cltv) > 0 && { cltv: safeNum(cltv) }),

    // Closing & payment dates
    ...(closingDate && { closingDate }),
    ...(firstPaymentDate && { firstPaymentDate }),

    // Monthly taxes & insurance
    ...(safeNum(taxes) > 0 && { taxes: safeNum(taxes) }),
    ...(safeNum(insurance) > 0 && { insurance: safeNum(insurance) }),

    // Borrower flags
    ...(firstTimeHomeBuyer === 1 && { firstTimeHomeBuyer: 1 }),
    ...(selfEmployed === 1 && { selfEmployed: 1 }),
    ...(amiIlpaWaiver === 1 && { amiIlpaWaiver: 1 }),

    // Interest-only
    ...(interestOnly === 1 && { interestOnly: 1 }),

    // Lender-paid compensation
    ...(lenderPaidYSP === 1 && { lenderPaidYSP: 1 }),

    // Restrict to specific investors
    ...(parent_id && { parent_id }),

    // Subordinate financing: 0=None, 1=Sub fin, 2=Community second
    ...(safeNum(program) >= 0 && { program: safeNum(program) }),

    // Borrower annual income (for AMI / affordable program evaluation)
    ...(safeNum(annualIncome) > 0 && { annualIncome: safeNum(annualIncome) }),

    // MI coverage type: 1=Monthly, 16=Single, 19622=Single refundable
    ...(safeNum(coverageType) > 0 && { coverageType: safeNum(coverageType) }),

    // Include FHA MIP / VA funding fee in fee_list
    ...(includeUpfrontFee === true && { includeUpfrontFee: true }),

    // MI
    ...(Number.isFinite(view) && { view }),
    ...(filterId && { filterId }),
    // ─── Mortgage Insurance (MI) Estimator — MI Pricing SOP ───
    // The frontend's miMortechOverrides() sends pmiCompany / noMI / financeMI
    // directly on the request body. Pass them through when present. Values of
    // -999 (Best Execution) and 0 (Standard / do-not-finance) are meaningful,
    // so we guard on `!== undefined` rather than truthiness.
    ...(pmiCompany !== undefined && Number.isFinite(Number(pmiCompany)) && {
      pmiCompany: Number(pmiCompany),
    }),
    ...(noMI !== undefined && Number.isFinite(Number(noMI)) && { noMI: Number(noMI) }),
    // Legacy fallback: `includeMI: true` → Best Execution + Standard coverage.
    // Still honoured when miDetails / pmiCompany weren't provided.
    ...(includeMI && pmiCompany === undefined && noMI === undefined && {
      pmiCompany: -999,
      noMI: 0,
    }),

    // Escrow
    ...(waiveEscrow === true && { waiveescrow: 1 }),
    ...(militaryVeteran === true && { militaryVeteran: true }),

    lockindays: finalLockDays,
    ...(safeSecondMortgageAmount > 0 && { secondMortgageAmount: safeSecondMortgageAmount }),
    ...(productList ? { productList } : { loanProduct1: finalLoanTerm }),
    // FHA / VA auto-finance upfront MI/funding fee. For MI-estimator conventional
    // loans we honour the explicit `financeMI` from the body (only sent when
    // the user chose Single-Premium MI with Finance MI checked).
    ...(shouldSetFinanceMI && { financeMI: 1 }),
    ...(!shouldSetFinanceMI &&
      bodyFinanceMI !== undefined &&
      Number.isFinite(Number(bodyFinanceMI)) &&
      Number(bodyFinanceMI) === 1 && { financeMI: 1 }),
    ...((selectedProgramKey === 'va' || mortgageTypeKey === 'va') && {
      vaType: normalizedVaType,
      subsequentUse: vaFirstTimeUse === false ? 1 : 0,
    }),
  };

  return base;
};

exports.searchRates = catchAsync(async (req, res, next) => {
  const mortechRequest = buildMortechRequest(req.body);
  const bodyLoanTerm = req.body.loanTerm || req.body.loanProduct1;

  logger.info(
    `[mortech/search] POST payload: ${JSON.stringify({
      productCategory: req.body.productCategory,
      loanTerm: req.body.loanTerm,
      productList: mortechRequest.productList,
      loanProduct1: mortechRequest.loanProduct1,
      financeMI: mortechRequest.financeMI,
      vaType: mortechRequest.vaType,
      subsequentUse: mortechRequest.subsequentUse,
      propertyState: mortechRequest.propertyState,
      propertyCounty: mortechRequest.propertyCounty,
      lockindays: mortechRequest.lockindays,
      noMI: mortechRequest.noMI,
      propertyZip: mortechRequest.propertyZip,
      loan_amount: mortechRequest.loan_amount,
      appraisedvalue: mortechRequest.appraisedvalue,
      downPayment: mortechRequest.downPayment,
      fico: mortechRequest.fico,
      loanpurpose: mortechRequest.loanpurpose,
      proptype: mortechRequest.proptype,
      occupancy: mortechRequest.occupancy,
      lienPosition: mortechRequest.lienPosition,
      cltv: mortechRequest.cltv,
      closingDate: mortechRequest.closingDate,
      taxes: mortechRequest.taxes,
      insurance: mortechRequest.insurance,
      firstTimeHomeBuyer: mortechRequest.firstTimeHomeBuyer,
      selfEmployed: mortechRequest.selfEmployed,
      amiIlpaWaiver: mortechRequest.amiIlpaWaiver,
      interestOnly: mortechRequest.interestOnly,
      lenderPaidYSP: mortechRequest.lenderPaidYSP,
      waiveescrow: mortechRequest.waiveescrow,
      parent_id: mortechRequest.parent_id,
      program: mortechRequest.program,
      annualIncome: mortechRequest.annualIncome,
      coverageType: mortechRequest.coverageType,
      includeUpfrontFee: mortechRequest.includeUpfrontFee,
      pmiCompany: mortechRequest.pmiCompany,
    })}`
  );

  if (!mortechRequest.loan_amount || !mortechRequest.appraisedvalue || !mortechRequest.propertyZip) {
    return next(
      new ApiError('Missing required parameters: loan amount, property value, property zip', 400)
    );
  }

  const unitCountForNoc =
    parseInt(req.body.numberOfUnits, 10) || parseInt(req.body.unitCount, 10) || 1;
  const ltvFromBody = Number(req.body.ltv);
  const appr = Number(req.body.appraisedvalue) || 0;
  const lamt = Number(req.body.loan_amount) || 0;
  const ltvPct = Number.isFinite(ltvFromBody)
    ? ltvFromBody
    : appr > 0
      ? (lamt / appr) * 100
      : 0;
  const nocBorrowers = resolveBorrowersFromMortechBody(req.body);
  const nocCheck = validateNonOccupantForMortechRequest(
    ltvPct,
    unitCountForNoc,
    nocBorrowers,
    req.body.mortgageType
  );
  if (!nocCheck.skipped && nocCheck.eligible === false) {
    return next(new ApiError(nocCheck.reason || 'Non-occupant co-borrower not eligible for pricing.', 400));
  }

  const escrowWaived =
    req.body.waiveEscrow === true ||
    req.body.waiveEscrow === 1 ||
    req.body.escrowWaived === true ||
    req.body.escrowWaived === 1;
  const escLoanType = mapMortgageTypeToEscrowLoanType(req.body.mortgageType);
  const escCheck = applyEscrowWaiverFilter(escLoanType, ltvPct, escrowWaived);
  if (!escCheck.eligible) {
    return next(new ApiError(escCheck.reason || 'Escrow waiver not eligible for pricing.', 400));
  }

  const sePivot = shouldPivotToNonQmDocsFromBody(req.body);
  const seLtvCheck = validateSelfEmployedNonQmBankStatementLtv(ltvPct, sePivot);
  if (sePivot && !seLtvCheck.eligible) {
    return next(new ApiError(seLtvCheck.reason || 'Self-employed documentation routing: LTV not eligible.', 400));
  }

  // ─── Solar (PACE / Lease) — re-evaluate server-side (never trust client) ───
  const solar = solarRoutingFromBody(req.body);
  const solarValidation = solar ? validateSolarDetails(solar) : { ok: true, errors: {} };
  if (solar && !solarValidation.ok) {
    const firstErr = Object.values(solarValidation.errors)[0] || 'Solar / PACE details incomplete.';
    return next(new ApiError(firstErr, 400));
  }
  const solarEval = solar ? evaluateSolarRules(solar) : null;
  // ─── Rural / USDA RD pivot ───
  // Priority rules (per spec):
  //   1. Self-employed Non-QM pivot wins → Rural is ignored when sePivot is active.
  //   2. Solar S1 (PACE remains) forces Non-QM → Rural's USDA override is skipped.
  //   3. Otherwise, Rural triggers a hard USDA eligibility check BEFORE calling Mortech.
  let ruralUsdaInfo = null;
  if (isRuralActive(req.body) && !sePivot && !(solarEval && solarEval.blocksAgency)) {
    const usdaEligibility = await checkUsdaEligibility({
      borrowerIncome: req.body.annualIncome,
      propertyState: req.body.propertyState,
      propertyCounty: req.body.propertyCounty,
      propertyZip: req.body.propertyZip,
      occupancy: req.body.occupancy,
    });
    if (!usdaEligibility.eligible) {
      const reason =
        usdaEligibility.reasons && usdaEligibility.reasons[0]
          ? usdaEligibility.reasons[0]
          : 'USDA RD eligibility check failed.';
      return next(new ApiError(reason, 400));
    }
    const usdaProducts = await resolveUsdaProductIds(MortechProduct);
    const usdaProductIds = usdaProducts.map((p) => p.productId).filter(Boolean);
    if (usdaProductIds.length === 0) {
      return next(
        new ApiError(
          'USDA RD eligible but no USDA products are available in the Mortech catalog. Please run a catalog sync.',
          400
        )
      );
    }
    // Override productList + downPayment. Keep existing borrower flags intact.
    mortechRequest.productList = usdaProductIds.join(',');
    mortechRequest.downPayment = 0;
    delete mortechRequest.loanProduct1;
    ruralUsdaInfo = {
      eligible: true,
      countyLimit: usdaEligibility.countyLimit,
      cap: usdaEligibility.cap,
      borrowerIncome: usdaEligibility.borrowerIncome,
      productCount: usdaProductIds.length,
      productIds: usdaProductIds,
    };
  }

  // ─── Solar mutations: tag custom fields, apply S1 (Non-QM only) and S2 (LTV) ───
  let solarInfo = null;
  if (solar) {
    const baseLoanAmount = Number(req.body.loan_amount) || Number(mortechRequest.loan_amount) || 0;
    let nonQmProductIds = [];
    if (solarEval && solarEval.blocksAgency) {
      const nonQmRows = await resolveNonQmProductIds(MortechProduct);
      nonQmProductIds = (nonQmRows || []).map((p) => p.productId).filter(Boolean);
    }
    solarInfo = adjustMortechRequestForSolar(mortechRequest, solar, {
      baseLoanAmount,
      nonQmProductIds,
    });
    const effLtv =
      mortechRequest.appraisedvalue > 0
        ? (mortechRequest.loan_amount / mortechRequest.appraisedvalue) * 100
        : 0;
    logger.info(
      `[SOLAR-DEBUG] ${JSON.stringify({
        hasPaceLien: solar.hasPaceLien,
        pacePayoff: solar.pacePayoff,
        paceLienBalance: solar.paceLienBalance,
        hasLease: solar.hasLease,
        leaseAssumed: solar.leaseAssumed,
        monthlyLeasePayment: solar.monthlyLeasePayment,
        blocksAgency: solarEval ? solarEval.blocksAgency : false,
        dtiAddBack: solarEval ? solarEval.dtiAddBack : 0,
        financedPaceAmount: solarEval ? solarEval.financedPaceAmount : 0,
        noteIncludesFinancedPace: !!solar.noteIncludesFinancedPace,
        effectiveLoanAmount: mortechRequest.loan_amount,
        effectiveLtv: Number(effLtv.toFixed(2)),
        nonQmProductIds_count: nonQmProductIds.length,
      })}`
    );
  }

  // ─── MI Estimator (Mortech MI Pricing SOP) ───
  // Runs AFTER product-routing (SE / Rural / Solar) because those rules decide
  // the product lane; MI only layers pricing parameters. MI is only applied
  // when the loan is still in-scope (conv + LTV > 80) and the LO enabled it.
  const miFromBody = miRoutingFromBody(req.body);
  const miValidation = miFromBody
    ? validateMiDetails(miFromBody, { ltv: ltvPct })
    : { ok: true, errors: {} };
  if (miFromBody && !miValidation.ok) {
    const firstErr = Object.values(miValidation.errors)[0] || 'Mortgage Insurance details are invalid.';
    return next(new ApiError(firstErr, 400));
  }
  let miInfo = null;
  if (miFromBody) {
    // Ignore MI when SE Non-QM pivot or Solar-blocks-agency has forced Non-QM,
    // or when Rural USDA pivot has taken over — MI is irrelevant in those lanes.
    const miSuppressed =
      sePivot ||
      (solarEval && solarEval.blocksAgency) ||
      !!ruralUsdaInfo;
    if (!miSuppressed) {
      miInfo = adjustMortechRequestForMi(mortechRequest, miFromBody, {
        ltv: ltvPct,
        mortgageType: req.body.mortgageType,
      });
      if (miInfo) {
        logger.info(
          `[MI-DEBUG] ${JSON.stringify({
            pmiCompany: mortechRequest.pmiCompany,
            noMI: mortechRequest.noMI,
            financeMI: mortechRequest.financeMI,
            coverageType: mortechRequest.coverageType,
            mortgageType: req.body.mortgageType,
            ltv: Number((ltvPct || 0).toFixed(2)),
            estimatedMonthlyPremium: miFromBody.estimatedMonthlyPremium,
          })}`
        );
      }
    } else {
      miInfo = { suppressed: true, reason: 'MI ignored — Non-QM / USDA lane active.' };
    }
  }

  // Client requirement: Non-QM pricing is not available.
  // Treat Non-QM catalog products as placeholders and do not call Mortech.
  const nonQmDisclaimer =
    'Non-QM pricing is not available in the system. Please contact the investor directly for accurate pricing.';
  if (mortechRequest.productList) {
    const firstId = String(mortechRequest.productList).split(',')[0].trim();
    if (firstId) {
      const p = await MortechProduct.findOne({ productId: firstId, isActive: true })
        .select('name productId')
        .lean();
      if (p && classifyMortgageProductText(p.name) === 'nonQm') {
        return res.status(200).json({
          success: true,
          rates: [],
          ratesCount: 0,
          source: 'non_qm_placeholder',
          isMockData: true,
          nonQm: true,
          message: nonQmDisclaimer,
          searchParams: {
            loanAmount: mortechRequest.loan_amount,
            propertyValue: mortechRequest.appraisedvalue,
            creditScore: mortechRequest.fico,
            propertyZip: mortechRequest.propertyZip,
            loanPurpose: mortechRequest.loanpurpose,
            propertyType: mortechRequest.proptype,
            occupancy: mortechRequest.occupancy,
            loanTerm: bodyLoanTerm,
            loanProduct1: mortechRequest.loanProduct1,
            productCategory: req.body.productCategory,
            productList: mortechRequest.productList,
            lockindays: mortechRequest.lockindays,
            lockDays: mortechRequest.lockindays || '30',
          },
        });
      }
    }
  }

  const mortechAPI = createMortechAPI();
  const response = await mortechAPI.getRates(mortechRequest);

  if (!response.success) {
    const detail = response.error || 'Failed to fetch rates from Mortech';
    logger.error(`[mortech/search] Mortech call failed: ${detail}`);
    return next(new ApiError(detail, 502));
  }

  const transformedRatesRaw = (response.quotes || []).map((quote) => ({
    id: quote.productId,
    lenderName: stripMortechVendorIdSuffix(quote.vendorName),
    productName: quote.vendorProductCode || quote.vendorProductName || quote.productName,
    loanProgram: quote.productDesc,
    loanType: quote.termType,
    loanTerm: quote.productTerm,
    interestRate: quote.rate,
    apr: quote.apr,
    monthlyPayment: quote.monthlyPayment,
    points: quote.points,
    originationFee: quote.originationFee,
    upfrontFee: quote.upfrontFee,
    monthlyPremium: quote.monthlyPremium,
    downPayment: quote.downPayment,
    loanAmount: quote.loanAmount,
    lockTerm: quote.lockTerm,
    pricingStatus: quote.pricingStatus,
    lastUpdate: quote.lastUpdate,
    prepayType: quote.prepayType || null,
    ratesheetPrice: quote.ratesheetPrice ?? null,
    srp: quote.srp ?? null,
    adjustments: quote.adjustments || [],
    specialBonusAdj: quote.specialBonusAdj ?? null,
    costsAndProfit: quote.costsAndProfit || null,
    borrowerRebate: quote.borrowerRebate ?? null,
    fees: (quote.fees || []).map((fee) => ({
      hudline: fee.hudline || '',
      description: fee.description,
      amount: fee.feeamount,
      section: fee.section,
      paymentType: fee.paymenttype,
      prepaid: fee.prepaid,
    })),
    eligibility: quote.eligibility,
    credits: 0,
    lockPeriod: quote.lockTerm,
  }));

  const requestedYears = parseTermYears(bodyLoanTerm || req.body.loanTerm);
  const termFilteredRates = transformedRatesRaw.filter((rate) =>
    matchesRequestedTerm(rate, requestedYears)
  );
  const requestedProductIds = String(mortechRequest.productList || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  // Match RateCaddy behavior: when productList is provided, use raw Mortech quotes as-is
  // (do not locally re-filter by product_id, because Mortech can legitimately return
  // related family rows for a base product id).
  const candidateRates =
    requestedProductIds.length > 0
      ? transformedRatesRaw
      : (termFilteredRates.length > 0 ? termFilteredRates : transformedRatesRaw);

  let transformedRates = candidateRates;

  if (isHousingEventActive(req.body)) {
    transformedRates = filterRatesByHousingEvent(transformedRates, {
      eventType: req.body.housingEventType,
      eventDate: req.body.housingEventDate,
      asOf: new Date(),
    });
  }

  if (isBankruptcyActive(req.body)) {
    const bkCtx = bankruptcyFilterContextFromBody(req.body);
    if (bkCtx) {
      transformedRates = filterRatesByBankruptcy(transformedRates, bkCtx);
    }
  }

  if (shouldPivotToNonQmDocsFromBody(req.body)) {
    transformedRates = filterRatesBySelfEmployedNonQmPivot(transformedRates);
  }

  if (ruralUsdaInfo) {
    transformedRates = filterRatesByRuralUsda(transformedRates);
  }

  // Solar RULE S1 post-filter: if Agency is blocked, keep only Non-QM rates.
  if (solar) {
    transformedRates = filterRatesBySolarBlocksAgency(transformedRates, solar);
  }

  // ─── Compensation (BPC / LPC) — per Compensation Type SOP ───
  // Runs LAST. Purely post-processing: thins the displayed price and
  // appends a Section A PFC when BPC is active. Mortech never sees the
  // comp percentages — they are applied entirely on our side.
  const compFromBody = compensationFromBody(req.body);
  const compValidation = compFromBody
    ? validateCompensation(compFromBody)
    : { ok: true, errors: {} };
  if (compFromBody && !compValidation.ok) {
    const firstErr =
      Object.values(compValidation.errors)[0] || 'Broker compensation values are invalid.';
    return next(new ApiError(firstErr, 400));
  }
  let compensationInfo = null;
  if (compFromBody) {
    const compPayerRaw = req.body.compPayer || 'Borrower Paid';
    const termYrs = parseTermYears(bodyLoanTerm || req.body.loanTerm) || 30;
    const logBpcAprDetail =
      process.env.LOG_BPC_APR_DETAIL === '1' ||
      process.env.LOG_BPC_APR === '1' ||
      req.body?.debugBpcApr === true;
    const debugBpcAprInterestRate = req.body?.debugBpcAprInterestRate;
    let bpcAprDetailLogs = 0;
    const maxBpcAprDetailLogs =
      Number(process.env.LOG_BPC_APR_DETAIL_MAX) > 0
        ? Math.min(50, Number(process.env.LOG_BPC_APR_DETAIL_MAX))
        : 5;

    transformedRates = transformedRates.map((rate, rateIdx) => {
      const isBorrowerComp = String(compPayerRaw || '')
        .toLowerCase()
        .includes('borrower');
      const enriched = applyCompensationToRate({
        rate,
        loanAmount: mortechRequest.loan_amount,
        compPayer: compPayerRaw,
        compensation: compFromBody,
        termYears: termYrs,
        includeAprAudit: logBpcAprDetail && isBorrowerComp,
      });

      if (logBpcAprDetail && enriched.isBpc && enriched.aprCalculationDebug) {
        const wantIr = Number(debugBpcAprInterestRate);
        const rowIr = Number(enriched.interestRate);
        const interestMatch =
          Number.isFinite(wantIr) && Number.isFinite(rowIr) && Math.abs(rowIr - wantIr) < 1e-6;
        const shouldLog =
          bpcAprDetailLogs < maxBpcAprDetailLogs &&
          (Number.isFinite(wantIr) ? interestMatch : true);
        if (shouldLog) {
          bpcAprDetailLogs += 1;
          logger.info(
            `[BPC-APR-DETAIL] row=${rateIdx} ${JSON.stringify({
              interestRate: enriched.interestRate,
              investor: enriched.lenderName || enriched.investor || null,
              product: enriched.loanProduct || enriched.product || null,
              ...enriched.aprCalculationDebug,
            })}`
          );
        }
        delete enriched.aprCalculationDebug;
      } else if (enriched.aprCalculationDebug) {
        delete enriched.aprCalculationDebug;
      }
      return enriched;
    });
    const sampleSectionAFee =
      compPayerRaw.toLowerCase().includes('borrower') && mortechRequest.loan_amount
        ? Number(
            ((Number(mortechRequest.loan_amount) * Number(compFromBody.borrowerPaidFeePct)) /
              100).toFixed(2)
          )
        : 0;
    compensationInfo = {
      type: compPayerRaw,
      thinPct: compFromBody.lenderPaidDefaultPct,
      feePct: compFromBody.borrowerPaidFeePct,
      sectionAFee: sampleSectionAFee,
      bpcEqualsLpc: compFromBody.bpcEqualsLpc,
      rowsTouched: transformedRates.length,
    };
    logger.info(
      `[COMP-DEBUG] ${JSON.stringify({
        compPayer: compPayerRaw,
        thinPct: compFromBody.lenderPaidDefaultPct,
        feePct: compFromBody.borrowerPaidFeePct,
        loanAmount: mortechRequest.loan_amount,
        sectionAFee: sampleSectionAFee,
        rows: transformedRates.length,
        bpcAprDetailLogging:
          process.env.LOG_BPC_APR_DETAIL === '1' ||
          process.env.LOG_BPC_APR === '1' ||
          req.body?.debugBpcApr === true,
        hint: 'Set LOG_BPC_APR_DETAIL=1 or pass body.debugBpcApr:true (+ optional debugBpcAprInterestRate) for [BPC-APR-DETAIL] rows.',
      })}`
    );
  }

  res.status(200).json({
    success: true,
    rates: transformedRates,
    ratesCount: transformedRates.length,
    source: 'mortech_api',
    isMockData: false,
    searchParams: {
      loanAmount: mortechRequest.loan_amount,
      propertyValue: mortechRequest.appraisedvalue,
      creditScore: mortechRequest.fico,
      propertyZip: mortechRequest.propertyZip,
      loanPurpose: mortechRequest.loanpurpose,
      propertyType: mortechRequest.proptype,
      occupancy: mortechRequest.occupancy,
      loanTerm: bodyLoanTerm,
      loanProduct1: mortechRequest.loanProduct1,
      productCategory: req.body.productCategory,
      productList: mortechRequest.productList,
      financeMI: mortechRequest.financeMI,
      vaType: mortechRequest.vaType,
      subsequentUse: mortechRequest.subsequentUse,
      propertyState: mortechRequest.propertyState,
      lockindays: mortechRequest.lockindays,
      noMI: mortechRequest.noMI,
      lockDays: mortechRequest.lockindays || '30',
      fthbProductRouting: fthbRoutingFromBody(req.body),
      ruralRouting: ruralUsdaInfo,
      solar: solarInfo,
      mi: miInfo,
      compensation: compensationInfo,
      pmiCompany: mortechRequest.pmiCompany,
    },
  });
});

exports.catalogProducts = catchAsync(async (req, res) => {
  const products = await getUniqueProducts();
  res.status(200).json({ success: true, products, count: products.length });
});

exports.catalogUsdaProducts = catchAsync(async (req, res) => {
  const products = await resolveUsdaProductIds(MortechProduct);
  res.status(200).json({ success: true, products, count: products.length });
});

exports.catalogSync = catchAsync(async (req, res, next) => {
  try {
    const result = await syncMortechCatalog();
    logger.info(`[mortech/catalog/sync] Manual sync: ${result.investors} investors, ${result.products} products`);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error(`[mortech/catalog/sync] Sync failed: ${err.message}`);
    return next(new ApiError(`Catalog sync failed: ${err.message}`, 502));
  }
});
