const Borrower = require('../models/borrower.model');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get borrower profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getBorrowerProfile = async (req, res, next) => {
  try {
    let borrowerId = req.params.id;
    
    // If no ID is provided, use the current user's ID
    if (!borrowerId && req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id })
        .populate('user', 'firstName lastName email phone profileImage');
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      return res.status(200).json({
        status: 'success',
        data: borrower
      });
    }
    
    // Check permissions if trying to access another borrower's profile
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to access this profile', 403));
    }
    
    // Get borrower by ID
    const borrower = await Borrower.findById(borrowerId)
      .populate('user', 'firstName lastName email phone profileImage');
      
    if (!borrower) {
      return next(new ApiError('Borrower not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: borrower
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all borrowers (for lenders/admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllBorrowers = async (req, res, next) => {
  try {
    // Check permissions
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return next(new ApiError('You are not authorized to access this resource', 403));
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Implement filtering
    const filter = {};
    
    // If lender, only show borrowers assigned to this lender's loans
    if (req.user.role === 'lender') {
      // This would be implemented with a more complex query involving loans
      // For now, we'll just show all borrowers
    }
    
    const borrowers = await Borrower.find(filter)
      .populate('user', 'firstName lastName email phone profileImage')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Borrower.countDocuments(filter);
    
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
 * Update borrower profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateBorrowerProfile = async (req, res, next) => {
  try {
    let borrowerId;
    
    // If borrower is updating their own profile
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      borrowerId = borrower._id;
    } else if (req.user.role === 'lender' || req.user.role === 'admin') {
      // If lender/admin is updating a borrower's profile
      borrowerId = req.params.id;
      
      if (!borrowerId) {
        return next(new ApiError('Borrower ID is required', 400));
      }
    } else {
      return next(new ApiError('You are not authorized to update this profile', 403));
    }
    
    // Update allowed fields
    const allowedFields = [
      'dateOfBirth', 'maritalStatus', 'citizenship', 'primaryAddress',
      'mailingAddress', 'employment', 'financialInfo', 'militaryService',
      'demographicInfo', 'dependents', 'isFirstTimeHomeBuyer', 'declarations'
    ];
    
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    // Update the borrower profile
    const updatedBorrower = await Borrower.findByIdAndUpdate(
      borrowerId,
      updateData,
      { 
        new: true,
        runValidators: true 
      }
    ).populate('user', 'firstName lastName email phone profileImage');
    
    if (!updatedBorrower) {
      return next(new ApiError('Borrower not found', 404));
    }
    
    // Log the update
    logger.info(`Borrower profile updated for ID: ${updatedBorrower._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Borrower profile updated successfully',
      data: updatedBorrower
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update borrower personal info (name, email, phone)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateBorrowerPersonalInfo = async (req, res, next) => {
  try {
    let userId;
    
    // If borrower is updating their own info
    if (req.user.role === 'borrower') {
      userId = req.user._id;
    } else if ((req.user.role === 'lender' || req.user.role === 'admin') && req.params.id) {
      // Get borrower first
      const borrower = await Borrower.findById(req.params.id);
      
      if (!borrower) {
        return next(new ApiError('Borrower not found', 404));
      }
      
      userId = borrower.user;
    } else {
      return next(new ApiError('You are not authorized to update this information', 403));
    }
    
    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone'];
    
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    // Email change requires special handling due to uniqueness
    if (req.body.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return next(new ApiError('Email already in use', 400));
      }
      
      updateData.email = req.body.email;
    }
    
    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!updatedUser) {
      return next(new ApiError('User not found', 404));
    }
    
    // Log the update
    logger.info(`User personal info updated for ID: ${updatedUser._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Personal information updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update financial information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateFinancialInfo = async (req, res, next) => {
  try {
    let borrowerId;
    
    // If borrower is updating their own financial info
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      borrowerId = borrower._id;
    } else if (req.user.role === 'lender' || req.user.role === 'admin') {
      // If lender/admin is updating a borrower's financial info
      borrowerId = req.params.id;
      
      if (!borrowerId) {
        return next(new ApiError('Borrower ID is required', 400));
      }
    } else {
      return next(new ApiError('You are not authorized to update this information', 403));
    }
    
    const { assets, debts, incomeSources, monthlyIncome, totalAssets, totalDebts } = req.body;
    
    // Prepare update data
    const updateData = { 'financialInfo': {} };
    
    if (assets) updateData.financialInfo.assets = assets;
    if (debts) updateData.financialInfo.debts = debts;
    if (incomeSources) updateData.financialInfo.incomeSources = incomeSources;
    if (monthlyIncome) updateData.financialInfo.monthlyIncome = monthlyIncome;
    if (totalAssets) updateData.financialInfo.totalAssets = totalAssets;
    if (totalDebts) updateData.financialInfo.totalDebts = totalDebts;
    
    // Update the borrower's financial info
    const updatedBorrower = await Borrower.findByIdAndUpdate(
      borrowerId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    );
    
    if (!updatedBorrower) {
      return next(new ApiError('Borrower not found', 404));
    }
    
    // Log the update
    logger.info(`Financial information updated for borrower ID: ${updatedBorrower._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Financial information updated successfully',
      data: updatedBorrower.financialInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update employment information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateEmploymentInfo = async (req, res, next) => {
  try {
    let borrowerId;
    
    // If borrower is updating their own employment info
    if (req.user.role === 'borrower') {
      const borrower = await Borrower.findOne({ user: req.user._id });
      
      if (!borrower) {
        return next(new ApiError('Borrower profile not found', 404));
      }
      
      borrowerId = borrower._id;
    } else if (req.user.role === 'lender' || req.user.role === 'admin') {
      // If lender/admin is updating a borrower's employment info
      borrowerId = req.params.id;
      
      if (!borrowerId) {
        return next(new ApiError('Borrower ID is required', 400));
      }
    } else {
      return next(new ApiError('You are not authorized to update this information', 403));
    }
    
    const { currentEmployment, previousEmployment } = req.body;
    
    // Prepare update data
    const updateData = { 'employment': {} };
    
    if (currentEmployment) updateData.employment.currentEmployment = currentEmployment;
    if (previousEmployment) updateData.employment.previousEmployment = previousEmployment;
    
    // Update the borrower's employment info
    const updatedBorrower = await Borrower.findByIdAndUpdate(
      borrowerId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    );
    
    if (!updatedBorrower) {
      return next(new ApiError('Borrower not found', 404));
    }
    
    // Log the update
    logger.info(`Employment information updated for borrower ID: ${updatedBorrower._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Employment information updated successfully',
      data: updatedBorrower.employment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrower dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDashboard = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('You are not authorized to access this resource', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get loan stats
    const loans = await Loan.find({ borrower: borrower._id });
    
    // Calculate statistics
    let totalLoanAmount = 0;
    let totalPaidAmount = 0;
    let activeLoans = 0;
    let completedLoans = 0;
    
    loans.forEach(loan => {
      totalLoanAmount += loan.amount || 0;
      totalPaidAmount += loan.amountPaid || 0;
      
      if (loan.status === 'active') {
        activeLoans++;
      } else if (loan.status === 'completed') {
        completedLoans++;
      }
    });
    
    // Prepare dashboard data
    const dashboardData = {
      loanStats: {
        totalLoanAmount,
        totalPaidAmount,
        activeLoans,
        completedLoans,
        totalLoans: loans.length
      },
      profileCompletion: {
        personalInfo: borrower.user ? 100 : 0,
        financialInfo: borrower.financialInfo ? 100 : 0,
        employmentInfo: borrower.employment ? 100 : 0,
        documents: 0 // This would need to be calculated based on required documents
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrower loans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getBorrowerLoans = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('You are not authorized to access this resource', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get query parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Optional status filter
    
    // Build query
    const query = { primaryBorrower: borrower._id };
    
    // Exclude draft loans unless specifically requested
    if (status) {
      query.status = status;
    } else {
      query.isDraft = { $ne: true }; // Exclude drafts by default
    }
    
    // Get loans
    const loans = await Loan.find(query)
      .populate('assignedLoanOfficer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalLoans = await Loan.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        loans,
        pagination: {
          total: totalLoans,
          page,
          limit,
          pages: Math.ceil(totalLoans / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrower activities
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getBorrowerActivities = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('You are not authorized to access this resource', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get query parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // For this endpoint, we'll mock activities since we don't have a real activity model yet
    // In a real application, you would fetch from an Activity model
    
    // Mock activities data
    const mockActivities = [
      {
        _id: '1',
        title: 'Loan Application Submitted',
        description: 'Your loan application has been successfully submitted.',
        type: 'application',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        _id: '2',
        title: 'Document Uploaded',
        description: 'You uploaded your proof of income document.',
        type: 'document',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        _id: '3',
        title: 'Profile Updated',
        description: 'You updated your personal information.',
        type: 'profile',
        date: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        _id: '4',
        title: 'Application Status Changed',
        description: 'Your loan application status has been updated to "Under Review".',
        type: 'status',
        date: new Date(Date.now() - 0.2 * 24 * 60 * 60 * 1000) // 4.8 hours ago
      },
      {
        _id: '5',
        title: 'Message Received',
        description: 'You received a message from ABC Lenders regarding your application.',
        type: 'message',
        date: new Date() // Now
      }
    ];
    
    // In a real app, you'd paginate from the database
    const activities = mockActivities.slice(0, limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        activities,
        pagination: {
          total: mockActivities.length,
          page,
          limit,
          pages: Math.ceil(mockActivities.length / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get borrower recent draft loans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getRecentDraftLoans = async (req, res, next) => {
  try {
    // Verify user is a borrower
    if (req.user.role !== 'borrower') {
      return next(new ApiError('You are not authorized to access this resource', 403));
    }
    
    // Get borrower profile
    const borrower = await Borrower.findOne({ user: req.user._id });
    
    if (!borrower) {
      return next(new ApiError('Borrower profile not found', 404));
    }
    
    // Get query parameters
    const limit = parseInt(req.query.limit) || 5; // Default to 5 recent drafts
    
    // Get recent draft loans
    const recentDrafts = await Loan.find({ 
      borrower: borrower._id,
      status: 'draft' 
    })
    .sort({ updatedAt: -1 })
    .limit(limit);
    
    res.status(200).json({
      status: 'success',
      data: recentDrafts
    });
  } catch (error) {
    next(error);
  }
};
