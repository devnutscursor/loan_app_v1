const Company = require('../models/company.model');
const Lender = require('../models/lender.model');
const Borrower = require('../models/borrower.model');
const Loan = require('../models/loan.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Create a new company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createCompany = async (req, res, next) => {
  try {
    const { name, website, logo, address, contactEmail, contactPhone, description, subscriptionTier } = req.body;
    
    // Check if company with same name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return next(new ApiError('A company with this name already exists', 400));
    }
    
    // Create new company
    const company = await Company.create({
      name,
      website,
      logo,
      address,
      contactEmail,
      contactPhone,
      description,
      subscriptionTier: subscriptionTier || 'Basic',
      createdBy: req.user._id
    });
    
    logger.info(`Company created: ${name} by user ${req.user._id}`);
    
    // Create default loan programs and rates for the company
    try {
      const { createDefaultLoanPrograms } = require('./auth.controller');
      const { createDefaultLoanRates } = require('./loanRate.controller');
      
      await createDefaultLoanPrograms(req.user._id, null, company._id);
      await createDefaultLoanRates(req.user._id, null, company._id);
      logger.info(`Default loan programs and rates created for company ${company._id}`);
    } catch (setupError) {
      logger.error(`Error creating default programs/rates for company ${company._id}:`, setupError);
      // Don't fail the company creation if this fails, just log it
    }
    
    // If user is a lender, associate them with the new company
    if (req.user.role === 'lender') {
      const lender = await Lender.findOne({ user: req.user._id });
      if (lender) {
        await Lender.findByIdAndUpdate(
          lender._id,
          { company: company._id },
          { new: true }
        );
        logger.info(`Lender ${lender._id} associated with new company ${company._id}`);
      }
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all companies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllCompanies = async (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    // Filter by subscription tier
    if (req.query.subscriptionTier) {
      filter.subscriptionTier = req.query.subscriptionTier;
    }
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Get companies
    const companies = await Company.find(filter)
      .populate('primaryContact', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    
    // Get total count for pagination
    const total = await Company.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: companies.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific company by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findById(id)
      .populate('primaryContact', 'firstName lastName email')
      .populate('users', 'firstName lastName email role');
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    
    // Find company
    const company = await Company.findById(id);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Check if updating name and if new name already exists
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ name });
      if (existingCompany) {
        return next(new ApiError('A company with this name already exists', 400));
      }
    }
    
    // Update company
    const updateData = {
      name: name || company.name,
      email: email || company.email,
      phone: phone || company.phone,
    };
    
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Company ${id} updated by user ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update company subscription (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subscriptionTier, subscriptionExpiryDate, maxLenders, maxLoans, additionalFeatures } = req.body;
    
    // Find company
    const company = await Company.findById(id);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Update subscription data
    const updateData = {};
    
    if (subscriptionTier) {
      updateData.subscriptionTier = subscriptionTier;
    }
    
    if (subscriptionExpiryDate) {
      updateData.subscriptionExpiryDate = new Date(subscriptionExpiryDate);
    }
    
    if (maxLenders !== undefined) {
      updateData.maxLenders = maxLenders;
    }
    
    if (maxLoans !== undefined) {
      updateData.maxLoans = maxLoans;
    }
    
    if (additionalFeatures) {
      updateData.additionalFeatures = additionalFeatures;
    }
    
    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Company ${id} subscription updated by admin ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Company subscription updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update company active status (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCompanyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return next(new ApiError('Active status is required', 400));
    }
    
    // Find company
    const company = await Company.findById(id);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Update company active status
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    logger.info(`Company ${id} status updated to ${isActive ? 'active' : 'inactive'} by admin ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedCompany
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company lenders (enhanced for company module UI)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCompanyLenders = async (req, res, next) => {
  const startTime = Date.now();
  try {
    let companyId = req.params.id;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
    
    // For company users, use their own company ID
    if (req.user.role === 'company' && !companyId) {
      companyId = req.user.company;
    }
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    if (!companyId) {
      return next(new ApiError('Company ID is required', 400));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Validate pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new ApiError('Page must be a positive integer', 400));
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new ApiError('Limit must be between 1 and 100', 400));
    }
    
    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email'];
    if (!allowedSortFields.includes(sortBy)) {
      return next(new ApiError(`sortBy must be one of: ${allowedSortFields.join(', ')}`, 400));
    }
    
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const skip = (pageNum - 1) * limitNum;
    
    // Build search filter
    let searchFilter = {};
    if (search && search.trim()) {
      searchFilter = {
        $or: [
          { 'user.firstName': { $regex: search.trim(), $options: 'i' } },
          { 'user.lastName': { $regex: search.trim(), $options: 'i' } },
          { 'user.email': { $regex: search.trim(), $options: 'i' } }
        ]
      };
    }
    
    // Build sort object
    let sortObject = {};
    if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email') {
      sortObject[`user.${sortBy}`] = sortDirection;
    } else {
      sortObject[sortBy] = sortDirection;
    }
    
    // Find lenders with enhanced data
    const lenders = await Lender.find({ company: companyId })
      .populate({
        path: 'user',
        select: 'firstName lastName email phone profileImage isActive lastLogin company',
        match: searchFilter.user ? searchFilter : {}
      })
      .select('_id user nmls title isActive createdAt company')
      .skip(skip)
      .limit(limitNum)
      .sort(sortObject);
    
    // Filter out lenders where user doesn't match search criteria
    const filteredLenders = lenders.filter(lender => lender.user !== null);
    
    // Get additional metrics for each lender
    const lendersWithMetrics = await Promise.all(
      filteredLenders.map(async (lender) => {
        // Get borrower count
        const borrowerCount = await Borrower.countDocuments({ lender: lender._id });
        
        // Get loan count and total amount
        const loanStats = await Loan.aggregate([
          {
            $match: { lender: lender._id }
          },
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
              }
            }
          }
        ]);
        
        const stats = loanStats[0] || {
          totalLoans: 0,
          totalAmount: 0,
          activeLoans: 0
        };
        
        return {
          id: lender._id,
          user: {
            id: lender.user._id,
            firstName: lender.user.firstName,
            lastName: lender.user.lastName,
            email: lender.user.email,
            profileImage: lender.user.profileImage,
            isActive: lender.user.isActive,
            lastLogin: lender.user.lastLogin,
            company: lender.user.company,
            phone: lender.user.phone,
          },
          nmls: lender.nmls,
          title: lender.title,
          isActive: lender.isActive,
          createdAt: lender.createdAt,
          metrics: {
            borrowerCount,
            totalLoans: stats.totalLoans,
            totalLoanAmount: stats.totalAmount,
            activeLoans: stats.activeLoans
          }
        };
      })
    );
    
    // Get total count for pagination (with search filter)
    const totalQuery = { company: companyId };
    if (search && search.trim()) {
      // For search, we need to count lenders whose users match the search criteria
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: search.trim(), $options: 'i' } },
          { lastName: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } }
        ]
      }).select('_id');
      
      const matchingUserIds = matchingUsers.map(user => user._id);
      totalQuery.user = { $in: matchingUserIds };
    }
    
    const total = await Lender.countDocuments(totalQuery);
    
    res.status(200).json({
      status: 'success',
      results: lendersWithMetrics.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      data: {
        company: {
          id: company._id,
          name: company.name,
          maxLenders: company.maxLenders
        },
        lenders: lendersWithMetrics
      }
    });
    
    // Performance monitoring
    const duration = Date.now() - startTime;
    logger.debug(`Company lenders query completed in ${duration}ms for company ${companyId}`, {
      companyId,
      duration,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
      search: search || null,
      totalLenders: total,
      returnedLenders: lendersWithMetrics.length
    });
  } catch (error) {
    logger.error(`Error getting company lenders: ${error.message}`);
    next(error);
  }
};

/**
 * Update company branding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateBranding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { logo, colors, emailTemplate, documents } = req.body;
    
    // Find company
    const company = await Company.findById(id);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Check if user belongs to the company or is an admin
    if (req.user.role !== 'admin') {
      const lender = await Lender.findOne({ user: req.user._id });
      
      if (!lender || lender.company.toString() !== id) {
        return next(new ApiError('You are not authorized to update this company', 403));
      }
    }
    
    // Update branding
    const updateData = { branding: {} };
    
    if (logo) {
      updateData.branding.logo = logo;
    }
    
    if (colors) {
      updateData.branding.colors = colors;
    }
    
    if (emailTemplate) {
      updateData.branding.emailTemplate = emailTemplate;
    }
    
    if (documents) {
      updateData.branding.documents = documents;
    }
    
    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    logger.info(`Company ${id} branding updated by user ${req.user._id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Company branding updated successfully',
      data: updatedCompany.branding
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company statistics (aggregated metrics)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCompanyStats = async (req, res, next) => {
  const startTime = Date.now();
  try {
    let companyId = req.params.id;
    
    // For company users, use their own company ID
    if (req.user.role === 'company' && !companyId) {
      companyId = req.user.company;
    }
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company statistics', 403));
    }
    
    if (!companyId) {
      return next(new ApiError('Company ID is required', 400));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Get all lenders under this company
    const companyLenders = await Lender.find({ company: companyId }).select('_id');
    const lenderIds = companyLenders.map(lender => lender._id);
    
    // Get total lenders count
    const totalLenders = lenderIds.length;
    
    // Get total borrowers across all company lenders
    const totalBorrowers = await Borrower.countDocuments({ 
      lender: { $in: lenderIds } 
    });
    
    // Get loan statistics
    const loanStats = await Loan.aggregate([
      {
        $match: {
          lender: { $in: lenderIds }
        }
      },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanVolume: { $sum: '$loanDetails.loanAmount' },
          activeLoans: {
            $sum: {
              $cond: [
                { $not: { $in: ['$status', ['Rejected', 'Cancelled', 'Closed']] } },
                1,
                0
              ]
            }
          },
          pendingLoans: {
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
      totalLoanVolume: 0,
      activeLoans: 0,
      pendingLoans: 0,
      approvedLoans: 0,
      rejectedLoans: 0,
      closedLoans: 0
    };
    
    // Calculate average loan amount
    const averageLoanAmount = stats.totalLoans > 0 ? stats.totalLoanVolume / stats.totalLoans : 0;
    
    // Performance monitoring
    const duration = Date.now() - startTime;
    logger.debug(`Company stats query completed in ${duration}ms for company ${companyId}`, {
      companyId,
      duration,
      totalLenders,
      totalBorrowers,
      totalLoans: stats.totalLoans
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        company: {
          id: company._id,
          name: company.name,
          maxLenders: company.maxLenders
        },
        summary: {
          totalLenders,
          totalBorrowers,
          totalLoans: stats.totalLoans,
          totalLoanVolume: stats.totalLoanVolume,
          activeLoans: stats.activeLoans,
          averageLoanAmount: Math.round(averageLoanAmount * 100) / 100
        },
        loanBreakdown: {
          pending: stats.pendingLoans,
          approved: stats.approvedLoans,
          rejected: stats.rejectedLoans,
          closed: stats.closedLoans
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting company stats: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new lender for the company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createCompanyLender = async (req, res, next) => {
  try {
    const { id: companyId } = req.params;
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return next(new ApiError('First name, last name, email, and password are required', 400));
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }
    
    // Verify company exists and user has access
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    if (req.user.role === 'company' && req.user.company.toString() !== companyId) {
      return next(new ApiError('You can only create lenders for your own company', 403));
    }
    
    // Enforce maxLenders capacity
    try {
      const { assertCompanyCapacity } = require('../services/company.service');
      await assertCompanyCapacity(company._id);
    } catch (capErr) {
      return next(capErr);
    }
    
    // Create new lender user with email verified (since company created it)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'lender',
      isEmailVerified: true, // Skip email verification for company-created users
      isActive: true
    });
    
    // Create lender profile associated to company
    const lender = await Lender.create({
      user: user._id,
      name: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      company: company._id,
      isActive: true
    });
    
    // Create loan programs and rates for the new lender
    try {
      const { copyCompanyLoanProgramsToLender } = require('./auth.controller');
      const { copyCompanyLoanRatesToLender } = require('./loanRate.controller');
      
      // Copy company programs and rates to the lender
      await copyCompanyLoanProgramsToLender(user._id, lender._id, company._id);
      await copyCompanyLoanRatesToLender(user._id, lender._id, company._id);
      logger.info(`Company loan programs and rates copied to lender ${lender._id}`);
    } catch (setupError) {
      logger.error(`Error copying company programs/rates to lender ${lender._id}:`, setupError);
      // Don't fail the user creation if this fails, just log it
    }
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`Lender user created: ${email} by ${req.user.role} ${req.user._id} for company ${company._id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Lender created successfully',
      data: {
        user,
        lender
      }
    });
  } catch (error) {
    logger.error(`Error creating company lender: ${error.message}`);
    next(error);
  }
};

/**
 * Get top lenders for a company with sorting options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTopLenders = async (req, res, next) => {
  const startTime = Date.now();
  try {
    let companyId = req.params.id;
    const { sortBy = 'borrowers', limit = 5 } = req.query;
    
    // For company users, use their own company ID
    if (req.user.role === 'company' && !companyId) {
      companyId = req.user.company;
    }
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    if (!companyId) {
      return next(new ApiError('Company ID is required', 400));
    }
    
    // Validate sortBy parameter
    if (!['borrowers', 'amount'].includes(sortBy)) {
      return next(new ApiError('sortBy must be either "borrowers" or "amount"', 400));
    }
    
    // Validate limit parameter
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      return next(new ApiError('limit must be a number between 1 and 20', 400));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Get all lenders under this company with their user data
    const companyLenders = await Lender.find({ company: companyId })
      .populate('user', 'firstName lastName email profileImage')
      .select('_id user');
    
    if (companyLenders.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          company: {
            id: company._id,
            name: company.name
          },
          topLenders: [],
          sortBy,
          totalLenders: 0
        }
      });
    }
    
    const lenderIds = companyLenders.map(lender => lender._id);
    
    // Aggregate borrower counts and loan amounts for each lender
    const lenderStats = await Promise.all(
      companyLenders.map(async (lender) => {
        // Get borrower count for this lender
        const borrowerCount = await Borrower.countDocuments({ lender: lender._id });
        
        // Get loan amount for this lender
        const loanAmountResult = await Loan.aggregate([
          {
            $match: { lender: lender._id }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$loanDetails.loanAmount' }
            }
          }
        ]);
        
        const totalLoanAmount = loanAmountResult[0]?.totalAmount || 0;
        
        return {
          lender: lender,
          borrowerCount,
          totalLoanAmount
        };
      })
    );
    
    // Sort by the requested metric
    const sortedLenders = lenderStats.sort((a, b) => {
      if (sortBy === 'borrowers') {
        return b.borrowerCount - a.borrowerCount;
      } else {
        return b.totalLoanAmount - a.totalLoanAmount;
      }
    });
    
    // Take only the top N lenders
    const topLenders = sortedLenders.slice(0, limitNum).map((item, index) => ({
      rank: index + 1,
      lender: {
        id: item.lender._id,
        user: {
          id: item.lender.user._id,
          firstName: item.lender.user.firstName,
          lastName: item.lender.user.lastName,
          email: item.lender.user.email,
          profileImage: item.lender.user.profileImage
        }
      },
      metrics: {
        borrowerCount: item.borrowerCount,
        totalLoanAmount: item.totalLoanAmount
      }
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        company: {
          id: company._id,
          name: company.name
        },
        topLenders,
        sortBy,
        totalLenders: companyLenders.length,
        limit: limitNum
      }
    });
    
    // Performance monitoring
    const duration = Date.now() - startTime;
    logger.debug(`Top lenders query completed in ${duration}ms for company ${companyId}`, {
      companyId,
      duration,
      sortBy,
      limit: limitNum,
      totalLenders: companyLenders.length,
      returnedLenders: topLenders.length
    });
  } catch (error) {
    logger.error(`Error getting top lenders: ${error.message}`);
    next(error);
  }
};

/**
 * Get lender dashboard data for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderDashboard = async (req, res, next) => {
  try {
    const { companyId, lenderId } = req.params;
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId })
      .populate('user', 'firstName lastName email phone');
    
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    // Get loan statistics for this lender
    const loanStats = await Loan.aggregate([
      {
        $match: {
          lender: lender._id
        }
      },
      {
        $group: {
          _id: null,
          totalLoans: {
            $sum: {
              $cond: [
                { $not: { $in: ['$status', ['closed', 'rejected', 'withdrawn']] } },
                1,
                0
              ]
            }
          },
          approvedLoans: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded']] },
                1,
                0
              ]
            }
          },
          pendingApplications: {
            $sum: {
              $cond: [
                { $not: { $in: ['$status', ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded', 'Rejected', 'Withdrawn']] } },
                1,
                0
              ]
            }
          },
          totalAmount: {
            $sum: '$loanDetails.loanAmount'
          }
        }
      }
    ]);
    
    const stats = loanStats[0] || {
      totalLoans: 0,
      approvedLoans: 0,
      pendingApplications: 0,
      totalAmount: 0
    };

    // Calculate performance metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get loans from last 30 days for metrics calculation
    const recentLoanStats = await Loan.aggregate([
      {
        $match: {
          lender: lender._id,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRecentLoans: { $sum: 1 },
          approvedRecentLoans: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded']] },
                1,
                0
              ]
            }
          },
          avgProcessingTime: {
            $avg: {
              $cond: [
                { $in: ['$status', ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded']] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const recentStats = recentLoanStats[0] || {
      totalRecentLoans: 0,
      approvedRecentLoans: 0,
      avgProcessingTime: 0
    };

    // Calculate approval rate
    const approvalRate = recentStats.totalRecentLoans > 0 
      ? Math.round((recentStats.approvedRecentLoans / recentStats.totalRecentLoans) * 100)
      : 0;

    // Calculate average processing time
    const avgProcessingTime = recentStats.avgProcessingTime 
      ? Math.round(recentStats.avgProcessingTime)
      : 0;

    // Mock trend data (in a real app, you'd calculate this from historical data)
    const metrics = {
      approvalRate,
      approvalRateTrend: Math.floor(Math.random() * 20) - 10, // Random trend between -10% and +10%
      avgProcessingTime,
      processingTimeTrend: Math.floor(Math.random() * 20) - 10 // Random trend between -10% and +10%
    };
    
    // Get recent loans
    const recentLoans = await Loan.find({ lender: lender._id })
      .populate({
        path: 'borrower',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .select('loanDetails status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Transform recent loans data
    const transformedLoans = recentLoans.map(loan => ({
      _id: loan._id,
      loanNumber: loan.loanDetails?.loanNumber,
      status: loan.status,
      loanAmount: loan.loanDetails?.loanAmount,
      borrowerDetails: {
        firstName: loan.borrower?.user?.firstName,
        lastName: loan.borrower?.user?.lastName
      },
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        lender: {
          _id: lender._id,
          name: `${lender.user.firstName} ${lender.user.lastName}`,
          email: lender.user.email,
          phone: lender.user.phone,
          isActive: lender.isActive
        },
        stats: {
          totalLoans: stats.totalLoans,
          approvedLoans: stats.approvedLoans,
          pendingApplications: stats.pendingApplications,
          totalAmount: stats.totalAmount,
          metrics: metrics
        },
        recentLoans: transformedLoans
      }
    });
  } catch (error) {
    logger.error(`Error getting lender dashboard: ${error.message}`);
    next(error);
  }
};

/**
 * Get lender borrowers for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderBorrowers = async (req, res, next) => {
  try {
    const { companyId, lenderId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    console.log("companyId", companyId);
    console.log("lenderId", lenderId);
    console.log("req.user", req.user);

    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId });
    console.log("lender", lender);
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get borrowers for this lender
    const borrowers = await Borrower.find({ lender: lenderId })
      .populate('user', 'firstName lastName email phone createdAt')
      .select('_id user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get loan counts for each borrower
    const borrowersWithLoanCounts = await Promise.all(
      borrowers.map(async (borrower) => {
        const loanCount = await Loan.countDocuments({ borrower: borrower._id });
        return {
          _id: borrower._id,
          user: borrower.user,
          loanCount
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: borrowersWithLoanCounts
    });
  } catch (error) {
    logger.error(`Error getting lender borrowers: ${error.message}`);
    next(error);
  }
};

/**
 * Get lender activities for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderActivities = async (req, res, next) => {
  try {
    const { companyId, lenderId } = req.params;
    const { limit = 5 } = req.query;
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId });
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    const limitNum = parseInt(limit, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get recent loans for activities
    const recentLoans = await Loan.find({ 
      lender: lenderId,
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate({
        path: 'borrower',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .select('status createdAt updatedAt loanDetails')
      .sort({ updatedAt: -1 })
      .limit(limitNum)
      .lean();
    
    // Transform loans into activities
    const activities = recentLoans.map((loan, index) => {
      const borrowerName = loan.borrower?.user ? 
        `${loan.borrower.user.firstName} ${loan.borrower.user.lastName}` : 
        'Unknown Borrower';
      
      let title, icon, statusColor;
      
      switch (loan.status) {
        case 'Conditional Approval':
        case 'Clear to Close':
        case 'Approved':
          title = `Loan approved for ${borrowerName}`;
          icon = 'CheckCircle';
          statusColor = 'green';
          break;
        case 'Rejected':
          title = `Loan rejected for ${borrowerName}`;
          icon = 'XCircle';
          statusColor = 'red';
          break;
        case 'Application Submitted':
        case 'Under Review':
          title = `New application from ${borrowerName}`;
          icon = 'FileText';
          statusColor = 'blue';
          break;
        default:
          title = `Loan updated for ${borrowerName}`;
          icon = 'RefreshCw';
          statusColor = 'yellow';
      }
      
      return {
        id: `activity-${loan._id}-${index}`,
        title,
        description: `Loan #${loan.loanDetails?.loanNumber || loan._id.toString().slice(-6)}`,
        time: new Date(loan.updatedAt).toLocaleString(),
        status: loan.status,
        icon,
        statusColor,
        entityId: loan._id,
        entityType: 'loan',
        borrowerId: loan.borrower?._id
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    logger.error(`Error getting lender activities: ${error.message}`);
    next(error);
  }
};

/**
 * Get a specific lender for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLender = async (req, res, next) => {
  try {
    const { companyId, lenderId } = req.params;
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId })
      .populate('user', 'firstName lastName email phone profileImage isActive lastLogin')
      .select('_id user nmls title isActive createdAt company');
    
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    // Get additional metrics
    const borrowerCount = await Borrower.countDocuments({ lender: lender._id });
    
    const loanStats = await Loan.aggregate([
      {
        $match: { lender: lender._id }
      },
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
          }
        }
      }
    ]);
    
    const stats = loanStats[0] || {
      totalLoans: 0,
      totalAmount: 0,
      activeLoans: 0
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        _id: lender._id,
        name: `${lender.user.firstName} ${lender.user.lastName}`,
        email: lender.user.email,
        phone: lender.user.phone,
        profileImage: lender.user.profileImage,
        isActive: lender.isActive,
        lastLogin: lender.user.lastLogin,
        nmls: lender.nmls,
        title: lender.title,
        createdAt: lender.createdAt,
        company: lender.company,
        metrics: {
          borrowerCount,
          totalLoans: stats.totalLoans,
          totalLoanAmount: stats.totalAmount,
          activeLoans: stats.activeLoans
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting lender: ${error.message}`);
    next(error);
  }
};

/**
 * Get lender programs for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderPrograms = async (req, res, next) => {
  try {
    const { companyId, lenderId } = req.params;
    const { limit = 10 } = req.query;
    
    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId });
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    const limitNum = parseInt(limit, 10);
    
    // Get loan programs for this lender
    const LoanProgram = require('../models/loanProgram.model');
    const programs = await LoanProgram.find({ lender: lenderId })
      .select('programName programType loanTerm minLoanAmount maxLoanAmount interestRate isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();
    
    res.status(200).json({
      status: 'success',
      data: programs
    });
  } catch (error) {
    logger.error(`Error getting lender programs: ${error.message}`);
    next(error);
  }
};

/**
 * Get lender borrower loans for company access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderBorrowerLoans = async (req, res, next) => {
  try {
    const { companyId, lenderId, borrowerId } = req.params;
    const { limit = 10, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    console.log("companyId", companyId);
    console.log("lenderId", lenderId);
    console.log("borrowerId", borrowerId);
    console.log("req.user", req.user);

    // For company users, ensure they can only access their own company
    if (req.user.role === 'company' && companyId !== req.user.company.toString()) {
      return next(new ApiError('You can only access your own company lenders', 403));
    }
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Verify lender exists and belongs to company
    const lender = await Lender.findOne({ _id: lenderId, company: companyId });
    if (!lender) {
      return next(new ApiError('Lender not found or not associated with this company', 404));
    }
    
    // Verify borrower exists and belongs to lender
    const borrower = await Borrower.findOne({ _id: borrowerId, lender: lenderId });
    if (!borrower) {
      return next(new ApiError('Borrower not found or not associated with this lender', 404));
    }
    
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query for loans
    const query = {
      borrower: borrowerId,
      lender: lenderId
    };
    
    // Get loans with full details
    const Loan = require('../models/loan.model');
    const loans = await Loan.find(query)
      .populate('borrower', 'firstName lastName email phone')
      .populate('lender', 'firstName lastName email')
      .populate('assignedLoanOfficer', 'firstName lastName')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get total count for pagination
    const totalLoans = await Loan.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        loans,
        borrower: {
          _id: borrower._id,
          user: borrower.user,
          lender: borrower.lender
        },
        pagination: {
          total: totalLoans,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalLoans / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting lender borrower loans: ${error.message}`);
    next(error);
  }
};
