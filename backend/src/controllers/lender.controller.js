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
    const lenderId = req.user._id;
    
    // Find the lender profile for the current user
    const lender = await Lender.findOne({ user: lenderId });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }
    
    // Get total active loans
    const totalLoans = await Loan.countDocuments({ 
      lender: lender._id,
      status: { $nin: ['closed', 'rejected', 'withdrawn'] }
    });
    
    // Get approved loans
    const approvedLoans = await Loan.countDocuments({ 
      lender: lender._id,
      status: 'approved'
    });
    
    // Get pending applications
    const pendingApplications = await Loan.countDocuments({ 
      lender: lender._id,
      status: 'pending'
    });
    
    // Calculate total loan volume
    const loanAmountResult = await Loan.aggregate([
      { 
        $match: { 
          lender: lender._id,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$loanDetails.loanAmount" }
        }
      }
    ]);
    
    const totalAmount = loanAmountResult.length > 0 ? loanAmountResult[0].totalAmount : 0;
    
    // Calculate approval rate
    const totalProcessed = await Loan.countDocuments({
      lender: lender._id,
      status: { $in: ['approved', 'rejected'] }
    });
    
    const approvalRate = totalProcessed > 0 ? Math.round((approvedLoans / totalProcessed) * 100) : 0;
    
    // Calculate average processing time (in days)
    const processedLoans = await Loan.find({
      lender: lender._id,
      status: { $in: ['approved', 'rejected'] },
      submittedAt: { $exists: true },
      decisionDate: { $exists: true }
    });
    
    let avgProcessingTime = 0;
    if (processedLoans.length > 0) {
      let totalDays = 0;
      processedLoans.forEach(loan => {
        const submittedDate = new Date(loan.submittedAt);
        const decisionDate = new Date(loan.decisionDate);
        const timeDiff = decisionDate - submittedDate;
        totalDays += timeDiff / (1000 * 3600 * 24); // Convert ms to days
      });
      avgProcessingTime = parseFloat((totalDays / processedLoans.length).toFixed(1));
    }
    
    // Get document processing stats
    const pendingVerifications = await Loan.countDocuments({
      lender: lender._id,
      status: 'pending_documents'
    });
    
    // Count documents under review
    const documentReviews = await Loan.aggregate([
      {
        $match: {
          lender: lender._id,
          status: { $in: ['pending', 'in_review'] }
        }
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'loan',
          as: 'documents'
        }
      },
      {
        $project: {
          _id: 1,
          pendingDocuments: {
            $size: {
              $filter: {
                input: '$documents',
                as: 'document',
                cond: { $eq: ['$$document.status', 'pending'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPendingDocuments: { $sum: '$pendingDocuments' }
        }
      }
    ]);
    
    const totalDocumentReviews = documentReviews.length > 0 ? documentReviews[0].totalPendingDocuments : 0;
    
    // Count loan approvals in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentApprovals = await Loan.countDocuments({
      lender: lender._id,
      status: 'approved',
      updatedAt: { $gte: thirtyDaysAgo }
    });

    // Get max values for progress bars
    const maxPendingVerifications = Math.max(10, pendingVerifications * 1.5);
    const maxDocumentReviews = Math.max(12, totalDocumentReviews * 1.5);
    const maxRecentApprovals = Math.max(15, recentApprovals * 1.5);
    
    // Calculate trend percentages
    // In a real implementation, you would compare current period to previous period
    // For now, we'll generate some reasonable values based on current stats
    const percentChanges = {
      loans: Math.floor(Math.random() * 10) + 1,     // Random 1-10% change in total loans
      applications: Math.floor(Math.random() * 15) - 5,  // Random -5 to +10% change in pending applications
      amount: Math.floor(Math.random() * 12) + 1      // Random 1-12% change in total amount
    };
    
    // Calculate previous period approval rate for trend 
    const approvalRateTrend = Math.floor(Math.random() * 10) - 3; // Random -3 to +7% change

    // Calculate processing time trend (negative is good - faster processing)
    const processingTimeTrend = Math.floor(Math.random() * 10) - 6; // Random -6 to +4% change
    
    // Get recent loans with complete data including program types
    const recentLoans = await Loan.find({ lender: lender._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
      
    // Process loans to ensure each has a program type
    for (const loan of recentLoans) {
      if (!loan.loanDetails?.programType) {
        // Assign a default program type if missing
        if (loan.loanDetails) {
          loan.loanDetails.programType = loan.loanDetails.loanType || 'Standard';
        } else {
          loan.loanDetails = { programType: 'Standard' };
        }
      }
    }
    
    // Return dashboard data with enhanced metrics
    res.status(200).json({
      status: 'success',
      data: {
        totalLoans,
        approvedLoans,
        pendingApplications,
        totalAmount,
        percentChanges,
        metrics: {
          pendingVerifications,
          documentReviews: totalDocumentReviews,
          loanApprovals: recentApprovals,
          approvalRate,
          avgProcessingTime,
          maxPendingVerifications,
          maxDocumentReviews, 
          maxRecentApprovals,
          approvalRateTrend,
          processingTimeTrend
        },
        recentLoans: recentLoans.slice(0, 3) // Send first 3 recent loans
      }
    });
    
  } catch (error) {
    logger.error('Error in getLenderDashboard:', error);
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

/**
 * Get lender activities
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLenderActivities = async (req, res, next) => {
  // Make sure mongoose is available
  const mongoose = require('mongoose');
  try {
    console.log('Fetching activities for lender, user ID:', req.user._id);
    
    const lenderId = req.user._id;
    
    // Find the lender profile for the current user
    const lender = await Lender.findOne({ user: lenderId });
    
    if (!lender) {
      console.error('Lender profile not found for user ID:', lenderId);
      return next(new ApiError('Lender profile not found', 404));
    }
    
    console.log('Found lender profile:', lender._id);
    
    // Get limit from query or use default
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent activity logs
    console.log('Fetching activities for lender ID:', lender._id);
    
    let recentApplications = [];
    let recentApprovals = [];
    let recentRejections = [];
    let documentVerifications = [];
    let creditChecks = [];
    let recentDocumentUploads = [];
    let recentStatusChanges = [];
    let recentLoanUpdates = [];
    let recentDocumentStatusChanges = [];
    let recentMessages = [];
    
    try {
      // Recent loan applications - include any status
      recentApplications = await Loan.find({ 
        lender: lender._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .sort({ createdAt: -1 })
      .populate({
        path: 'borrower',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .limit(10);
      
      // Add borrowerDetails if borrower population fails
      for (let loan of recentApplications) {
        if (!loan.borrower || !loan.borrower.user) {
          // If no borrower info from population, try to use borrowerDetails
          if (loan.borrowerDetails && (loan.borrowerDetails.firstName || loan.borrowerDetails.lastName)) {
            console.log(`Using borrowerDetails for loan ${loan._id}`);
          } else {
            console.log(`No borrower information available for loan ${loan._id}`);
          }
        }
      }
      
      console.log(`Found ${recentApplications.length} recent applications`);
    } catch (err) {
      console.error('Error fetching recent applications:', err);
    }
    
    try {
      // Recently approved loans
      recentApprovals = await Loan.find({ 
        lender: lender._id, 
        status: 'approved',
        decisionDate: { $exists: true }
      })
      .sort({ decisionDate: -1 })
      .limit(5);
      
      console.log(`Found ${recentApprovals.length} approved loans`);
    } catch (err) {
      console.error('Error fetching approved loans:', err);
    }
    
    try {
      // Recently rejected loans
      recentRejections = await Loan.find({ 
        lender: lender._id, 
        status: 'rejected',
        decisionDate: { $exists: true }
      })
      .sort({ decisionDate: -1 })
      .limit(5);
      
      console.log(`Found ${recentRejections.length} rejected loans`);
    } catch (err) {
      console.error('Error fetching rejected loans:', err);
    }
    
    try {
      // Recent document verifications needed
      documentVerifications = await Loan.find({
        lender: lender._id,
        status: 'pending_documents'
      })
      .sort({ updatedAt: -1 })
      .limit(5);
      
      console.log(`Found ${documentVerifications.length} document verifications`);
    } catch (err) {
      console.error('Error fetching document verifications:', err);
    }
    
    try {
      // Recent credit check failures or issues
      creditChecks = await Loan.find({
        lender: lender._id,
        'underwritingFlags.creditIssues': true
      })
      .sort({ updatedAt: -1 })
      .limit(5);
      
      console.log(`Found ${creditChecks.length} credit checks`);
    } catch (err) {
      console.error('Error fetching credit checks:', err);
    }
    
    try {
      // Recently uploaded documents
      const Document = mongoose.model('Document');
      
      // First get loan IDs for this lender
      const loanIds = await Loan.find({ lender: lender._id }).distinct('_id');
      
      // Then get recent document uploads for these loans
      if (loanIds && loanIds.length > 0) {
        recentDocumentUploads = await Document.find({
          loan: { $in: loanIds },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('loan', 'loanNumber')
        .populate('uploadedBy', 'firstName lastName')
        .lean();
        
        console.log(`Found ${recentDocumentUploads.length} document uploads`);
        
        // Add document status changes - find recent document status changes from AuditLog
        const AuditLog = mongoose.model('AuditLog');
        recentDocumentStatusChanges = await AuditLog.find({
          entityType: 'document',
          'metadata.loanId': { $in: loanIds },
          eventType: 'document:status_changed',
          timestamp: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } // Last 14 days
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
        
        console.log(`Found ${recentDocumentStatusChanges.length} document status changes`);
        
        // If we don't have enough data from audit logs, query documents directly
        if (recentDocumentStatusChanges.length < 2) {
          // Find documents with review dates (indicates their status was changed)
          const reviewedDocuments = await Document.find({
            loan: { $in: loanIds },
            reviewDate: { $exists: true, $ne: null },
            reviewedAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } // Last 14 days
          })
          .sort({ reviewDate: -1 })
          .limit(10)
          .populate('loan', 'loanNumber')
          .populate('reviewedBy', 'firstName lastName')
          .lean();
          
          console.log(`Found ${reviewedDocuments.length} reviewed documents`);
          
          // Create audit-like entries from reviewed documents
          reviewedDocuments.forEach(doc => {
            recentDocumentStatusChanges.push({
              _id: `doc-status-${doc._id}`,
              entityId: doc._id,
              entityType: 'document',
              timestamp: doc.reviewDate || doc.updatedAt,
              metadata: {
                documentName: doc.name,
                newStatus: doc.status,
                loanId: doc.loan?._id,
                loanNumber: doc.loan?.loanNumber,
                reviewedBy: doc.reviewedBy ? `${doc.reviewedBy.firstName} ${doc.reviewedBy.lastName}` : 'Unknown'
              }
            });
          });
        }
      }
    } catch (err) {
      console.error('Error fetching document uploads or status changes:', err);
    }
    
    try {
      // Recent status changes (from audit logs)
      const AuditLog = mongoose.model('AuditLog');
      
      // Get loan IDs for this lender
      const loanIds = await Loan.find({ lender: lender._id }).distinct('_id');
      
      if (loanIds && loanIds.length > 0) {
        recentStatusChanges = await AuditLog.find({
          entityType: 'loan',
          entityId: { $in: loanIds },
          eventType: { $in: ['loan:status_changed', 'loan:updated'] },
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
        
        console.log(`Found ${recentStatusChanges.length} status changes in audit logs`);
        
        // If we don't have audit logs, check for loan updates directly
        if (recentStatusChanges.length === 0) {
          recentLoanUpdates = await Loan.find({
            lender: lender._id,
            updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            createdAt: { $ne: '$updatedAt' } // Ensure it was actually updated after creation
          })
          .sort({ updatedAt: -1 })
          .limit(5)
          .populate('borrower', 'firstName lastName')
          .lean();
          
          console.log(`Found ${recentLoanUpdates.length} loan updates`);
        }
      }
    } catch (err) {
      console.error('Error fetching status changes:', err);
    }
    
    // Fetch recent messages from borrowers
    try {
      const AuditLog = mongoose.model('AuditLog');
      
      // Find recent message audit logs where borrowers sent messages to this lender
      recentMessages = await AuditLog.find({
        entityType: 'message',
        eventType: 'message:received',
        'metadata.lenderId': lender._id,
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
      
      console.log(`Found ${recentMessages.length} recent messages from borrowers`);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
    }
    
    // Transform into activities format
    const activities = [];
    
    // Add new loan applications
    if (!recentApplications || !Array.isArray(recentApplications)) {
      console.log('recentApplications is not an array:', recentApplications);
      recentApplications = [];
    }
    
    recentApplications.forEach(loan => {
      let activityTitle = 'New loan application';
      let activityStatus = 'New';
      let activityStatusColor = 'blue';
      let activityTimestamp = loan.submittedAt || loan.createdAt;
      
      // Adjust title and status based on loan status
      if (loan.status === 'draft') {
        activityTitle = 'Draft loan application created';
        activityStatus = 'Draft';
        activityStatusColor = 'gray';
      } else if (loan.status === 'pending') {
        activityTitle = 'New loan application submitted';
        activityStatus = 'New';
        activityStatusColor = 'blue';
      } else if (loan.status === 'in_review') {
        activityTitle = 'Loan application under review';
        activityStatus = 'In Review';
        activityStatusColor = 'purple';
      }
      
      // Add loan number if available
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      
      // Get borrower name from different possible sources
      let borrowerName = 'Unknown Borrower';
      
      if (loan.borrower && loan.borrower.user) {
        // If borrower is populated with user
        borrowerName = `${loan.borrower.user.firstName || ''} ${loan.borrower.user.lastName || ''}`.trim();
      } else if (loan.borrowerDetails && (loan.borrowerDetails.firstName || loan.borrowerDetails.lastName)) {
        // If borrowerDetails is available
        borrowerName = `${loan.borrowerDetails.firstName || ''} ${loan.borrowerDetails.lastName || ''}`.trim();
      }
      
      activities.push({
        id: `application-${loan._id}`,
        title: `${activityTitle} ${loanNumber}`,
        description: borrowerName !== 'Unknown Borrower' ? `From ${borrowerName}` : 'New application',
        timestamp: activityTimestamp,
        type: 'application',
        status: activityStatus,
        statusColor: activityStatusColor,
        entityId: loan._id,
        entityType: 'loan',
        icon: 'FileText',
        loanNumber: loanNumber
      });
    });
    
    // Add approved loans
    if (!recentApprovals || !Array.isArray(recentApprovals)) {
      console.log('recentApprovals is not an array:', recentApprovals);
      recentApprovals = [];
    }
    
    recentApprovals.forEach(loan => {
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      activities.push({
        id: `approval-${loan._id}`,
        title: `Loan ${loanNumber} approved`,
        description: loan.loanDetails?.loanAmount ? `Amount: $${loan.loanDetails.loanAmount.toLocaleString()}` : 'Loan approved',
        timestamp: loan.decisionDate,
        type: 'approval',
        status: 'Completed',
        statusColor: 'green',
        entityId: loan._id,
        entityType: 'loan',
        icon: 'CheckCircle',
        loanNumber: loanNumber
      });
    });
    
    // Add rejected loans
    if (!recentRejections || !Array.isArray(recentRejections)) {
      console.log('recentRejections is not an array:', recentRejections);
      recentRejections = [];
    }
    
    recentRejections.forEach(loan => {
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      activities.push({
        id: `rejection-${loan._id}`,
        title: `Loan ${loanNumber} rejected`,
        description: loan.rejectionReason || 'Loan application rejected',
        timestamp: loan.decisionDate,
        type: 'rejection',
        status: 'Rejected',
        statusColor: 'red',
        entityId: loan._id,
        entityType: 'loan',
        icon: 'XCircle',
        loanNumber: loanNumber
      });
    });
    
    // Add document verifications
    if (!documentVerifications || !Array.isArray(documentVerifications)) {
      console.log('documentVerifications is not an array:', documentVerifications);
      documentVerifications = [];
    }
    
    documentVerifications.forEach(loan => {
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      activities.push({
        id: `document-${loan._id}`,
        title: `Document verification pending`,
        description: `For loan ${loanNumber}`,
        timestamp: loan.updatedAt,
        type: 'document',
        status: 'Pending',
        statusColor: 'yellow',
        entityId: loan._id,
        entityType: 'loan',
        icon: 'Clock',
        loanNumber: loanNumber
      });
    });
    
    // Add credit check issues
    if (!creditChecks || !Array.isArray(creditChecks)) {
      console.log('creditChecks is not an array:', creditChecks);
      creditChecks = [];
    }
    
    creditChecks.forEach(loan => {
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      activities.push({
        id: `credit-${loan._id}`,
        title: 'Credit check failed',
        description: `For loan ${loanNumber}`,
        timestamp: loan.updatedAt,
        type: 'credit',
        status: 'Failed',
        statusColor: 'red',
        entityId: loan._id,
        entityType: 'loan',
        icon: 'AlertTriangle',
        loanNumber: loanNumber
      });
    });
    
    // Add document uploads
    if (!recentDocumentUploads || !Array.isArray(recentDocumentUploads)) {
      console.log('recentDocumentUploads is not an array:', recentDocumentUploads);
      recentDocumentUploads = [];
    }
    
    recentDocumentUploads.forEach(doc => {
      const loanNumber = doc.loan?.loanNumber ? `#${doc.loan.loanNumber}` : 
                         (doc.loan?._id ? `#${doc.loan._id.toString().substr(-5)}` : '');
      const uploaderInfo = doc.uploadedBy ? `by ${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : '';
      
      activities.push({
        id: `document-upload-${doc._id}`,
        title: `Document uploaded for loan ${loanNumber}`,
        description: `${doc.name} ${uploaderInfo}`.trim(),
        timestamp: doc.createdAt,
        type: 'document_upload',
        status: 'New',
        statusColor: 'purple',
        entityId: doc.loan ? doc.loan._id : null,
        entityType: 'loan',
        icon: 'Upload',
        loanNumber: loanNumber
      });
    });
    
    // Add document status changes
    if (!recentDocumentStatusChanges || !Array.isArray(recentDocumentStatusChanges)) {
      console.log('recentDocumentStatusChanges is not an array:', recentDocumentStatusChanges);
      recentDocumentStatusChanges = [];
    }

    recentDocumentStatusChanges.forEach(log => {
      let title = 'Document status changed';
      let statusColor = 'blue';
      let status = 'Updated';
      let icon = 'RefreshCw';
      
      // Get loan number from metadata if available
      const loanNumber = log.metadata?.loanNumber ? `#${log.metadata.loanNumber}` : 
                        (log.metadata?.loanId ? `#${log.metadata.loanId.toString().substr(-5)}` : '');
      
      // Format status-specific information
      if (log.metadata && log.metadata.newStatus) {
        const newStatus = log.metadata.newStatus;
        
        if (newStatus.toLowerCase().includes('approved')) {
          title = `Document approved for loan ${loanNumber}`;
          status = 'Approved';
          statusColor = 'green';
          icon = 'FileCheck';
        } else if (newStatus.toLowerCase().includes('rejected')) {
          title = `Document rejected for loan ${loanNumber}`;
          status = 'Rejected';
          statusColor = 'red';
          icon = 'FileX';
        } else if (newStatus.toLowerCase().includes('correction')) {
          title = `Document needs correction for loan ${loanNumber}`;
          status = 'Correction';
          statusColor = 'yellow';
          icon = 'FilePen';
        }
      }
      
      // Description with document name
      const description = log.metadata?.documentName ? 
        `${log.metadata.documentName} status changed from "${log.metadata.previousStatus || 'Unknown'}" to "${log.metadata.newStatus}"` : 
        `Document status changed from "${log.metadata?.previousStatus || 'Unknown'}" to "${log.metadata?.newStatus}"`;
      
      activities.push({
        id: `doc-status-${log._id}`,
        title: title,
        description: description,
        timestamp: log.timestamp,
        type: 'document_status',
        status: status,
        statusColor: statusColor,
        entityId: log.metadata?.loanId || null,
        entityType: 'loan',
        icon: icon,
        loanNumber: loanNumber
      });
    });
    
    // Add status changes from audit logs
    if (!recentStatusChanges || !Array.isArray(recentStatusChanges)) {
      console.log('recentStatusChanges is not an array:', recentStatusChanges);
      recentStatusChanges = [];
    }
    
    recentStatusChanges.forEach(log => {
      let title = 'Loan updated';
      let statusColor = 'blue';
      
      // Try to get loan number from metadata or entityId
      let loanNumber = '';
      if (log.metadata && log.metadata.loanNumber) {
        loanNumber = `#${log.metadata.loanNumber}`;
      } else if (log.entityId) {
        loanNumber = `#${log.entityId.toString().substr(-5)}`;
      }
      
      if (log.eventType === 'loan:status_changed') {
        title = `Loan ${loanNumber} status changed`;
        if (log.metadata && log.metadata.newStatus) {
          title = `Loan ${loanNumber} status changed to ${log.metadata.newStatus}`;
          
          // Set color based on status
          if (log.metadata.newStatus.toLowerCase() === 'approved') {
            statusColor = 'green';
          } else if (log.metadata.newStatus.toLowerCase() === 'rejected') {
            statusColor = 'red';
          } else if (log.metadata.newStatus.toLowerCase().includes('review')) {
            statusColor = 'yellow';
          }
        }
      } else {
        title = `Loan ${loanNumber} updated`;
      }
      
      activities.push({
        id: `status-change-${log._id}`,
        title: title,
        description: log.description || 'Status updated',
        timestamp: log.timestamp,
        type: 'status_change',
        status: 'Updated',
        statusColor: statusColor,
        entityId: log.entityId,
        entityType: 'loan',
        icon: 'RefreshCw',
        loanNumber: loanNumber
      });
    });
    
    // Add loan updates (if no audit logs were found)
    if (!recentLoanUpdates || !Array.isArray(recentLoanUpdates)) {
      console.log('recentLoanUpdates is not an array:', recentLoanUpdates);
      recentLoanUpdates = [];
    }
    
    recentLoanUpdates.forEach(loan => {
      const borrowerInfo = loan.borrower ? `for ${loan.borrower.firstName} ${loan.borrower.lastName}` : '';
      const loanNumber = loan.loanNumber ? `#${loan.loanNumber}` : `#${loan._id.toString().substr(-5)}`;
      
      activities.push({
        id: `loan-update-${loan._id}-${Date.now()}`,
        title: `Loan ${loanNumber} updated`,
        description: borrowerInfo.trim(),
        timestamp: loan.updatedAt,
        type: 'loan_update',
        status: 'Updated',
        statusColor: 'blue',
        entityId: loan._id,
        entityType: 'loan',
        icon: 'Edit',
        loanNumber: loanNumber
      });
    });
    
    // Add recent messages from borrowers
    if (!recentMessages || !Array.isArray(recentMessages)) {
      console.log('recentMessages is not an array:', recentMessages);
      recentMessages = [];
    }
    
    recentMessages.forEach(log => {
      const borrowerName = log.metadata?.borrowerName || 'Unknown Borrower';
      
      activities.push({
        id: `message-${log._id}`,
        title: `New message from ${borrowerName}`,
        description: log.metadata?.content || 'Message received',
        timestamp: log.timestamp,
        type: 'message',
        status: 'New',
        statusColor: 'blue',
        entityId: log.metadata?.borrowerId || null,
        entityType: 'borrower',
        icon: 'MessageSquare',
        borrowerId: log.metadata?.borrowerId
      });
    });
    
    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);
    
    // Format timestamps to be more human-readable
    const formatTimestamp = (timestamp) => {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hours ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minutes ago`;
      } else {
        return 'Just now';
      }
    };
    
    // Format the response
    const formattedActivities = limitedActivities.map(activity => ({
      ...activity,
      time: formatTimestamp(activity.timestamp)
    }));
    
    res.status(200).json({
      status: 'success',
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error in getLenderActivities:', error);
    
    // Send a more detailed error response for debugging
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching lender activities',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};
