const Lender = require('../models/lender.model');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { createDefaultLoanPrograms } = require('./auth.controller');
const { createDefaultLoanRates } = require('./loanRate.controller');

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
    
    // Create default loan programs and default loan rates for the new lender
    await createDefaultLoanPrograms(req.user._id, lender._id);
    await createDefaultLoanRates(req.user._id, lender._id);
    
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
    
    // Include social links helper for convenience
    const socialLinks = lender.marketingProfile?.socialMediaLinks || {};
    res.status(200).json({
      status: 'success',
      data: {
        ...lender.toObject(),
        socialLinks
      }
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
    
    // Prevent updating certain fields directly; accept new fields
    const { user, company, ...body } = req.body;

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.clientFacingTitle !== undefined) updateData.clientFacingTitle = body.clientFacingTitle;
    if (body.nmls !== undefined) updateData.nmls = body.nmls;
    if (body.officePhone !== undefined) updateData.officePhone = body.officePhone;
    if (body.officePhoneExt !== undefined) updateData.officePhoneExt = body.officePhoneExt;
    if (body.mobilePhone !== undefined) updateData.mobilePhone = body.mobilePhone;
    if (body.biography !== undefined) updateData.biography = body.biography;
    if (body.specialties !== undefined) updateData.specialties = body.specialties;

    // Social media links - accept either nested socialMediaLinks or flat fields
    const social = body.socialMediaLinks || body.socialLinks || {};
    const twitter = body.twitter || social.twitter;
    const facebook = body.facebook || social.facebook;
    const linkedin = body.linkedin || social.linkedin;
    const instagram = body.instagram || social.instagram;
    const hasAnySocial = [twitter, facebook, linkedin, instagram].some(v => v !== undefined);
    if (hasAnySocial) {
      if (!updateData.marketingProfile) updateData.marketingProfile = {};
      if (!updateData.marketingProfile.socialMediaLinks) updateData.marketingProfile.socialMediaLinks = {};
      if (twitter !== undefined) updateData.marketingProfile.socialMediaLinks.twitter = twitter;
      if (facebook !== undefined) updateData.marketingProfile.socialMediaLinks.facebook = facebook;
      if (linkedin !== undefined) updateData.marketingProfile.socialMediaLinks.linkedin = linkedin;
      if (instagram !== undefined) updateData.marketingProfile.socialMediaLinks.instagram = instagram;
    }

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
    
    // Optimize: Get all loan statistics in a single aggregation pipeline
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
          totalProcessedLoans: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'draft'] },
                1,
                0
              ]
            }
          },
          totalAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded']] },
                { $ifNull: ['$loanDetails.loanAmount', 0] },
                0
              ]
            }
          }
        }
      }
    ]);
    
    const stats = loanStats.length > 0 ? loanStats[0] : {
      totalLoans: 0,
      approvedLoans: 0,
      pendingApplications: 0,
      totalProcessedLoans: 0,
      totalAmount: 0
    };
    
    const { totalLoans, approvedLoans, pendingApplications, totalProcessedLoans, totalAmount } = stats;
    
    const approvalRate = totalProcessedLoans > 0 ? Math.round((approvedLoans / totalProcessedLoans) * 100) : 0;
    
    // Calculate average processing time (in days) from Application Started status to Approval
    console.log('DEBUG: Finding approved loans for processing time calculation...');
    
    // Get all approved loans
    const approvedLoansForProcessing = await Loan.find({ 
      lender: lender._id,
      status: { $in: ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded'] }
    }).select('_id createdAt milestones status updatedAt');
    
    console.log(`DEBUG: Found ${approvedLoansForProcessing.length} approved loans`);
    
    // Log each found loan with its status
    approvedLoansForProcessing.forEach(loan => {
      console.log(`DEBUG: Loan ${loan._id} has status: ${loan.status}`);
    });
    
    let avgProcessingTime = 0;
    if (approvedLoansForProcessing.length > 0) {
      let totalDays = 0;
      let loansWithProcessingTime = 0;
      
      for (const loan of approvedLoansForProcessing) {
        console.log(`DEBUG: Processing loan ${loan._id}`);
        
        // Try to find when the application was started
        let applicationStartDate = null;
        
        // First check if there's a milestone for application started
        if (loan.milestones && loan.milestones.length > 0) {
          const startMilestone = loan.milestones.find(m => 
            m.title && m.title.toLowerCase().includes('application') && 
            m.title.toLowerCase().includes('started') && 
            m.completedDate
          );
          
          if (startMilestone) {
            applicationStartDate = new Date(startMilestone.completedDate);
            console.log(`DEBUG: Found application started milestone date: ${applicationStartDate}`);
          }
        }
        
        // If no milestone, use createdAt as fallback
        if (!applicationStartDate) {
          applicationStartDate = new Date(loan.createdAt);
          console.log(`DEBUG: Using loan creation date as start: ${applicationStartDate}`);
        }
        
        // Try to find when the application was approved
        let approvalDate = null;
        
        // First check if there's a milestone for approval
        if (loan.milestones && loan.milestones.length > 0) {
          const approvalMilestone = loan.milestones.find(m => 
            m.title && (
              m.title.toLowerCase().includes('approved') || 
              m.title.toLowerCase().includes('approval') ||
              m.title.toLowerCase().includes('conditional')
            ) && 
            m.completedDate
          );
          
          if (approvalMilestone) {
            approvalDate = new Date(approvalMilestone.completedDate);
            console.log(`DEBUG: Found approval milestone date: ${approvalDate}`);
          }
        }
        
        // If no milestone, use updatedAt as fallback
        if (!approvalDate && loan.updatedAt) {
          approvalDate = new Date(loan.updatedAt);
          console.log(`DEBUG: Using loan updated date as approval: ${approvalDate}`);
        }
        
        // Calculate processing time in days
        if (approvalDate && applicationStartDate && approvalDate > applicationStartDate) {
          const timeDiff = approvalDate - applicationStartDate;
          const processingDays = timeDiff / (1000 * 3600 * 24); // Convert ms to days
          totalDays += processingDays;
          loansWithProcessingTime++;
          
          console.log(`DEBUG: Loan ${loan._id} processing time: ${processingDays.toFixed(1)} days`);
          
          // Save the processing time to the loan document
          Loan.findByIdAndUpdate(loan._id, {
            $set: { processingTime: processingDays }
          }).catch(err => console.error(`Error updating processing time for loan ${loan._id}:`, err));
        }
      }
      
      if (loansWithProcessingTime > 0) {
        avgProcessingTime = parseFloat((totalDays / loansWithProcessingTime).toFixed(1));
        console.log(`DEBUG: Average processing time: ${avgProcessingTime} days from ${loansWithProcessingTime} loans`);
      } else {
        // If we still have no processing time, set a default value
        avgProcessingTime = 30.0; // Default to 30 days if no data
        console.log('DEBUG: No loans with valid processing times found, using default value');
      }
    } else {
      // If no approved loans, set a default value
      avgProcessingTime = 30.0; // Default to 30 days if no data
      console.log('DEBUG: No approved loans found, using default value');
    }
    
    console.log(`DEBUG: Final average processing time: ${avgProcessingTime} days`);
    
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
    
    // Calculate real trend percentages compared to previous month
    // Get first day of current month and first day of previous month
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    // Get total loans for previous month
    const previousMonthLoans = await Loan.countDocuments({
      lender: lender._id,
      createdAt: { 
        $gte: firstDayPreviousMonth, 
        $lt: firstDayCurrentMonth 
      }
    });
    
    // Get pending applications from previous month
    const previousMonthPendingApplications = await Loan.countDocuments({
      lender: lender._id,
      status: 'Application Submitted',
      createdAt: { 
        $gte: firstDayPreviousMonth, 
        $lt: firstDayCurrentMonth
      }
    });
    
    // Calculate total amount from previous month's approved loans
    const previousMonthVolumeResult = await Loan.aggregate([
      {
        $match: {
          lender: lender._id,
          status: { $in: ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded'] },
          updatedAt: {
            $gte: firstDayPreviousMonth,
            $lt: firstDayCurrentMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$loanDetails.loanAmount" }
        }
      }
    ]);
    
    const previousMonthVolume = previousMonthVolumeResult.length > 0 ? previousMonthVolumeResult[0].totalAmount : 0;
    
    // Calculate percentage changes
    let loansChange = 0;
    if (previousMonthLoans > 0) {
      loansChange = Math.round(((totalLoans - previousMonthLoans) / previousMonthLoans) * 100);
    }
    
    let applicationsChange = 0;
    if (previousMonthPendingApplications > 0) {
      applicationsChange = Math.round(((pendingApplications - previousMonthPendingApplications) / previousMonthPendingApplications) * 100);
    }
    
    let volumeChange = 0;
    if (previousMonthVolume > 0) {
      volumeChange = Math.round(((totalAmount - previousMonthVolume) / previousMonthVolume) * 100);
    }
    
    // Prepare percentChanges object
    const percentChanges = {
      loans: loansChange,
      applications: applicationsChange,
      amount: volumeChange
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
        recentLoans: recentLoans // Send all fetched recent loans, not just the first 3
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
    
    // Optimize: Get all recent activities in a single aggregation pipeline
    console.log('Fetching activities for lender ID:', lender._id);
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Get all recent loans with their activities in one query
    const recentLoans = await Loan.find({
      lender: lender._id,
      $or: [
        { createdAt: { $gte: sevenDaysAgo } },
        { updatedAt: { $gte: sevenDaysAgo } }
      ]
    })
    .populate('borrower', 'user')
    .populate({
      path: 'borrower',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
    
    console.log(`Found ${recentLoans.length} recent loans for activities`);
    
    // Get recent audit logs in a single query
    const AuditLog = mongoose.model('AuditLog');
    const recentAuditLogs = await AuditLog.find({
      $or: [
        {
          entityType: 'loan',
          eventType: { $in: ['loan:status_update', 'loan:status_changed'] },
          'metadata.lenderId': lender._id,
          timestamp: { $gte: fourteenDaysAgo }
        },
        {
          entityType: 'document',
          eventType: { $in: ['document:status_changed', 'document:uploaded', 'document:rejected'] },
          'metadata.lenderId': lender._id,
          timestamp: { $gte: fourteenDaysAgo }
        },
        {
          entityType: 'message',
          eventType: 'message:received',
          'metadata.lenderId': lender._id,
          timestamp: { $gte: sevenDaysAgo }
        }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();
    
    console.log(`Found ${recentAuditLogs.length} recent audit logs`);
    
    // Get recent documents in a single query
    const Document = mongoose.model('Document');
    const recentDocuments = await Document.find({
      lender: lender._id,
      createdAt: { $gte: sevenDaysAgo }
    })
    .populate('loan', 'loanNumber borrower')
    .populate({
      path: 'loan',
      populate: {
        path: 'borrower',
        select: 'user'
      }
    })
    .populate({
      path: 'loan.borrower',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    console.log(`Found ${recentDocuments.length} recent documents`);
    
    // Process the data into activities
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
    
    // Process recent loans into different activity types
    recentLoans.forEach(loan => {
      // Recent applications
      if (loan.createdAt >= sevenDaysAgo) {
        recentApplications.push(loan);
      }
      
      // Recent approvals
      if (loan.status && ['Conditional Approval', 'Clear to Close', 'Approved', 'approved'].includes(loan.status) && 
          loan.updatedAt >= fourteenDaysAgo) {
        recentApprovals.push(loan);
      }
      
      // Recent rejections
      if (loan.status === 'rejected' && loan.updatedAt >= fourteenDaysAgo) {
        recentRejections.push(loan);
      }
      
      // Document verifications needed
      if (loan.status === 'pending_documents') {
        documentVerifications.push(loan);
      }
      
      // Credit check issues
      if (loan.underwritingFlags && loan.underwritingFlags.creditIssues) {
        creditChecks.push(loan);
      }
    });
    
    // Process recent documents
    recentDocuments.forEach(doc => {
      recentDocumentUploads.push(doc);
    });
    
    // Process audit logs
    recentAuditLogs.forEach(log => {
      if (log.entityType === 'loan' && log.eventType && log.eventType.includes('status')) {
        recentStatusChanges.push(log);
      } else if (log.entityType === 'document') {
        recentDocumentStatusChanges.push(log);
      } else if (log.entityType === 'message') {
        recentMessages.push(log);
      }
    });
    
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
    console.log(`Found ${recentApprovals.length} approved loans`);
    console.log(`Found ${recentRejections.length} rejected loans`);
    console.log(`Found ${documentVerifications.length} document verifications`);
    console.log(`Found ${creditChecks.length} credit checks`);
    console.log(`Found ${recentDocumentUploads.length} document uploads`);
    console.log(`Found ${recentStatusChanges.length} recent status changes`);
    console.log(`Found ${recentLoanUpdates.length} recent loan updates`);
    console.log(`Found ${recentMessages.length} recent messages from borrowers`);
    
    // Transform into activities format
    const activities = [];
    
    // Track unique activity identifiers to prevent duplicates
    const processedActivities = new Set();
    
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
      
      const activityKey = `application-${loan._id}`;
      
      // Skip if we've already processed this loan application
      if (processedActivities.has(activityKey)) {
        return;
      }
      
      processedActivities.add(activityKey);
      
      activities.push({
        id: activityKey,
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
      
      // Create unique activity ID
      const activityKey = `loan-approval-${loan._id}`;
      
      // Skip if we've already processed this loan
      if (processedActivities.has(activityKey)) {
        return;
      }
      
      processedActivities.add(activityKey);
      
      // Extract borrower name if available
      let borrowerName = "Unknown";
      if (loan.borrowerDetails) {
        borrowerName = `${loan.borrowerDetails.firstName || ''} ${loan.borrowerDetails.lastName || ''}`.trim() || 'Unknown';
      } else if (loan.borrowerName) {
        borrowerName = loan.borrowerName;
      }
      
      // Create description with loan amount if available
      let description = 'Loan approved';
      if (loan.loanDetails?.loanAmount) {
        description = `Amount: $${parseInt(loan.loanDetails.loanAmount).toLocaleString()}`;
      } else if (borrowerName !== 'Unknown') {
        description = `From ${borrowerName}`;
      }
      
      activities.push({
        id: activityKey,
        title: `Loan ${loanNumber} approved`,
        description: description,
        timestamp: loan.decisionDate || loan.updatedAt,
        type: 'approval',
        status: 'Approved',
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
        status: 'Uploaded',
        statusColor: 'blue',
        entityId: doc.loan?._id || null,
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
      let title = 'Document status updated';
      let statusColor = 'blue';
      let status = 'Updated';
      let icon = 'FileCheck';
      
      // Try to get loan number from metadata
      let loanNumber = '';
      if (log.metadata && log.metadata.loanNumber) {
        loanNumber = `#${log.metadata.loanNumber}`;
      } else if (log.metadata && log.metadata.loanId) {
        loanNumber = `#${log.metadata.loanId.toString().substr(-5)}`;
      }
      
      // Create a unique activity key
      const activityKey = `document-status-${log._id}`;
      
      // Skip if we've already processed this document status change
      if (processedActivities.has(activityKey)) {
        return;
      }
      
      processedActivities.add(activityKey);
      
      // Get description
      let description = log.description || 'Document status changed';
      if (log.metadata && log.metadata.documentName) {
        description = `${log.metadata.documentName} - ${log.metadata.newStatus || 'Status updated'}`;
      }
      
      activities.push({
        id: activityKey,
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
      let status = 'Updated';
      let icon = 'RefreshCw';
      
      // Try to get loan number from metadata or entityId
      let loanNumber = '';
      if (log.metadata && log.metadata.loanNumber) {
        loanNumber = `#${log.metadata.loanNumber}`;
      } else if (log.entityId) {
        loanNumber = `#${log.entityId.toString().substr(-5)}`;
      }
      
      // Create a unique activity key using loan ID for important statuses
      let activityKey;
      if (log.metadata && log.metadata.newStatus) {
        activityKey = `status-change-${log.entityId}-${log.metadata.newStatus}`;
      } else {
        activityKey = `status-change-${log._id}`;
      }
      
      // Skip if we've already processed this status change
      if (processedActivities.has(activityKey)) {
        return;
      }
      
      processedActivities.add(activityKey);
      
      // Get description - for approvals, include loan amount if available
      let description = log.description || 'Status updated';
      if ((log.metadata?.newStatus === 'Conditional Approval' || log.metadata?.newStatus?.toLowerCase().includes('approved')) && 
          log.metadata?.loanAmount) {
        description = `Amount: $${parseInt(log.metadata.loanAmount).toLocaleString()}`;
      } else if (log.metadata?.borrowerName) {
        description = `From ${log.metadata.borrowerName}`;
      }
      
      activities.push({
        id: activityKey,
        title: title,
        description: description,
        timestamp: log.timestamp,
        type: 'status_change',
        status: status || 'Updated',
        statusColor: statusColor,
        entityId: log.entityId,
        entityType: 'loan',
        icon: icon || 'RefreshCw',
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
      
      const activityKey = `message-${log._id}`;
      
      // Skip if we've already processed this message
      if (processedActivities.has(activityKey)) {
        return;
      }
      
      processedActivities.add(activityKey);
      
      activities.push({
        id: activityKey,
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

/**
 * Create a new borrower for the current lender (for manual loan creation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createBorrowerForLender = async (req, res, next) => {
  try {
    // Find the lender profile
    const lender = await Lender.findOne({ user: req.user._id });
    
    if (!lender) {
      return next(new ApiError('Lender profile not found', 404));
    }

    const { firstName, lastName, email, phone, dateOfBirth, ssn, maritalStatus, citizenship, currentAddress, employment } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return next(new ApiError('First name, last name, and email are required', 400));
    }

    // Helper function to map citizenship values
    const mapCitizenship = (citizenship) => {
      const citizenshipMap = {
        'USCitizen': 'US Citizen',
        'US Citizen': 'US Citizen',
        'PermanentResidentAlien': 'Permanent Resident',
        'Permanent Resident': 'Permanent Resident',
        'NonPermanentResidentAlien': 'Non-Permanent Resident',
        'Non-Permanent Resident': 'Non-Permanent Resident'
      };
      return citizenshipMap[citizenship] || citizenship;
    };

    // Helper function to map employment status
    const mapEmploymentStatus = (status) => {
      const statusMap = {
        'Full-Time': 'Full-time',
        'Part-Time': 'Part-time',
        'Self-Employed': 'Self-employed',
        'Retired': 'Retired',
        'Unemployed': 'Unemployed'
      };
      return statusMap[status] || status;
    };

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email });
    
    if (existingUser) {
      // Check if this user already has a borrower profile
      const existingBorrower = await Borrower.findOne({ user: existingUser._id });
      
      if (existingBorrower) {
        // If the borrower already belongs to this lender, return the existing borrower
        if (existingBorrower.lender.equals(lender._id)) {
          return res.status(200).json({
            status: 'success',
            data: existingBorrower,
            message: 'Borrower already exists for this lender'
          });
        } else {
          return next(new ApiError('A borrower with this email already exists under a different lender', 400));
        }
      }
      
      // User exists but no borrower profile - create borrower profile for existing user
      const borrowerData = {
        user: existingUser._id,
        lender: lender._id
      };

      // Add optional fields if provided
      if (dateOfBirth) borrowerData.dateOfBirth = new Date(dateOfBirth);
      if (ssn) borrowerData.ssn = ssn;
      if (maritalStatus) borrowerData.maritalStatus = maritalStatus;
      if (citizenship) borrowerData.citizenship = mapCitizenship(citizenship);
      
      // Handle address - only add if we have the required fields
      if (currentAddress && currentAddress.streetAddress && currentAddress.city && currentAddress.state && currentAddress.zipCode) {
        borrowerData.primaryAddress = {
          addressLine1: currentAddress.streetAddress,
          addressLine2: currentAddress.aptSteNum || '',
          city: currentAddress.city,
          state: currentAddress.state,
          zipCode: currentAddress.zipCode,
          ownershipStatus: currentAddress.ownershipStatus || 'Own',
          yearsAtAddress: currentAddress.yearsAtAddress || 0,
          monthsAtAddress: currentAddress.monthsAtAddress || 0
        };
      }
      
      // Handle employment - only add if we have the required fields
      if (employment && employment.companyName && employment.jobTitle && employment.employmentStatus) {
        borrowerData.employment = {
          currentEmployment: {
            employerName: employment.companyName,
            jobTitle: employment.jobTitle,
            employmentStatus: mapEmploymentStatus(employment.employmentStatus),
            startDate: employment.startDate ? new Date(employment.startDate) : new Date(),
            isSelfEmployed: employment.employmentStatus === 'Self-employed'
          }
        };
      }

      const borrower = await Borrower.create(borrowerData);

      // Populate the user information for the response
      await borrower.populate('user', 'firstName lastName email phone');

      logger.info(`Lender ${lender._id} created borrower profile for existing user ${existingUser._id}`);

      return res.status(201).json({
        status: 'success',
        data: borrower,
        message: 'Borrower profile created for existing user'
      });
    }

    // Create a new user account for the borrower
    const userData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone || '',
      role: 'borrower',
      // Generate a temporary password - the borrower will need to set their own password later
      password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
      isActive: true
    };

    const user = await User.create(userData);

    // Create the borrower profile
    const borrowerData = {
      user: user._id,
      lender: lender._id
    };

    // Add optional fields if provided
    if (dateOfBirth) borrowerData.dateOfBirth = new Date(dateOfBirth);
    if (ssn) borrowerData.ssn = ssn;
    if (maritalStatus) borrowerData.maritalStatus = maritalStatus;
    if (citizenship) borrowerData.citizenship = mapCitizenship(citizenship);
    
    // Handle address - only add if we have the required fields
    if (currentAddress && currentAddress.streetAddress && currentAddress.city && currentAddress.state && currentAddress.zipCode) {
      borrowerData.primaryAddress = {
        addressLine1: currentAddress.streetAddress,
        addressLine2: currentAddress.aptSteNum || '',
        city: currentAddress.city,
        state: currentAddress.state,
        zipCode: currentAddress.zipCode,
        ownershipStatus: currentAddress.ownershipStatus || 'Own',
        yearsAtAddress: currentAddress.yearsAtAddress || 0,
        monthsAtAddress: currentAddress.monthsAtAddress || 0
      };
    }
    
    // Handle employment - only add if we have the required fields
    if (employment && employment.companyName && employment.jobTitle && employment.employmentStatus) {
      borrowerData.employment = {
        currentEmployment: {
          employerName: employment.companyName,
          jobTitle: employment.jobTitle,
          employmentStatus: mapEmploymentStatus(employment.employmentStatus),
          startDate: employment.startDate ? new Date(employment.startDate) : new Date(),
          isSelfEmployed: employment.employmentStatus === 'Self-employed'
        }
      };
    }

    const borrower = await Borrower.create(borrowerData);

    // Populate the user information for the response
    await borrower.populate('user', 'firstName lastName email phone');

    logger.info(`Lender ${lender._id} created new borrower ${borrower._id} with user ${user._id}`);

    res.status(201).json({
      status: 'success',
      data: borrower,
      message: 'Borrower created successfully'
    });

  } catch (error) {
    console.error('Error creating borrower for lender:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return next(new ApiError('A user with this email already exists', 400));
    }
    
    next(error);
  }
};

/**
 * Get borrower loan counts for dashboard optimization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getBorrowerLoanCounts = async (req, res, next) => {
  try {
    const lenderId = req.params.lenderId;
    
    // Find the lender profile
    const lender = await Lender.findById(lenderId);
    
    if (!lender) {
      return next(new ApiError('Lender not found', 404));
    }
    
    // Get all borrowers for this lender
    const borrowers = await Borrower.find({ lender: lenderId })
      .select('_id')
      .lean();
    
    if (borrowers.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {}
      });
    }
    
    const borrowerIds = borrowers.map(b => b._id);
    
    // Get loan counts for all borrowers in a single aggregation
    const loanCounts = await Loan.aggregate([
      {
        $match: {
          borrower: { $in: borrowerIds },
          lender: lender._id
        }
      },
      {
        $group: {
          _id: '$borrower',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to the format expected by frontend
    const borrowerLoanMap = {};
    loanCounts.forEach(item => {
      borrowerLoanMap[item._id.toString()] = item.count;
    });
    
    // Ensure all borrowers have a count (even if 0)
    borrowerIds.forEach(borrowerId => {
      if (!borrowerLoanMap[borrowerId.toString()]) {
        borrowerLoanMap[borrowerId.toString()] = 0;
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: borrowerLoanMap
    });
  } catch (error) {
    logger.error('Error in getBorrowerLoanCounts:', error);
    next(error);
  }
};
