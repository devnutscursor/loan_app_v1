const Company = require('../models/company.model');
const Lender = require('../models/lender.model');
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
      .populate('createdBy', 'firstName lastName email')
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
      .populate('createdBy', 'firstName lastName email');
    
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
    const { name, website, logo, address, contactEmail, contactPhone, description } = req.body;
    
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
      website: website || company.website,
      logo: logo || company.logo,
      address: address || company.address,
      contactEmail: contactEmail || company.contactEmail,
      contactPhone: contactPhone || company.contactPhone,
      description: description || company.description,
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
 * Get company lenders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCompanyLenders = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find company
    const company = await Company.findById(id);
    
    if (!company) {
      return next(new ApiError('Company not found', 404));
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Find lenders associated with company
    const lenders = await Lender.find({ company: id })
      .populate('user', 'firstName lastName email profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Lender.countDocuments({ company: id });
    
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
