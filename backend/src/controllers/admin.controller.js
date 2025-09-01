const User = require('../models/user.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const Loan = require('../models/loan.model');
const Company = require('../models/company.model');
const Document = require('../models/document.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get system dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Optimize: Get all user counts in a single aggregation
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object for easy access
    const userCounts = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
    
    const totalUsers = userCounts.borrower + userCounts.lender + userCounts.admin;
    const borrowerCount = userCounts.borrower || 0;
    const lenderCount = userCounts.lender || 0;
    const adminCount = userCounts.admin || 0;
    
    // Optimize: Get all loan statistics in a single aggregation
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: '$loanDetails.loanAmount' },
          activeLoans: {
            $sum: {
              $cond: [
                { $not: { $in: ['$status', ['Rejected', 'Cancelled', 'Closed']] } },
                1,
                0
              ]
            }
          },
          pendingApprovalLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Pending Approval'] }, 1, 0]
            }
          },
          approvedLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0]
            }
          },
          rejectedLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0]
            }
          },
          closedLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const stats = loanStats[0] || {
      totalLoans: 0,
      totalAmount: 0,
      activeLoans: 0,
      pendingApprovalLoans: 0,
      approvedLoans: 0,
      rejectedLoans: 0,
      closedLoans: 0
    };
    
    const totalLoans = stats.totalLoans;
    const activeLoans = stats.activeLoans;
    const pendingApprovalLoans = stats.pendingApprovalLoans;
    const approvedLoans = stats.approvedLoans;
    const rejectedLoans = stats.rejectedLoans;
    const closedLoans = stats.closedLoans;
    const totalLoanAmount = stats.totalAmount;
    
    // Company statistics
    const companyCount = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ isActive: true });
    
    // Document statistics
    const totalDocuments = await Document.countDocuments();
    const pendingReviewDocuments = await Document.countDocuments({ status: 'Pending Review' });
    
    // Note: Recent activity data removed from dashboard for performance
    
    // Calculate average loan amount
    const averageLoanAmount = totalLoans > 0 ? totalLoanAmount / totalLoans : 0;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalLoans: totalLoans,
          totalUsers: totalUsers,
          totalVolume: totalLoanAmount,
          activeLoans: activeLoans
        },
        users: {
          borrowers: borrowerCount,
          lenders: lenderCount,
          admins: adminCount
        },
        loanStats: {
          totalApplications: totalLoans,
          approved: approvedLoans,
          pending: pendingApprovalLoans,
          rejected: rejectedLoans,
          totalVolume: totalLoanAmount,
          averageAmount: averageLoanAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    // Filter by role
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    let profile = null;
    
    // Get role-specific profile data
    if (user.role === 'borrower') {
      profile = await Borrower.findOne({ user: id });
    } else if (user.role === 'lender') {
      profile = await Lender.findOne({ user: id })
        .populate('company', 'name logo');
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (active/inactive)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return next(new ApiError('Active status is required', 400));
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    // Prevent deactivating your own account
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return next(new ApiError('You cannot deactivate your own account', 400));
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    logger.info(`User ${id} status updated to ${isActive ? 'active' : 'inactive'} by admin ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['borrower', 'lender', 'admin'].includes(role)) {
      return next(new ApiError('Valid role is required', 400));
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    // Prevent changing your own role
    if (user._id.toString() === req.user._id.toString()) {
      return next(new ApiError('You cannot change your own role', 400));
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    logger.info(`User ${id} role updated to ${role} by admin ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSystemLogs = async (req, res, next) => {
  try {
    // This would typically interact with the logging system
    // For simplicity, we'll just return a message
    res.status(200).json({
      status: 'success',
      message: 'Logs should be viewed directly from the logging system or server',
      data: {
        info: 'For security reasons, logs cannot be accessed through the API. Please check the server logs directly.'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new admin user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createAdminUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }
    
    // Create new admin user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'admin'
    });
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`Admin user created: ${email} by admin ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new lender user (admin only, no email verification required)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLenderUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }
    
    // Create new lender user with email verified (since admin created it)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'lender',
      isEmailVerified: true, // Skip email verification for admin-created users
      isActive: true
    });
    
    // Create lender profile
    const lender = await Lender.create({
      user: user._id,
      name: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      isActive: true
    });
    
    // Create default loan programs and rates for the new lender
    // Import the functions we need
    const { createDefaultLoanPrograms } = require('./auth.controller');
    const { createDefaultLoanRates } = require('./loanRate.controller');
    
    try {
      await createDefaultLoanPrograms(user._id, lender._id);
      await createDefaultLoanRates(user._id, lender._id);
      logger.info(`Default loan programs and rates created for lender ${lender._id}`);
    } catch (setupError) {
      logger.error(`Error creating default programs/rates for lender ${lender._id}:`, setupError);
      // Don't fail the user creation if this fails, just log it
    }
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`Lender user created: ${email} by admin ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Lender user created successfully',
      data: {
        user,
        lender
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSystemSettings = async (req, res, next) => {
  try {
    // In a real application, this would fetch settings from a database
    // For now, we'll return placeholder settings
    res.status(200).json({
      status: 'success',
      data: {
        maxUploadSize: '10MB',
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'xlsx', 'csv'],
        loanSettings: {
          interestRateRange: {
            min: 2.5,
            max: 18.0
          },
          maxLoanAmount: 5000000,
          maxLoanTermMonths: 360
        },
        emailNotifications: true,
        maintenanceMode: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all loans with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLoans = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Search by loan number, borrower name, or amount
    if (req.query.search) {
      filter.$or = [
        { loanNumber: { $regex: req.query.search, $options: 'i' } },
        { amount: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get loans with borrower information
    const loans = await Loan.find(filter)
      .populate('borrower', 'firstName lastName email')
      .populate('lender', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Loan.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: loans.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrower ID by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getBorrowerByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const borrower = await Borrower.findOne({ user: userId });
    
    if (!borrower) {
      return next(new ApiError('Borrower not found for this user', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        borrowerId: borrower._id,
        userId: userId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get loan details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const loan = await Loan.findById(id)
      .populate('borrower', 'firstName lastName email phone')
      .populate('lender', 'name email phone')
      .populate('milestones')
      .populate('documents');
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const loan = await Loan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('borrower', 'firstName lastName email');
    
    if (!loan) {
      return next(new ApiError('Loan not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};
