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
    const limit = parseInt(req.query.limit) || 1000; // Default to a high number to get all loans
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Optional status filter
    
    // Build query
    const query = { 
      borrower: borrower._id,
      deleted: { $ne: true } // Ensure we don't return deleted loans
    };
    
    if (borrower.lender) {
      query.lender = borrower.lender;
    }
    
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
      .limit(limit); // Use the requested limit
    
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
    
    // Find all loans associated with this borrower
    const loans = await Loan.find({
      $or: [
        { borrower: borrower._id },
        { coBorrowers: borrower._id }
      ]
    })
    .populate('lender', 'companyName')
    .populate({
      path: 'lender',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .lean();
    
    const loanIds = loans.map(loan => loan._id);
    const activities = [];
    const processedActivities = new Set();
    
    // Mongoose model references
    const AuditLog = require('../models/auditLog.model');
    const Document = require('../models/document.model');
    const Message = require('../models/message.model');
    const Milestone = require('../models/milestone.model');
    
    // 1. Recent document status changes (approved, rejected, needs correction)
    let documentStatusChanges = [];
    try {
      // Find document status changes in audit logs
      documentStatusChanges = await AuditLog.find({
        entityType: 'document',
        'metadata.loanId': { $in: loanIds },
        eventType: { $in: ['document:status_changed', 'document:reviewed'] },
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
      
      // Process document status changes
      documentStatusChanges.forEach(log => {
        if (!log.metadata) return;
        
        const { documentName, newStatus, loanNumber, loanId } = log.metadata;
        if (!documentName || !newStatus || !loanId) return;
        
        let title, statusColor, statusText, icon;
        
        switch(newStatus.toLowerCase()) {
          case 'approved':
            title = `Document approved for loan ${loanNumber || '#' + loanId.toString().substr(-5)}`;
            statusColor = 'bg-green-500';
            statusText = 'Approved';
            icon = 'FileCheck';
            break;
          case 'rejected':
            title = `Document rejected for loan ${loanNumber || '#' + loanId.toString().substr(-5)}`;
            statusColor = 'bg-red-500';
            statusText = 'Rejected';
            icon = 'FileX';
            break;
          case 'needs_correction':
          case 'needs correction':
            title = `Document needs correction for loan ${loanNumber || '#' + loanId.toString().substr(-5)}`;
            statusColor = 'bg-yellow-500';
            statusText = 'Needs Correction';
            icon = 'FilePen';
            break;
          default:
            title = `Document status updated for loan ${loanNumber || '#' + loanId.toString().substr(-5)}`;
            statusColor = 'bg-blue-500';
            statusText = 'Updated';
            icon = 'RefreshCw';
        }
        
        const activityKey = `doc-status-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        activities.push({
          id: activityKey,
          title,
          description: `${documentName} ${newStatus === 'needs_correction' ? 'requires updates' : `marked as ${newStatus}`}`,
          timestamp: log.timestamp,
          type: 'document_status',
          status: statusText,
          statusColor,
          entityId: log.entityId,
          entityType: 'document',
          icon,
          loanNumber: loanNumber || (loanId ? '#' + loanId.toString().substr(-5) : ''),
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/documents`
        });
      });
    } catch (err) {
      console.error('Error fetching document status changes:', err);
    }
    
    // 2. Document requests from lender
    let documentRequests = [];
    try {
      const conditions = await Promise.all(loans.map(async (loan) => {
        if (!loan.conditions || !loan.conditions.length) return [];
        
        // Filter for document-related conditions assigned to this borrower
        return loan.conditions
          .filter(condition => 
            condition.type === 'document' && 
            condition.status === 'Pending' &&
            (!condition.assignedTo || condition.assignedTo.toString() === borrower._id.toString())
          )
          .map(condition => ({
            ...condition,
            loanNumber: loan.loanNumber || loan._id.toString().substr(-5),
            loanId: loan._id,
            createdAt: condition.createdAt || loan.updatedAt
          }));
      }));
      
      // Flatten the array of arrays
      documentRequests = [].concat(...conditions)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Process document requests
      documentRequests.forEach(request => {
        const activityKey = `doc-request-${request._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        activities.push({
          id: activityKey,
          title: `Document requested for loan #${request.loanNumber}`,
          description: request.title || 'Document required for your loan application',
          timestamp: request.createdAt,
          type: 'document_request',
          status: 'Required',
          statusColor: 'bg-blue-500',
          entityId: request.loanId,
          entityType: 'loan',
          icon: 'FileText',
          loanNumber: `#${request.loanNumber}`,
          time: new Date(request.createdAt).toLocaleString(),
          url: `/borrower/documents`
        });
      });
    } catch (err) {
      console.error('Error fetching document requests:', err);
    }
    
    // 3. Completed milestones
    let completedMilestones = [];
    try {
      for (const loan of loans) {
        if (!loan.milestones || !loan.milestones.length) continue;
        
        // Find recently completed milestones (last 30 days)
        const recentlyCompletedMilestones = loan.milestones
          .filter(milestone => 
            milestone.status === 'completed' && 
            milestone.completedAt && 
            new Date(milestone.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          );
        
        for (const milestone of recentlyCompletedMilestones) {
          const activityKey = `milestone-${loan._id}-${milestone._id || milestone.id}`;
          
          // Skip if already processed
          if (processedActivities.has(activityKey)) continue;
          processedActivities.add(activityKey);
          
          activities.push({
            id: activityKey,
            title: `Loan milestone completed`,
            description: `${milestone.title || 'Milestone'} for loan #${loan.loanNumber || loan._id.toString().substr(-5)}`,
            timestamp: milestone.completedAt,
            type: 'milestone',
            status: 'Completed',
            statusColor: 'bg-green-500',
            entityId: loan._id,
            entityType: 'loan',
            icon: 'CheckCircle',
            loanNumber: `#${loan.loanNumber || loan._id.toString().substr(-5)}`,
            time: new Date(milestone.completedAt).toLocaleString(),
            url: `/borrower/loans/${loan._id}`
          });
        }
      }
    } catch (err) {
      console.error('Error processing milestone completions:', err);
    }
    
    // 4. Recent messages from lenders
    let recentMessages = [];
    try {
      // Get recent messages from lenders to this borrower
      recentMessages = await AuditLog.find({
        entityType: 'message',
        eventType: 'message:received',
        'metadata.borrowerId': borrower._id,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
      
      // Process messages
      recentMessages.forEach(log => {
        if (!log.metadata) return;
        
        const { loanId, loanNumber, senderName, message } = log.metadata;
        if (!loanId && !senderName) return;
        
        const activityKey = `message-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Determine which loan this message is for
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : null;
        
        activities.push({
          id: activityKey,
          title: `New message from ${senderName || 'Lender'}`,
          description: message ? (message.length > 50 ? `${message.substring(0, 50)}...` : message) : 'You have a new message',
          timestamp: log.timestamp,
          type: 'message',
          status: 'New',
          statusColor: 'bg-blue-500',
          entityId: loanId,
          entityType: 'message',
          icon: 'MessageSquare',
          loanNumber: loanNumber || (relatedLoan ? `#${relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5)}` : ''),
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/messages`
        });
      });
    } catch (err) {
      console.error('Error fetching lender messages:', err);
    }
    
    // 5. Loan status changes
    let loanStatusChanges = [];
    try {
      // Find loan status changes in audit logs
      loanStatusChanges = await AuditLog.find({
        entityType: 'loan',
        entityId: { $in: loanIds },
        eventType: { $in: ['loan:status_changed', 'loan:status_update'] },
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
      
      // Process loan status changes
      loanStatusChanges.forEach(log => {
        if (!log.metadata) return;
        
        const { newStatus, loanNumber, loanId } = log.metadata;
        if (!newStatus || (!loanNumber && !loanId)) return;
        
        // Skip if this is for a loan we don't have
        if (loanId && !loanIds.some(id => id.toString() === loanId.toString())) return;
        
        // Find the loan this status change is for
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        if (!relatedLoan) return;
        
        let statusColor, statusText, icon;
        
        switch(newStatus.toLowerCase()) {
          case 'approved':
          case 'conditional approval':
          case 'clear to close':
            statusColor = 'bg-green-500';
            statusText = 'Approved';
            icon = 'CheckCircle';
            break;
          case 'rejected':
            statusColor = 'bg-red-500';
            statusText = 'Rejected';
            icon = 'XCircle';
            break;
          case 'pending':
          case 'in review':
          case 'in_review':
            statusColor = 'bg-blue-500';
            statusText = 'In Review';
            icon = 'Clock';
            break;
          default:
            statusColor = 'bg-gray-500';
            statusText = 'Updated';
            icon = 'RefreshCw';
        }
        
        const activityKey = `loan-status-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        activities.push({
          id: activityKey,
          title: `Loan application status changed`,
          description: `Your loan #${relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5)} status is now ${newStatus}`,
          timestamp: log.timestamp,
          type: 'loan_status',
          status: statusText,
          statusColor,
          entityId: relatedLoan._id,
          entityType: 'loan',
          icon,
          loanNumber: `#${relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5)}`,
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/loans/${relatedLoan._id}`
        });
      });
    } catch (err) {
      console.error('Error fetching loan status changes:', err);
    }
    
    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const paginatedActivities = activities.slice(0, limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        activities: paginatedActivities,
        pagination: {
          total: activities.length,
          page,
          limit,
          pages: Math.ceil(activities.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getBorrowerActivities:', error);
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

/**
 * Get loan conditions (document requests) for the borrower
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLoanConditions = async (req, res, next) => {
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
    
    // Find loans associated with this borrower (either as primary or co-borrower)
    const loans = await Loan.find({
      $or: [
        { borrower: borrower._id },
        { coBorrowers: borrower._id }
      ]
    });
    
    // Extract conditions from all loans
    const allConditions = [];
    loans.forEach(loan => {
      if (loan.conditions && loan.conditions.length > 0) {
        loan.conditions.forEach(condition => {
          // Only include conditions assigned to this user
          if (condition.assignedTo && condition.assignedTo.toString() === req.user._id.toString()) {
            allConditions.push({
              ...condition.toObject(),
              loanNumber: loan.loanNumber,
              loanId: loan._id
            });
          }
        });
      }
    });
    
    // Get document-related conditions with 'Pending' status
    const documentRequests = allConditions.filter(
      condition =>  condition.status === 'Pending'
    );
    
    res.status(200).json({
      status: 'success',
      data: documentRequests
    });
  } catch (error) {
    logger.error(`Error fetching loan conditions: ${error.message}`);
    next(error);
  }
};
