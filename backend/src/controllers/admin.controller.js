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
    // Get user counts
    const totalUsers = await User.countDocuments();
    const borrowerCount = await User.countDocuments({ role: 'borrower' });
    const lenderCount = await User.countDocuments({ role: 'lender' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Get loan statistics
    const totalLoans = await Loan.countDocuments();
    
    const activeLoans = await Loan.countDocuments({ 
      status: { $nin: ['Rejected', 'Cancelled', 'Closed'] }
    });
    
    const pendingApprovalLoans = await Loan.countDocuments({
      status: 'Pending Approval'
    });
    
    const approvedLoans = await Loan.countDocuments({
      status: 'Approved'
    });
    
    const rejectedLoans = await Loan.countDocuments({
      status: 'Rejected'
    });
    
    const closedLoans = await Loan.countDocuments({
      status: 'Closed'
    });
    
    // Calculate total loan amount
    const loanAmountsPipeline = [
      { $group: { _id: null, total: { $sum: '$loanDetails.loanAmount' } } }
    ];
    
    const loanAmounts = await Loan.aggregate(loanAmountsPipeline);
    const totalLoanAmount = loanAmounts.length > 0 ? loanAmounts[0].total : 0;
    
    // Company statistics
    const companyCount = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ isActive: true });
    
    // Document statistics
    const totalDocuments = await Document.countDocuments();
    const pendingReviewDocuments = await Document.countDocuments({ status: 'Pending Review' });
    
    // Get recent system activity
    const recentLoans = await Loan.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('primaryBorrower', 'firstName lastName')
      .populate('lender', 'name')
      .select('loanNumber loanDetails.loanAmount status createdAt');
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt');
    
    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          borrowers: borrowerCount,
          lenders: lenderCount,
          admins: adminCount
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          pendingApproval: pendingApprovalLoans,
          approved: approvedLoans,
          rejected: rejectedLoans,
          closed: closedLoans,
          totalAmount: totalLoanAmount
        },
        companies: {
          total: companyCount,
          active: activeCompanies
        },
        documents: {
          total: totalDocuments,
          pendingReview: pendingReviewDocuments
        },
        recent: {
          loans: recentLoans,
          users: recentUsers
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
