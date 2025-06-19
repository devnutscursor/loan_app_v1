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
      const lender = await Lender.create({
        user: user._id
      });
      
      // Create default loan programs for the new lender
      await exports.createDefaultLoanPrograms(user._id, lender._id);
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
