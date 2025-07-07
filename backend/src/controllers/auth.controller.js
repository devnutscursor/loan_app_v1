const User = require('../models/user.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const ApiError = require('../utils/apiError');
const { generateToken, generateRefreshToken } = require('../config/auth');
const logger = require('../utils/logger');
const { createDefaultLoanRates } = require('./loanRate.controller');
const loanRateController = require('./loanRate.controller');
const mongoose = require('mongoose');
const crypto = require('crypto');
const emailService = require('../utils/email/emailService');
const config = require('../config');

/**
 * Helper function to automatically save loan rates for lenders upon login
 * @param {string} userId - The user ID of the lender
 * @returns {Promise<boolean>} - Returns true if rates were saved, false otherwise
 */
const autoSaveLenderRates = async (userId) => {
  try {
    logger.info(`Starting auto-save of loan rates for user ${userId}`);
    
    // Find lender profile based on user ID
    const lender = await Lender.findOne({ user: userId });
    
    if (!lender) {
      logger.warn(`Auto save rates: Lender profile not found for user ${userId}`);
      return false;
    }
    
    logger.info(`Found lender profile: ${lender._id} for user ${userId}`);
    
    // Instead of trying to update existing rates, we'll directly create default rates
    // Define the default rates that will be created/updated
    const defaultRates = [
      { programType: 'conventional', rate: 7.0 },
      { programType: 'fha', rate: 7.0 },
      { programType: 'va', rate: 7.0 },
      { programType: 'usda', rate: 7.0 },
      { programType: 'jumbo', rate: 7.0 }
    ];
    
    // Instead of using the controller, directly work with the model
    const LoanRate = mongoose.model('LoanRate');
    
    // Use bulkWrite for better performance and atomic operations
    const operations = [];
    
    for (const rateData of defaultRates) {
      operations.push({
        updateOne: {
          filter: { 
            lender: lender._id,
            programType: rateData.programType 
          },
          update: { 
            $set: { 
              rate: rateData.rate,
              updatedBy: userId,
              updatedAt: new Date()
            }
          },
          upsert: true // This is key - it will insert if doesn't exist or update if it does
        }
      });
    }
    
    logger.info(`Preparing to upsert ${operations.length} loan rates for lender ${lender._id}`);
    
    // Execute all operations in one go
    if (operations.length > 0) {
      try {
        const result = await LoanRate.bulkWrite(operations);
        logger.info(`Auto-saved loan rates for lender ${lender._id}: upserted=${result.upsertedCount}, modified=${result.modifiedCount}`);
        return true;
      } catch (bulkError) {
        logger.error(`Error in bulkWrite operation: ${bulkError.message}`);
        
        // Try individual inserts as fallback
        logger.info(`Falling back to individual rate inserts for lender ${lender._id}`);
        let successCount = 0;
        
        for (const rateData of defaultRates) {
          try {
            await LoanRate.updateOne(
              { lender: lender._id, programType: rateData.programType },
              { 
                $set: { 
                  rate: rateData.rate, 
                  updatedBy: userId,
                  updatedAt: new Date()
                }
              },
              { upsert: true }
            );
            successCount++;
          } catch (singleError) {
            logger.error(`Error saving individual rate (${rateData.programType}): ${singleError.message}`);
          }
        }
        
        logger.info(`Fallback completed: Successfully saved ${successCount}/${defaultRates.length} rates`);
        return successCount > 0;
      }
    }
    
    return false;
  } catch (error) {
    logger.error(`Error in autoSaveLenderRates: ${error.stack || error.message}`);
    // Try a direct approach to create rates if all else fails
    try {
      await createDefaultLoanRates(userId, lender?._id);
      logger.info(`Fallback to createDefaultLoanRates successful for user: ${userId}`);
      return true;
    } catch (fallbackError) {
      logger.error(`Even fallback creation failed: ${fallbackError.message}`);
    }
    logger.error(`Error auto-saving loan rates for user ${userId}: ${error.message}`);
    return false;
  }
};

/**
 * Generate verification token for email verification
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - Returns the verification token
 */
async function generateVerificationToken(userId) {
  try {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set expiration
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresIn = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    // Update user with verification token
    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresIn
    });
    
    return token;
  } catch (error) {
    logger.error(`Error generating verification token: ${error.message}`);
    throw error;
  }
}

/**
 * Send verification email
 * @param {Object} user - The user object
 * @param {Object} req - Express request object
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
async function sendVerificationEmail(user, req) {
  try {
    // Generate token
    logger.info(`Generating verification token for user: ${user._id}`);
    const token = await generateVerificationToken(user._id);
    
    // Determine base URL from request or environment
    // For local development, req.protocol might be http but the frontend uses http://localhost:3001
    let baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Special case for local development - if port is 5000 (backend), we assume frontend is on 3001
    if (baseUrl.includes(':5000') && process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
      logger.info(`Using frontend URL for local development: ${baseUrl}`);
    }
    
    logger.info(`Sending verification email to: ${user.email} with base URL: ${baseUrl}`);
    
    // Send email
    const result = await emailService.sendEmailVerification({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      token: token,
      baseUrl: baseUrl
    });
    
    if (result.success) {
      logger.info(`Verification email sent successfully to: ${user.email}`);
      return true;
    } else {
      logger.error(`Failed to send verification email: ${result.error}`);
      throw new Error(`Email service failed: ${result.error}`);
    }
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`, {
      stack: error.stack,
      userId: user._id,
      email: user.email
    });
    throw error;
  }
}

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { firstName, lastName, email, password, phone, role, nmls } = req.body;

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase();

      // Check if user already exists with this email
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return reject(new ApiError('Email already in use', 400));
      }

      // Create new user
      const user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        phone,
        role: role || 'borrower',
        nmls,
        isEmailVerified: false
      });

      // Create corresponding profile based on role
      if (user.role === 'borrower') {
        const borrower = await Borrower.create({
          user: user._id
        });
      } else if (user.role === 'lender') {
        const lender = await Lender.create({
          user: user._id,
          nmls: nmls || ''
        });

        // Create default loan programs for new lender
        if (lender) {
          this.createDefaultLoanPrograms(user._id, lender._id)
            .then(() => {
              logger.info(`Created default loan programs for new lender: ${lender._id}`);
            })
            .catch(error => {
              logger.error(`Error creating default loan programs: ${error.message}`);
            });

          // Create default loan rates
          try {
            await createDefaultLoanRates(user._id, lender._id);
            logger.info(`Created default loan rates for new lender: ${lender._id}`);
          } catch (error) {
            logger.error(`Error creating default loan rates: ${error.message}`);
          }
        }
      }

      // Send verification email
      try {
        logger.info(`Attempting to send verification email for new user: ${user._id}, ${user.email}`);
        const emailSent = await sendVerificationEmail(user, req);
        if (emailSent) {
          logger.info(`Verification email successfully triggered for user: ${user._id}`);
        } else {
          logger.error(`Verification email sending returned false for user: ${user._id}`);
        }
      } catch (error) {
        logger.error(`Failed to send verification email: ${error.message}`, {
          stack: error.stack,
          userId: user._id,
          email: user.email
        });
        // Continue with registration even if email fails
      }

      logger.info(`User registered successfully: ${user._id} (${user.role})`);
      
      // Return success without sending token (require login)
      return resolve(res.status(201).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        data: {
          userId: user._id,
          role: user.role,
          verified: false
        }
      }));
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      return reject(new ApiError(error.message || 'Registration failed', 500));
    }
  }).catch(next);
};

/**
 * Verify email with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyEmail = async (req, res, next) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { token } = req.params;
      
      // Hash the token from the URL
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find user with this token and token not expired
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return reject(new ApiError('Invalid or expired verification link', 400));
      }
      
      // Update user as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      
      logger.info(`Email verified for user: ${user._id}`);
      
      // Return success
      return resolve(res.status(200).json({
        status: 'success',
        message: 'Email verified successfully! You can now login.',
      }));
    } catch (error) {
      logger.error(`Email verification error: ${error.message}`);
      return reject(new ApiError(error.message || 'Email verification failed', 500));
    }
  }).catch(next);
};

/**
 * Resend verification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resendVerificationEmail = async (req, res, next) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return reject(new ApiError('Email is required', 400));
      }
      
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return reject(new ApiError('User not found', 404));
      }
      
      if (user.isEmailVerified) {
        return reject(new ApiError('Email is already verified', 400));
      }
      
      // Send new verification email
      await sendVerificationEmail(user, req);
      
      // Return success
      return resolve(res.status(200).json({
        status: 'success',
        message: 'Verification email resent successfully',
      }));
    } catch (error) {
      logger.error(`Resend verification error: ${error.message}`);
      return reject(new ApiError(error.message || 'Failed to resend verification email', 500));
    }
  }).catch(next);
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return reject(new ApiError('Please provide email and password', 400));
      }

      // Find user with password field included (select)
      const user = await User.findOne({ email: email.toLowerCase() });

      // Check if user exists and password is correct
      if (!user || !(await user.comparePassword(password))) {
        return reject(new ApiError('Invalid credentials', 401));
      }
      
      // Check if email is verified
      if (!user.isEmailVerified) {
        return reject(new ApiError('Please verify your email before logging in. Check your inbox or request a new verification email.', 403, { requiresVerification: true }));
      }

      // Update last login time
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      
      // Auto-save loan rates for lenders
      if (user.role === 'lender') {
        autoSaveLenderRates(user._id)
          .then(saved => {
            if (saved) {
              logger.info(`Auto-saved loan rates for lender user: ${user._id}`);
            }
          })
          .catch(error => {
            logger.error(`Error auto-saving loan rates: ${error.message}`);
          });
      }
      
      // Generate JWT token
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      let profileData = null;
      
      // Get profile data based on role
      if (user.role === 'borrower') {
        profileData = await Borrower.findOne({ user: user._id });
      } else if (user.role === 'lender') {
        profileData = await Lender.findOne({ user: user._id });
      }

      // Respond with user data and token
      return resolve(res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            profileId: profileData ? profileData._id : null,
            isEmailVerified: user.isEmailVerified
          },
          token,
          refreshToken
        }
      }));
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      return reject(new ApiError(error.message || 'Login failed', 500));
    }
  }).catch(next);
};

/**
 * Register a new borrower linked to a lender
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.registerBorrower = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const { lenderId } = req.query;

    // Check if lender ID is provided
    if (!lenderId) {
      return next(new ApiError('Lender ID is required for borrower registration', 400));
    }

    // Validate lender ID format
    if (!mongoose.Types.ObjectId.isValid(lenderId)) {
      return next(new ApiError('Invalid lender ID format', 400));
    }

    // Check if the lender exists
    const lender = await Lender.findById(lenderId);
    if (!lender) {
      return next(new ApiError('Lender not found', 404));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('User already exists with this email', 400));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'borrower',
      isEmailVerified: false  // Set email as unverified
    });

    try {
      // Create borrower linked to lender
      await Borrower.create({
        user: user._id,
        lender: lenderId
      });
    } catch (borrowerError) {
      // Roll back user if borrower creation fails
      await User.findByIdAndDelete(user._id);
      throw borrowerError;
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send verification email
    try {
      logger.info(`Attempting to send verification email for new borrower: ${user._id}, ${user.email}`);
      const emailSent = await sendVerificationEmail(user, req);
      if (emailSent) {
        logger.info(`Verification email successfully triggered for borrower: ${user._id}`);
      } else {
        logger.error(`Verification email sending returned false for borrower: ${user._id}`);
      }
    } catch (error) {
      logger.error(`Failed to send verification email to borrower: ${error.message}`, {
        stack: error.stack,
        userId: user._id,
        email: user.email
      });
      // Continue with registration even if email fails
    }
    
    // Log borrower registration
    logger.info(`New borrower registered: ${user.email} under lender ID: ${lenderId}`);

    res.status(201).json({
      status: 'success',
      message: 'Borrower registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        lenderId,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ApiError('Refresh token is required', 400));
    }

    // Verify refresh token
    const decoded = require('../config/auth').verifyToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError('Invalid refresh token', 401));
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken
      }
    });
  } catch (error) {
    next(new ApiError('Invalid refresh token', 401));
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already available in req.user from auth middleware
    const user = req.user;

    let profileData = null;

    // Get role-specific data
    if (user.role === 'borrower') {
      profileData = await Borrower.findOne({ user: user._id });
    } else if (user.role === 'lender') {
      profileData = await Lender.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt
        },
        profile: profileData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError('Please provide current and new password', 400));
    }

    // Get user from database with password
    const user = await User.findById(req.user._id);

    // Check current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return next(new ApiError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    // Log password update
    logger.info(`Password updated for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ApiError('Please provide an email', 400));
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ApiError('No user found with this email', 404));
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    logger.info(`Generated reset token for ${email}: ${resetToken.substring(0, 5)}... (length: ${resetToken.length})`);

    // Store hashed token in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    logger.info(`Hashed token for storage: ${hashedToken.substring(0, 10)}... (length: ${hashedToken.length})`);
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      // Send email with reset link
      const email = require('../utils/email');
      
      const emailText = `
Forgot your password? Click the link below to reset your password:

${resetURL}

If you didn't request a password reset, please ignore this email.

This password reset link is only valid for 30 minutes.
`;

      const emailHTML = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
    <h2 style="margin: 0; color: #333;">Password Reset Request</h2>
  </div>
  
  <div style="padding: 20px;">
    <p>Hello,</p>
    <p>We received a request to reset your password for your Loan App account.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${resetURL}" 
         style="background-color: #0066cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
         Reset Your Password
      </a>
    </div>
    
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="background-color: #f5f5f5; padding: 10px; border-left: 3px solid #0066cc;">
      <a href="${resetURL}" style="color: #0066cc; word-break: break-all;">${resetURL}</a>
    </p>
    
    <p><strong>Please note:</strong> This link is only valid for 30 minutes.</p>
    
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
      This is an automated message from the Loan Application System.<br>
      Please do not reply to this email.<br>
      Sent on: ${new Date().toLocaleString()}
    </p>
  </div>
</div>
`;

      await email.send({
        to: user.email,
        subject: 'Loan App - Password Reset Request (Valid for 30 min)',
        text: emailText,
        html: emailHTML
      });

      // Log password reset request
      logger.info(`Password reset requested for user: ${user.email}, email sent with instructions`);

      res.status(200).json({
        status: 'success',
        message: 'Password reset instructions sent to your email'
      });
    } catch (emailError) {
      // Log the email sending error
      logger.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);
      
      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      
      if (isDevelopment) {
        // In development mode, return the token directly for testing purposes
        logger.info(`DEV MODE: Returning reset token directly for ${user.email}`);
        
        return res.status(200).json({
          status: 'success',
          message: 'DEV MODE: Email sending failed, but reset token generated successfully',
          data: {
            resetToken,
            resetUrl: resetURL
          }
        });
      } else {
        // In production, don't expose the token
        // Reset the token and expiry since email failed
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        return next(new ApiError('Error sending password reset email. Please try again later.', 500));
      }
    }
  } catch (error) {
    next(error);
  }
};


/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    // Log the request details (without sensitive data)
    logger.info(`Reset password request received with token: ${resetToken ? resetToken.substring(0, 5) + '...' : 'none'}, token length: ${resetToken ? resetToken.length : 0}, new password length: ${newPassword ? newPassword.length : 0}`);

    if (!resetToken || !newPassword) {
      logger.warn('Reset password request missing token or new password');
      return next(new ApiError('Please provide reset token and new password', 400));
    }
    
    // IMPORTANT: Debug the raw token
    logger.info(`Raw token received: ${resetToken}`);

    // Hash token for comparison
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    logger.info(`Computed hashed token: ${hashedToken} (length: ${hashedToken.length})`);

    // Debug: Find all users with reset tokens
    const allUsersWithTokens = await User.find({ resetPasswordToken: { $exists: true, $ne: null } });
    logger.info(`Found ${allUsersWithTokens.length} users with reset tokens in database`);
    
    if (allUsersWithTokens.length > 0) {
      allUsersWithTokens.forEach(u => {
        logger.info(`User ${u.email} has token: ${u.resetPasswordToken} (length: ${u.resetPasswordToken.length}), expires: ${new Date(u.resetPasswordExpires).toISOString()}`);
        
        // Try to match with case insensitive comparison
        if (u.resetPasswordToken.toLowerCase() === hashedToken.toLowerCase()) {
          logger.info(`Found case-insensitive match for user ${u.email}!`);
        }
      });
    }

    // Find user with token and check if token is still valid - try case insensitive search
    const user = await User.findOne({
      resetPasswordToken: { $regex: new RegExp(`^${hashedToken}$`, 'i') }
    });
    
    if (!user) {
      logger.warn(`No user found with the provided reset token hash: ${hashedToken}`);
      return next(new ApiError('Invalid reset token', 400));
    }
    
    // Check token expiration separately for better error messages
    if (user.resetPasswordExpires < Date.now()) {
      logger.warn(`Reset token expired for user: ${user.email}. Token expired at: ${new Date(user.resetPasswordExpires).toISOString()}`);
      return next(new ApiError('Reset token has expired', 400));
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    // Log password reset completion
    logger.info(`Password reset completed for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, we don't actually invalidate the token on the server
    // The client should delete the token
    // This endpoint is mostly for logging purposes
    
    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create default loan programs for a new lender
 * @param {ObjectId} userId - The user ID of the lender
 * @param {ObjectId} lenderId - The lender ID
 */
exports.createDefaultLoanPrograms = async (userId, lenderId) => {
  const LoanProgram = mongoose.model('LoanProgram');
  
  try {
    // 1. Conventional Loan Program
    await LoanProgram.create({
      programName: 'Conventional',
      displayName: 'Conventional Mortgage',
      programType: 'conventional',
      isAvailableToBorrower: true,
      loanHelpText: 'Conventional loans are mortgage loans that are not insured or guaranteed by the federal government, often requiring a minimum 3% down payment.',
      rateAdjustment: 0,
      loanTerm: 30,
      restrictions: {
        dtiRestriction: {
          max: 45
        },
        downPaymentRestriction: {
          min: 3,
          max: null
        },
        loanAmountRestriction: {
          min: null,
          max: 726200 // 2023 conforming loan limit
        }
      },
      privateMortgageInsurance: [
        { minLTV: 80, maxLTV: 85, rate: 0.3 },
        { minLTV: 85, maxLTV: 90, rate: 0.5 },
        { minLTV: 90, maxLTV: 95, rate: 0.7 },
        { minLTV: 95, maxLTV: 97, rate: 0.85 }
      ],
      upfrontMortgageInsurance: 0,
      mortgageInsurance: 0,
      fundingFee: 0,
      originationFees: {
        type: 'percentage',
        value: 1,
        frequency: 'once'
      },
      closingCosts: {
        type: 'percentage',
        value: 2,
        frequency: 'once'
      },
      otherFees: {
        type: 'flat',
        value: 500,
        frequency: 'once'
      },
      lender: lenderId,
      createdBy: userId
    });
    
    // 2. FHA Loan Program
    await LoanProgram.create({
      programName: 'FHA',
      displayName: 'FHA Mortgage',
      programType: 'fha',
      isAvailableToBorrower: true,
      loanHelpText: 'FHA loans are government-backed mortgages insured by the Federal Housing Administration, designed for borrowers with lower credit scores and smaller down payments.',
      rateAdjustment: 0,
      loanTerm: 30,
      restrictions: {
        dtiRestriction: {
          max: 43
        },
        downPaymentRestriction: {
          min: 3.5,
          max: null
        },
        loanAmountRestriction: {
          min: null,
          max: 726200 // 2023 FHA limit for most areas
        }
      },
      upfrontMortgageInsurance: 1.75, // FHA upfront MIP
      mortgageInsurance: 0.55, // FHA annual MIP (varies based on loan terms and LTV)
      fundingFee: 0,
      originationFees: {
        type: 'percentage',
        value: 1,
        frequency: 'once'
      },
      closingCosts: {
        type: 'percentage',
        value: 2,
        frequency: 'once'
      },
      otherFees: {
        type: 'flat',
        value: 500,
        frequency: 'once'
      },
      lender: lenderId,
      createdBy: userId
    });
    
    // 3. VA Loan Program
    await LoanProgram.create({
      programName: 'VA',
      displayName: 'VA Home Loan',
      programType: 'va',
      isAvailableToBorrower: true,
      loanHelpText: 'VA loans are mortgage loans guaranteed by the U.S. Department of Veterans Affairs for eligible veterans, service members, and surviving spouses.',
      rateAdjustment: 0,
      loanTerm: 30,
      restrictions: {
        dtiRestriction: {
          max: 41
        },
        downPaymentRestriction: {
          min: 0,
          max: null
        },
        loanAmountRestriction: {
          min: null,
          max: null // No VA loan limit for those with full entitlement
        }
      },
      upfrontMortgageInsurance: 0,
      mortgageInsurance: 0, // VA loans don't have monthly mortgage insurance
      fundingFee: 2.15, // VA funding fee for first-time use with no down payment
      originationFees: {
        type: 'percentage',
        value: 1,
        frequency: 'once'
      },
      closingCosts: {
        type: 'percentage',
        value: 2,
        frequency: 'once'
      },
      otherFees: {
        type: 'flat',
        value: 500,
        frequency: 'once'
      },
      lender: lenderId,
      createdBy: userId
    });
    
    // 4. USDA Loan Program
    await LoanProgram.create({
      programName: 'USDA',
      displayName: 'USDA Rural Development',
      programType: 'usda',
      isAvailableToBorrower: true,
      loanHelpText: 'A USDA home loan (Rural Development) is a zero down payment mortgage for eligible moderate income households buying in qualified rural areas.',
      rateAdjustment: 0,
      loanTerm: 30,
      restrictions: {
        dtiRestriction: {
          max: 41
        },
        downPaymentRestriction: {
          min: 0,
          max: null
        },
        loanAmountRestriction: {
          min: null,
          max: null
        }
      },
      upfrontMortgageInsurance: 0,
      mortgageInsurance: 0.4, // USDA annual fee
      fundingFee: 1.0, // USDA upfront guarantee fee
      originationFees: {
        type: 'percentage',
        value: 1,
        frequency: 'once'
      },
      closingCosts: {
        type: 'percentage',
        value: 2,
        frequency: 'once'
      },
      otherFees: {
        type: 'flat',
        value: 500,
        frequency: 'once'
      },
      lender: lenderId,
      createdBy: userId
    });
    
    // 5. Jumbo Loan Program
    await LoanProgram.create({
      programName: 'Jumbo',
      displayName: 'Jumbo Mortgage',
      programType: 'jumbo',
      isAvailableToBorrower: true,
      loanHelpText: 'A Jumbo Mortgage is for higher balance loans between $726,001 and $2,000,000.',
      rateAdjustment: 0.25,
      loanTerm: 30,
      restrictions: {
        dtiRestriction: {
          max: 40
        },
        downPaymentRestriction: {
          min: 10.0,
          max: null
        },
        loanAmountRestriction: {
          min: 726000,
          max: 2000000
        }
      },
      upfrontMortgageInsurance: 0,
      mortgageInsurance: 0,
      fundingFee: 0,
      originationFees: {
        type: 'percentage',
        value: 1,
        frequency: 'once'
      },
      closingCosts: {
        type: 'percentage',
        value: 2,
        frequency: 'once'
      },
      otherFees: {
        type: 'flat',
        value: 1000,
        frequency: 'once'
      },
      lender: lenderId,
      createdBy: userId
    });
    
    logger.info(`Created default loan programs for lender ID: ${lenderId}`);
  } catch (error) {
    logger.error(`Error creating default loan programs: ${error.message}`);
    // We don't want to fail the user registration if loan program creation fails
    // This is a background task that can be retried later
  }
};


