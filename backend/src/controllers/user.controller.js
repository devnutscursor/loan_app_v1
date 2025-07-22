const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const crypto = require('crypto');
const emailService = require('../utils/email/emailService');

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already available in req.user from the authentication middleware
    // But we want to get a fresh copy from the database with all fields except password
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile (firstName, lastName, phone)
 * Note: Email changes require separate verification process
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If email is provided, inform user about separate email change process
    if (req.body.email) {
      return next(new ApiError('Email changes require verification. Please use the email change feature.', 400));
    }

    if (Object.keys(updates).length === 0) {
      return next(new ApiError('No valid fields provided', 400));
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      context: 'query'
    }).select('-password');

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request email change - sends verification email to new address
 */
exports.requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id;

    // Validate new email
    if (!newEmail) {
      return next(new ApiError('New email is required', 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return next(new ApiError('Invalid email format', 400));
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Check if new email is same as current email
    if (normalizedEmail === req.user.email) {
      return next(new ApiError('New email must be different from current email', 400));
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return next(new ApiError('Email already in use by another account', 400));
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresIn = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Update user with pending email change
    await User.findByIdAndUpdate(userId, {
      pendingEmail: normalizedEmail,
      emailChangeToken: hashedToken,
      emailChangeExpires: expiresIn
    });

    // Determine base URL
    let baseUrl = `${req.protocol}://${req.get('host')}`;
    if (baseUrl.includes(':5000') && process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    }

    // Send verification email to new address
    try {
      logger.info(`Attempting to send email change verification to ${normalizedEmail}`);
      const result = await emailService.sendEmailChangeVerification({
        email: normalizedEmail,
        name: `${req.user.firstName} ${req.user.lastName}`,
        token: token,
        baseUrl: baseUrl,
        currentEmail: req.user.email
      });

      if (!result.success) {
        logger.error(`Email service returned failure: ${result.error}`);
        return next(new ApiError(`Failed to send verification email: ${result.error}`, 500));
      }
    } catch (emailError) {
      logger.error(`Email service threw error: ${emailError.message}`, { stack: emailError.stack });
      return next(new ApiError(`Email service error: ${emailError.message}`, 500));
    }

    logger.info(`Email change verification sent to ${normalizedEmail} for user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: `Verification email sent to ${normalizedEmail}. Please check your email and click the verification link to complete the email change.`
    });

  } catch (error) {
    logger.error(`Email change request error: ${error.message}`);
    next(error);
  }
};

/**
 * Verify email change with token
 */
exports.verifyEmailChange = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new ApiError('Verification token is required', 400));
    }

    // Hash the token from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and token not expired
    const user = await User.findOne({
      emailChangeToken: hashedToken,
      emailChangeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError('Invalid or expired email change verification link', 400));
    }

    // Update user email and clear pending email change fields
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    logger.info(`Email changed from ${oldEmail} to ${user.email} for user ${user._id}`);

    res.status(200).json({
      status: 'success',
      message: 'Email address successfully updated! You can now use your new email address to log in.'
    });

  } catch (error) {
    logger.error(`Email change verification error: ${error.message}`);
    next(error);
  }
};
