const Lender = require('../models/lender.model');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get public lender profile by ID (no authentication required)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getPublicLenderProfile = async (req, res, next) => {
  try {
    const lenderId = req.params.id;
    
    // Find lender profile and only return necessary public information
    const lender = await Lender.findById(lenderId);
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Get user info for the lender
    const user = await User.findById(lender.user, 'firstName lastName profilePicture');
    
    // Return limited public profile information
    const publicProfile = {
      _id: lender._id,
      title: lender.title,
      biography: lender.biography,
      specialties: lender.specialties,
      yearsOfExperience: lender.yearsOfExperience,
      user: user
    };
    
    res.status(200).json({
      status: 'success',
      data: publicProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a lender profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createLender = async (req, res, next) => {
  try {
    // Check if user already has a lender profile
    const existingLender = await Lender.findOne({ user: req.user._id });
    
    if (existingLender) {
      return next(new ApiError('Lender profile already exists for this user', 400));
    }
    
    // Create lender profile with user ID
    const lenderData = {
      ...req.body,
      user: req.user._id
    };
    
    const lender = await Lender.create(lenderData);
    
    // Update user role if not already lender or admin
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      await User.findByIdAndUpdate(req.user._id, { role: 'lender' });
    }
    
    logger.info(`Lender profile created for user ${req.user._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Lender profile created successfully',
      data: lender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lender profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderProfile = async (req, res, next) => {
  try {
    // Find lender profile based on user ID
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: lender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lender profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLenderProfile = async (req, res, next) => {
  try {
    // Find lender profile based on user ID
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Prevent updating certain fields directly
    const { user, company, ...updateData } = req.body;
    
    // Update lender profile
    const updatedLender = await Lender.findByIdAndUpdate(
      lender._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('company', 'name logo website');
    
    logger.info(`Lender profile updated for user ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Lender profile updated successfully',
      data: updatedLender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lender dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderDashboard = async (req, res, next) => {
  try {
    // Find lender profile based on user ID
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Get loan statistics
    const totalLoans = await Loan.countDocuments({ lender: lender._id });
    
    const activeLoans = await Loan.countDocuments({ 
      lender: lender._id,
      status: { $nin: ['Rejected', 'Cancelled', 'Closed'] }
    });
    
    const pendingApprovalLoans = await Loan.countDocuments({
      lender: lender._id,
      status: 'Pending Approval'
    });
    
    const approvedLoans = await Loan.countDocuments({
      lender: lender._id,
      status: 'Approved'
    });
    
    const rejectedLoans = await Loan.countDocuments({
      lender: lender._id,
      status: 'Rejected'
    });
    
    const closedLoans = await Loan.countDocuments({
      lender: lender._id,
      status: 'Closed'
    });
    
    // Calculate total loan amount
    const loanAmountsPipeline = [
      { $match: { lender: lender._id } },
      { $group: { _id: null, total: { $sum: '$loanDetails.loanAmount' } } }
    ];
    
    const loanAmounts = await Loan.aggregate(loanAmountsPipeline);
    const totalLoanAmount = loanAmounts.length > 0 ? loanAmounts[0].total : 0;
    
    // Get recent loans
    const recentLoans = await Loan.find({ lender: lender._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('borrower', 'firstName lastName')
      .select('loanNumber loanDetails.loanAmount status createdAt');
    
    res.status(200).json({
      status: 'success',
      data: {
        totalLoans,
        activeLoans,
        pendingApprovalLoans,
        approvedLoans,
        rejectedLoans,
        closedLoans,
        totalLoanAmount,
        recentLoans
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Associate a lender with a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.associateWithCompany = async (req, res, next) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return next(new ApiError('Company ID is required', 400));
    }
    
    // Find lender profile
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Find company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Update lender with company
    const updatedLender = await Lender.findByIdAndUpdate(
      lender._id,
      { company: companyId },
      { new: true, runValidators: true }
    ).populate('company', 'name logo website');
    
    logger.info(`Lender ${lender._id} associated with company ${companyId}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully associated with company',
      data: updatedLender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lender rate settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateRateSettings = async (req, res, next) => {
  try {
    // Find lender profile
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    const { rateSettings } = req.body;
    
    if (!rateSettings) {
      return next(new ApiError('Rate settings are required', 400));
    }
    
    // Update rate settings
    const updatedLender = await Lender.findByIdAndUpdate(
      lender._id,
      { rateSettings },
      { new: true, runValidators: true }
    );
    
    logger.info(`Lender ${lender._id} updated rate settings`);
    
    res.status(200).json({
      status: 'success',
      message: 'Rate settings updated successfully',
      data: updatedLender.rateSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all lenders (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllLenders = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    // Filter by specialties
    if (req.query.specialty) {
      filter.specialties = { $in: [req.query.specialty] };
    }
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Filter by company
    if (req.query.companyId) {
      filter.company = req.query.companyId;
    }
    
    // Get lenders
    const lenders = await Lender.find(filter)
      .populate('user', 'firstName lastName email profilePicture')
      .populate('company', 'name logo website')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Lender.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: lenders.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: lenders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific lender by ID (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lender = await Lender.findById(id)
      .populate('user', 'firstName lastName email profilePicture')
      .populate('company', 'name logo website');
    
    if (!lender) {
      return next(new ApiError('Lender not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: lender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lender active status (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLenderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return next(new ApiError('Active status is required', 400));
    }
    
    const lender = await Lender.findById(id);
    
    if (!lender) {
      return next(new ApiError('Lender not found', 404));
    }
    
    // Update lender active status
    const updatedLender = await Lender.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    logger.info(`Lender ${id} status updated to ${isActive ? 'active' : 'inactive'} by admin ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: `Lender ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedLender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all borrowers associated with a lender
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderBorrowers = async (req, res, next) => {
  try {
    let lenderId;
    
    // Check if we're getting borrowers for the current user or a specific lender
    if (req.params.lenderId) {
      // For specific lender (admin or same lender check)
      lenderId = req.params.lenderId;
      
      // If not admin, verify user is requesting their own borrowers
      if (req.user.role !== 'admin') {
        const userLender = await Lender.findOne({ user: req.user._id });
        
        if (!userLender || userLender._id.toString() !== lenderId) {
          return next(new ApiError('You are not authorized to view these borrowers', 403));
        }
      }
    } else {
      // For current user
      const lender = await Lender.findOne({ user: req.user._id });
      
      if (!lender) {
        return next(new ApiError('Lender profile not found', 404));
      }
      
      lenderId = lender._id;
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Get all borrowers associated with this lender
    const borrowers = await Borrower.find({ lender: lenderId })
      .populate('user', 'firstName lastName email phone profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Borrower.countDocuments({ lender: lenderId });
    
    res.status(200).json({
      status: 'success',
      results: borrowers.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: borrowers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific borrower by ID for a lender
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderBorrowerById = async (req, res, next) => {
  try {
    const { lenderId, borrowerId } = req.params;
    
    // If not admin, verify user is requesting their own borrower
    if (req.user.role !== 'admin') {
      const userLender = await Lender.findOne({ user: req.user._id });
      
      if (!userLender || userLender._id.toString() !== lenderId) {
        return next(new ApiError('You are not authorized to view this borrower', 403));
      }
    }
    
    // Get borrower details including loans
    const borrower = await Borrower.findOne({ 
      _id: borrowerId,
      lender: lenderId
    }).populate('user', 'firstName lastName email phone profilePicture');
    
    if (!borrower) {
      return next(new ApiError('Borrower not found or not associated with this lender', 404));
    }
    
    // Get loans associated with this borrower
    const loans = await Loan.find({ borrower: borrowerId, lender: lenderId })
      .select('loanDetails status createdAt')
      .sort({ createdAt: -1 });
    
    // Return borrower with loans
    res.status(200).json({
      status: 'success',
      data: {
        borrower,
        loans
      }
    });
  } catch (error) {
    next(error);
  }
};
