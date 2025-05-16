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

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create new user with borrower role
      const user = await User.create([{
        firstName,
        lastName,
        email,
        password,
        phone,
        role: 'borrower'
      }], { session });

      // Create borrower profile linked to the lender
      await Borrower.create([{
        user: user[0]._id,
        lender: lenderId
      }], { session });

      await session.commitTransaction();
      session.endSession();

      // Generate tokens
      const token = generateToken(user[0]);
      const refreshToken = generateRefreshToken(user[0]);

      // Log the borrower registration
      logger.info(`New borrower registered: ${user[0].email} under lender ID: ${lenderId}`);

      res.status(201).json({
        status: 'success',
        message: 'Borrower registered successfully',
        data: {
          user: {
            id: user[0]._id,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            email: user[0].email,
            phone: user[0].phone,
            role: user[0].role
          },
          lenderId,
          token,
          refreshToken
        }
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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
      return next(new ApiError('Please provide your email', 400));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError('No user found with this email', 404));
    }

    // Generate reset token - in a real app, this would send an email
    // For this project, we'll just return the token in the response
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store hashed token in database
    user.resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Log password reset request
    logger.info(`Password reset requested for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      data: {
        resetToken // In a real app, this would be sent via email
      }
    });
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

    if (!resetToken || !newPassword) {
      return next(new ApiError('Please provide reset token and new password', 400));
    }

    // Hash token for comparison
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError('Invalid or expired reset token', 400));
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
