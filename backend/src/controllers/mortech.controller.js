const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const { createMortechAPI } = require('../services/mortech.service');
const { deriveProductListFromCategory } = require('../utils/mortechProgramMapping');
const { syncMortechCatalog, getUniqueProducts } = require('../services/mortechCatalog.service');

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
    DTIPercent,
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

    // DTI percent (integer, e.g. 30 = 30%)
    ...(safeNum(DTIPercent) > 0 && { DTIPercent: safeNum(DTIPercent) }),

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
    ...(includeMI && { pmiCompany: -999, noMI: 0 }),

    // Escrow
    ...(waiveEscrow === true && { waiveescrow: 1 }),
    ...(militaryVeteran === true && { militaryVeteran: true }),

    lockindays: finalLockDays,
    ...(safeSecondMortgageAmount > 0 && { secondMortgageAmount: safeSecondMortgageAmount }),
    ...(productList ? { productList } : { loanProduct1: finalLoanTerm }),
    ...(shouldSetFinanceMI && { financeMI: 1 }),
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
      DTIPercent: mortechRequest.DTIPercent,
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
    })}`
  );

  if (!mortechRequest.loan_amount || !mortechRequest.appraisedvalue || !mortechRequest.propertyZip) {
    return next(
      new ApiError('Missing required parameters: loan amount, property value, property zip', 400)
    );
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

  const transformedRates = candidateRates;

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
    },
  });
});

exports.catalogProducts = catchAsync(async (req, res) => {
  const products = await getUniqueProducts();
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
