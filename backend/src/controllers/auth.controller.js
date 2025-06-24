const User = require('../models/user.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const ApiError = require('../utils/apiError');
const { generateToken, generateRefreshToken } = require('../config/auth');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('User already exists with this email', 400));
    }

    // For regular registration, only allow lender and admin roles
    if (role === 'borrower') {
      return next(new ApiError('Borrowers should register through a lender link', 400));
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || 'lender'
    });

    // Create lender profile
    if (user.role === 'lender') {
      await Lender.create({
        user: user._id
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log the registration
    logger.info(`New user registered: ${user.email} with role: ${user.role}`);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
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
      role: 'borrower'
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

    // Log borrower registration
    logger.info(`New borrower registered: ${user.email} under lender ID: ${lenderId}`);

    res.status(201).json({
      status: 'success',
      message: 'Borrower registered successfully',
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
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return next(new ApiError('Please provide email and password', 400));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new ApiError('Your account is inactive', 403));
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log login
    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
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
