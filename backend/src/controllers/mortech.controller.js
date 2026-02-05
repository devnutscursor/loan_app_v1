const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const { createMortechAPI } = require('../services/mortech.service');

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

const mapPropertyTypeToMortech = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const raw = value.toString().trim();
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const normalized = raw.toLowerCase();
  if (normalized.includes('2 unit')) return 1;
  if (normalized.includes('3 unit')) return 2;
  if (normalized.includes('4 unit')) return 3;
  if (normalized.includes('co-op')) return 4;
  if (normalized.includes('manufactured')) return 5;
  if (normalized.includes('condo') && normalized.includes('detached')) return 20;
  if (normalized.includes('condo')) return 6;
  if (normalized.includes('town')) return 15;
  return 0;
};

const normalizeTargetPrice = (value) => {
  if (value === undefined || value === null || value === '') return -999;
  const num = Number(value);
  return Number.isNaN(num) ? -999 : num;
};

const buildMortechRequest = (body) => {
  const {
    loan_amount,
    appraisedvalue,
    fico,
    propertyZip,
    loanpurpose,
    proptype,
    occupancy,
    loanProduct1,
    loanAmount,
    propertyValue,
    creditScore,
    loanPurpose,
    propertyType,
    loanTerm,
    filterId,
    includeMI = false,
    waiveEscrow = false,
    militaryVeteran = false,
    lockDays = '30',
    secondMortgageAmount = 0,
    targetPrice,
    targetprice,
    view,
  } = body;

  const finalLoanAmount = loan_amount || loanAmount;
  const finalPropertyValue = appraisedvalue || propertyValue;
  const finalCreditScore = fico || creditScore || 740;
  const finalLoanPurpose = loanpurpose || loanPurpose || 'Purchase';
  const finalPropertyType = proptype || propertyType || 'Single Family';
  const finalLoanTerm = loanProduct1 || loanTerm || '30 year fixed';
  const finalTargetPrice = normalizeTargetPrice(targetPrice ?? targetprice);

  const safeSecondMortgageAmount = (() => {
    if (secondMortgageAmount === undefined || secondMortgageAmount === null) return 0;
    if (typeof secondMortgageAmount === 'string') {
      if (secondMortgageAmount === '' || secondMortgageAmount === '0') return 0;
      const parsed = parseInt(secondMortgageAmount, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return secondMortgageAmount;
  })();

  return {
    propertyZip,
    appraisedvalue: finalPropertyValue,
    loan_amount: finalLoanAmount,
    fico: finalCreditScore,
    loanpurpose: mapLoanPurposeToMortech(finalLoanPurpose),
    proptype: mapPropertyTypeToMortech(finalPropertyType),
    occupancy: mapOccupancyToMortech(occupancy || 'Primary'),
    loanProduct1: finalLoanTerm,
    targetPrice: finalTargetPrice,
    ...(Number.isFinite(view) && { view }),
    ...(filterId && { filterId }),
    ...(includeMI && { pmiCompany: -999, noMI: 0 }),
    ...(waiveEscrow === true && { waiveescrow: 1 }),
    ...(militaryVeteran === true && { militaryVeteran: true }),
    ...(lockDays && lockDays !== '30' && { lockindays: lockDays }),
    ...(safeSecondMortgageAmount > 0 && { secondMortgageAmount: safeSecondMortgageAmount }),
  };
};

exports.searchRates = catchAsync(async (req, res, next) => {
  const mortechRequest = buildMortechRequest(req.body);

  if (!mortechRequest.loan_amount || !mortechRequest.appraisedvalue || !mortechRequest.propertyZip) {
    return next(
      new ApiError('Missing required parameters: loan amount, property value, property zip', 400)
    );
  }

  const mortechAPI = createMortechAPI();
  const response = await mortechAPI.getRates(mortechRequest);

  if (!response.success) {
    return next(new ApiError(response.error || 'Failed to fetch rates from Mortech', 502));
  }

  const transformedRates = (response.quotes || []).map((quote) => ({
    id: quote.productId,
    lenderName: quote.vendorName,
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
    fees: quote.fees.map((fee) => ({
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
      loanTerm: mortechRequest.loanProduct1,
      lockDays: mortechRequest.lockDays || '30',
    },
  });
});
