const Borrower = require('../models/borrower.model');
const Loan = require('../models/loan.model');
const Lender = require('../models/lender.model');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * Middleware to verify borrower has provided credit report consent
 * Should be used before any credit report creation/pulling operations
 */
exports.verifyCreditReportConsent = catchAsync(async (req, res, next) => {
  const { loanId } = req.params;
  
  // Get the loan to find the borrower
  const loan = await Loan.findById(loanId).populate('borrower lender');
  if (!loan) {
    throw new ApiError('Loan not found', 404);
  }
  
  const borrower = loan.borrower;
  const lender = loan.lender;
  
  // Get lender's company info
  const lenderWithCompany = await Lender.findById(lender._id).populate('company');
  const companyId = lenderWithCompany?.company?._id;
  
  // Check if borrower has valid consent
  const hasConsent = borrower.hasCreditReportConsent();
  
  if (!hasConsent) {
    logger.warn(`Credit report access blocked for borrower ${borrower._id} - no consent on file`);
    
    return res.status(403).json({
      success: false,
      error: 'CONSENT_REQUIRED',
      message: 'Borrower has not provided consent for credit report access. Please obtain consent before pulling credit report.',
      data: {
        borrowerId: borrower._id,
        borrowerName: `${borrower.firstName || ''} ${borrower.lastName || ''}`.trim(),
        hasConsent: false,
        requiresConsent: true
      }
    });
  }
  
  // Additional check: verify consent is for the correct lender/company
  const hasConsentForThisLender = borrower.hasConsentForLender(lender._id, companyId);
  
  if (!hasConsentForThisLender) {
    logger.warn(`Credit report access blocked for borrower ${borrower._id} - consent exists but for different lender`);
    
    return res.status(403).json({
      success: false,
      error: 'CONSENT_MISMATCH',
      message: 'Borrower consent is not valid for this lender. New consent required.',
      data: {
        borrowerId: borrower._id,
        hasConsent: false,
        requiresConsent: true
      }
    });
  }
  
  // Consent is valid, log and proceed
  logger.info(`Credit report consent verified for borrower ${borrower._id} - lender ${lender._id}`);
  
  // Attach borrower to request for use in next middleware/controller
  req.verifiedBorrower = borrower;
  
  next();
});

/**
 * Optional: Soft check middleware - warns but doesn't block
 * Useful for gradual rollout or testing
 */
exports.checkCreditReportConsent = catchAsync(async (req, res, next) => {
  const { loanId } = req.params;
  
  try {
    const loan = await Loan.findById(loanId).populate('borrower');
    if (loan && loan.borrower) {
      const hasConsent = loan.borrower.hasCreditReportConsent();
      
      // Add consent info to request but don't block
      req.consentInfo = {
        hasConsent,
        borrowerId: loan.borrower._id,
        consentDate: loan.borrower.creditReportConsent?.consentDate
      };
      
      if (!hasConsent) {
        logger.warn(`[SOFT CHECK] Credit report operation without consent for borrower ${loan.borrower._id}`);
      }
    }
  } catch (error) {
    logger.error('Error in consent soft check:', error);
    // Don't fail the request, just log
  }
  
  next();
});

