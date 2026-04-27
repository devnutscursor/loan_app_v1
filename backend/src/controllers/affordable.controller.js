const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');
const {
  getStateOptions,
  getCountyOptions,
  checkAffordableEligibility,
  checkUsdaEligibility,
} = require('../services/affordableAmi.service');

const getAffordableStates = catchAsync(async (req, res) => {
  const states = await getStateOptions();
  res.status(200).json({
    status: 'success',
    result: states.length,
    data: { states },
  });
});

const getAffordableCounties = catchAsync(async (req, res) => {
  const { state = '' } = req.query;
  const counties = await getCountyOptions(state);
  res.status(200).json({
    status: 'success',
    result: counties.length,
    data: { counties },
  });
});

const getAffordableEligibility = catchAsync(async (req, res) => {
  const {
    annualIncome,
    county = '',
    state = '',
    zip = '',
    censusTract = '',
  } = req.query;

  if (!state || !county) {
    throw new ApiError('State and county are required for AMI eligibility', 400);
  }

  const eligibility = await checkAffordableEligibility({
    borrowerIncome: annualIncome,
    propertyCounty: county,
    propertyState: state,
    propertyZip: zip,
    censusTract,
  });

  res.status(200).json({
    status: 'success',
    data: eligibility,
  });
});

const getUsdaEligibility = catchAsync(async (req, res) => {
  const {
    annualIncome,
    county = '',
    state = '',
    zip = '',
    occupancy = '',
  } = req.query;

  if (!state || !county) {
    throw new ApiError('State and county are required for USDA eligibility', 400);
  }

  const eligibility = await checkUsdaEligibility({
    borrowerIncome: annualIncome,
    propertyCounty: county,
    propertyState: state,
    propertyZip: zip,
    occupancy,
  });

  res.status(200).json({
    status: 'success',
    data: eligibility,
  });
});

module.exports = {
  getAffordableStates,
  getAffordableCounties,
  getAffordableEligibility,
  getUsdaEligibility,
};

