const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const Loan = require('../models/loan.model');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Grant credit report consent
 * POST /api/v1/consent/credit-report
 */
exports.grantCreditReportConsent = catchAsync(async (req, res) => {
  console.log('grantCreditReportConsent');
  const { 
    borrowerId,  // For lender-created scenarios
    loanId,      // Optional: track which loan triggered consent
    consentMethod = 'application_submission',
    notes
  } = req.body;
  
  let borrower;
  let lender;
  let company;
  
  // If borrower role, get their own borrower profile
  if (req.user.role === 'borrower') {
    borrower = await Borrower.findOne({ user: req.user._id }).populate('lender');
    if (!borrower) {
      throw new ApiError('Borrower profile not found', 404);
    }
    lender = await Lender.findById(borrower.lender).populate('company');
    company = lender?.company;
  } 
  // If lender/company role, they must provide borrowerId
  else if (req.user.role === 'lender' || req.user.role === 'company') {
    if (!borrowerId) {
      throw new ApiError('Borrower ID is required', 400);
    }
    
    borrower = await Borrower.findById(borrowerId).populate('lender');
    if (!borrower) {
      throw new ApiError('Borrower not found', 404);
    }
    
    // Verify the lender has access to this borrower
    if (req.user.role === 'lender') {
      const userLender = await Lender.findOne({ user: req.user._id });
      if (!userLender || borrower.lender.toString() !== userLender._id.toString()) {
        throw new ApiError('Not authorized to manage consent for this borrower', 403);
      }
      lender = userLender;
    } else if (req.user.role === 'company') {
      lender = await Lender.findById(borrower.lender).populate('company');
      if (!lender?.company || lender.company._id.toString() !== req.user.company.toString()) {
        throw new ApiError('Not authorized to manage consent for this borrower', 403);
      }
    }
    
    company = lender?.company;
  }
  
  // Check if consent already exists and is valid
  if (borrower.creditReportConsent?.hasConsented && !borrower.creditReportConsent?.isRevoked) {
    return res.status(200).json({
      success: true,
      message: 'Consent already exists',
      data: {
        hasConsent: true,
        consentDate: borrower.creditReportConsent.consentDate,
        consentMethod: borrower.creditReportConsent.consentMethod
      }
    });
  }
  
  // Grant consent
  borrower.creditReportConsent = {
    hasConsented: true,
    consentDate: new Date(),
    consentMethod,
    consentIpAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    consentUserAgent: req.headers['user-agent'],
    lenderId: lender._id,
    companyId: company?._id,
    consentVersion: '1.0',
    isRevoked: false,
    notes: notes || undefined,
    recordedBy: (req.user.role === 'lender' || req.user.role === 'company') ? req.user._id : undefined
  };
  
  await borrower.save();
  
  logger.info(`Credit report consent granted for borrower ${borrower._id} via ${consentMethod} by user ${req.user._id}`);
  
  res.status(200).json({
    success: true,
    message: 'Credit report consent granted successfully',
    data: {
      hasConsent: true,
      consentDate: borrower.creditReportConsent.consentDate,
      consentMethod: borrower.creditReportConsent.consentMethod
    }
  });
});

/**
 * Get credit report consent status
 * GET /api/v1/consent/credit-report/status
 */
exports.getConsentStatus = catchAsync(async (req, res) => {
  let borrower;
  
  // Borrower checking their own status
  if (req.user.role === 'borrower') {
    borrower = await Borrower.findOne({ user: req.user._id });
    if (!borrower) {
      throw new ApiError('Borrower profile not found', 404);
    }
  } 
  // Lender/Company checking borrower's status
  else if (req.user.role === 'lender' || req.user.role === 'company') {
    const { borrowerId } = req.query;
    
    if (!borrowerId) {
      throw new ApiError('Borrower ID is required', 400);
    }
    
    borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      throw new ApiError('Borrower not found', 404);
    }
    
    // Verify the lender has access to this borrower
    if (req.user.role === 'lender') {
      const userLender = await Lender.findOne({ user: req.user._id });
      if (!userLender || borrower.lender.toString() !== userLender._id.toString()) {
        throw new ApiError('Not authorized to view consent for this borrower', 403);
      }
    } else if (req.user.role === 'company') {
      const lender = await Lender.findById(borrower.lender).populate('company');
      if (!lender?.company || lender.company._id.toString() !== req.user.company.toString()) {
        throw new ApiError('Not authorized to view consent for this borrower', 403);
      }
    }
  }
  
  const hasConsent = borrower.hasCreditReportConsent();
  
  res.status(200).json({
    success: true,
    data: {
      hasConsent,
      consentDate: borrower.creditReportConsent?.consentDate,
      consentMethod: borrower.creditReportConsent?.consentMethod,
      consentVersion: borrower.creditReportConsent?.consentVersion,
      isRevoked: borrower.creditReportConsent?.isRevoked,
      revokedDate: borrower.creditReportConsent?.revokedDate
    }
  });
});

/**
 * Revoke credit report consent
 * POST /api/v1/consent/credit-report/revoke
 */
exports.revokeCreditReportConsent = catchAsync(async (req, res) => {
  const { borrowerId } = req.body;
  let borrower;
  
  // Borrower revoking their own consent
  if (req.user.role === 'borrower') {
    borrower = await Borrower.findOne({ user: req.user._id });
    if (!borrower) {
      throw new ApiError('Borrower profile not found', 404);
    }
  } 
  // Lender/Admin revoking consent (rare case)
  else if (req.user.role === 'lender' || req.user.role === 'company' || req.user.role === 'admin') {
    if (!borrowerId) {
      throw new ApiError('Borrower ID is required', 400);
    }
    borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      throw new ApiError('Borrower not found', 404);
    }
  }
  
  // Check if consent exists
  if (!borrower.creditReportConsent || !borrower.creditReportConsent.hasConsented) {
    throw new ApiError('No consent found to revoke', 404);
  }
  
  // Check if already revoked
  if (borrower.creditReportConsent.isRevoked) {
    return res.status(200).json({
      success: true,
      message: 'Consent was already revoked',
      data: {
        hasConsent: false,
        revokedDate: borrower.creditReportConsent.revokedDate
      }
    });
  }
  
  // Revoke consent
  borrower.creditReportConsent.isRevoked = true;
  borrower.creditReportConsent.revokedDate = new Date();
  await borrower.save();
  
  logger.info(`Credit report consent revoked for borrower ${borrower._id} by user ${req.user._id}`);
  
  res.status(200).json({
    success: true,
    message: 'Consent revoked successfully',
    data: {
      hasConsent: false,
      revokedDate: borrower.creditReportConsent.revokedDate
    }
  });
});

