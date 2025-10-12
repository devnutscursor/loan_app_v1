const ConsentToken = require('../models/consentToken.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const emailService = require('../utils/email/emailService');
const logger = require('../utils/logger');

/**
 * Send credit report consent email to borrower
 * POST /api/v1/consent/credit-report/send-email
 */
exports.sendConsentEmail = catchAsync(async (req, res, next) => {
  const { borrowerId, loanId } = req.body;
  
  if (!borrowerId) {
    return next(new ApiError('Borrower ID is required', 400));
  }
  
  // Get borrower
  const borrower = await Borrower.findById(borrowerId).populate('lender');
  if (!borrower) {
    return next(new ApiError('Borrower not found', 404));
  }
  
  // Verify borrower email
  if (!borrower.email) {
    return next(new ApiError('Borrower email not found', 400));
  }
  
  // Get lender
  let lender;
  if (req.user.role === 'lender') {
    lender = await Lender.findOne({ user: req.user._id });
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Verify borrower belongs to this lender
    if (!borrower.lender.equals(lender._id)) {
      return next(new ApiError('Unauthorized to send consent request to this borrower', 403));
    }
  } else if (req.user.role === 'company') {
    // For company role, get lender from borrower
    lender = borrower.lender;
  } else {
    return next(new ApiError('Only lenders and companies can send consent requests', 403));
  }
  
  // Check if borrower already has valid consent
  if (borrower.hasCreditReportConsent()) {
    return next(new ApiError('Borrower has already provided consent', 400));
  }
  
  // Check for existing pending token
  const existingToken = await ConsentToken.findOne({
    borrower: borrowerId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
  
  if (existingToken) {
    return next(new ApiError('A consent request email was already sent to this borrower. Please wait for them to respond or wait for the token to expire.', 400));
  }
  
  // Generate token
  const token = ConsentToken.generateToken();
  const hashedToken = ConsentToken.hashToken(token);
  
  // Create consent token record
  const consentToken = await ConsentToken.create({
    token: hashedToken,
    borrower: borrowerId,
    lender: lender._id,
    company: lender.company || borrower.company,
    requestedBy: req.user._id,
    emailSentTo: borrower.email,
    metadata: {
      loanId: loanId || null
    }
  });
  
  // Generate consent URL
  const consentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consent/credit-report?token=${token}`;
  
  // Prepare email data
  const borrowerName = `${borrower.firstName || ''} ${borrower.lastName || ''}`.trim() || borrower.email;
  const lenderName = lender.companyName || `${lender.firstName || ''} ${lender.lastName || ''}`.trim();
  
  try {
    // Send email
    const emailResult = await emailService.sendConsentRequestEmail({
      email: borrower.email,
      borrowerName,
      lenderName,
      consentUrl,
      expiresIn: '7 days'
    });
    
    if (!emailResult.success) {
      // Email failed, but we created the token - mark it as failed
      await consentToken.updateOne({ status: 'revoked', metadata: { emailError: emailResult.error } });
      return next(new ApiError(`Failed to send consent email: ${emailResult.error}`, 500));
    }
    
    logger.info(`Consent email sent to ${borrower.email} for borrower ${borrowerId} by ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Consent request email sent successfully',
      data: {
        emailSentTo: borrower.email,
        expiresAt: consentToken.expiresAt,
        tokenId: consentToken._id
      }
    });
  } catch (error) {
    // Email failed, revoke token
    await consentToken.updateOne({ status: 'revoked' });
    logger.error('Error sending consent email:', error);
    return next(new ApiError('Failed to send consent email', 500));
  }
});

/**
 * Verify consent token and get borrower info (public endpoint)
 * GET /api/v1/consent/credit-report/verify-token/:token
 */
exports.verifyConsentToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  
  if (!token) {
    return next(new ApiError('Token is required', 400));
  }
  
  // Hash the token to match database
  const hashedToken = ConsentToken.hashToken(token);
  
  // Find token
  const consentToken = await ConsentToken.findOne({ token: hashedToken })
    .populate('borrower', 'firstName lastName email')
    .populate('lender', 'companyName firstName lastName');
  
  if (!consentToken) {
    return next(new ApiError('Invalid or expired consent link', 404));
  }
  
  // Check if expired
  if (consentToken.isExpired) {
    return res.status(400).json({
      success: false,
      message: 'This consent link has expired',
      error: 'TOKEN_EXPIRED'
    });
  }
  
  // Check if already used
  if (consentToken.status === 'used') {
    return res.status(400).json({
      success: false,
      message: 'This consent link has already been used',
      error: 'TOKEN_ALREADY_USED',
      data: {
        consentGrantedAt: consentToken.consentGrantedAt
      }
    });
  }
  
  // Mark as clicked
  await consentToken.markAsClicked();
  
  // Return borrower info
  const borrowerName = `${consentToken.borrower.firstName || ''} ${consentToken.borrower.lastName || ''}`.trim() || 
                       consentToken.borrower.email;
  const lenderName = consentToken.lender.companyName || 
                     `${consentToken.lender.firstName || ''} ${consentToken.lender.lastName || ''}`.trim();
  
  res.status(200).json({
    success: true,
    data: {
      borrowerName,
      lenderName,
      borrowerEmail: consentToken.borrower.email,
      expiresAt: consentToken.expiresAt,
      tokenId: consentToken._id
    }
  });
});

/**
 * Grant consent via email token (public endpoint)
 * POST /api/v1/consent/credit-report/grant-via-token
 */
exports.grantConsentViaToken = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    return next(new ApiError('Token is required', 400));
  }
  
  // Hash the token
  const hashedToken = ConsentToken.hashToken(token);
  
  // Find token
  const consentToken = await ConsentToken.findOne({ token: hashedToken })
    .populate('borrower')
    .populate('lender');
  
  if (!consentToken) {
    return next(new ApiError('Invalid or expired consent link', 404));
  }
  
  // Check if valid
  if (!consentToken.isValid) {
    if (consentToken.status === 'used') {
      return next(new ApiError('This consent link has already been used', 400));
    }
    if (consentToken.isExpired) {
      return next(new ApiError('This consent link has expired', 400));
    }
    return next(new ApiError('This consent link is no longer valid', 400));
  }
  
  // Get borrower
  const borrower = consentToken.borrower;
  
  // Check if already has consent
  if (borrower.hasCreditReportConsent()) {
    // Mark token as used anyway
    await consentToken.markAsUsed(req.ip, req.headers['user-agent']);
    return next(new ApiError('You have already provided consent', 400));
  }
  
  // Grant consent
  borrower.creditReportConsent = {
    hasConsented: true,
    consentDate: new Date(),
    consentMethod: 'email_link',
    consentIpAddress: req.ip,
    consentUserAgent: req.headers['user-agent'],
    lenderId: consentToken.lender._id,
    companyId: consentToken.company,
    consentVersion: '1.0',
    isRevoked: false,
    notes: `Consent granted via email link. Token ID: ${consentToken._id}`
  };
  
  await borrower.save();
  
  // Mark token as used
  await consentToken.markAsUsed(req.ip, req.headers['user-agent']);
  
  logger.info(`Credit report consent granted via email token for borrower ${borrower._id}`);
  
  res.status(200).json({
    success: true,
    message: 'Credit report authorization provided successfully',
    data: {
      consentDate: borrower.creditReportConsent.consentDate,
      consentMethod: 'email_link'
    }
  });
});

/**
 * Check consent token status
 * GET /api/v1/consent/credit-report/token-status/:tokenId
 */
exports.getTokenStatus = catchAsync(async (req, res, next) => {
  const { tokenId } = req.params;
  
  const consentToken = await ConsentToken.findById(tokenId)
    .populate('borrower', 'firstName lastName email creditReportConsent')
    .select('-token'); // Don't expose the actual token
  
  if (!consentToken) {
    return next(new ApiError('Token not found', 404));
  }
  
  // Verify user has permission to view this token
  if (req.user.role === 'lender') {
    const lender = await Lender.findOne({ user: req.user._id });
    if (!lender || !consentToken.lender.equals(lender._id)) {
      return next(new ApiError('Unauthorized to view this token', 403));
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      status: consentToken.status,
      emailSentTo: consentToken.emailSentTo,
      emailSentAt: consentToken.emailSentAt,
      expiresAt: consentToken.expiresAt,
      clickedAt: consentToken.clickedAt,
      consentGrantedAt: consentToken.consentGrantedAt,
      isExpired: consentToken.isExpired,
      isValid: consentToken.isValid,
      hasConsent: consentToken.borrower.hasCreditReportConsent()
    }
  });
});

module.exports = exports;

