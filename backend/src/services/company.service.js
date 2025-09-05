const Lender = require('../models/lender.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/apiError');

/**
 * Ensure a company has capacity to add another lender
 * Throws ApiError(400) if maxLenders cap is reached
 */
exports.assertCompanyCapacity = async function assertCompanyCapacity(companyId) {
  const company = await Company.findById(companyId).select('isActive maxLenders');
  if (!company) {
    throw new ApiError('Company not found', 404);
  }
  if (!company.isActive) {
    throw new ApiError('Company is inactive', 403);
  }
  if (typeof company.maxLenders !== 'number') {
    // If maxLenders is not set, treat as unlimited
    return true;
  }
  const currentCount = await Lender.countDocuments({ company: companyId });
  if (currentCount >= company.maxLenders) {
    throw new ApiError('Max lenders limit reached for this company', 400);
  }
  return true;
};


