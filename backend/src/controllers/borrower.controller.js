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
    
    // Query filter for current borrower
    const borrowerFilter = { borrower: borrower._id };
    
    // Total loans (excluding drafts)
    const totalLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $ne: 'draft' }
    });
    
    // Active loans with proper statuses
    const activeLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Approved', 'Conditional Approval', 'Funded', 'Closed', 'Clear to Close'] }
    });
    
    // Pending applications with appropriate statuses
    const pendingApplications = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Application Submitted', 'Processing', 'Underwriting', 'Pre-Qualification', 'Application Started', 'Pending'] }
    });
    
    // Calculate total borrowed amount
    const borrowedAmountResult = await Loan.aggregate([
      { 
        $match: { 
          ...borrowerFilter,
          status: { $in: ['Approved', 'Conditional Approval', 'Funded', 'Closed', 'Clear to Close'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$loanDetails.loanAmount', 0] } }
        }
      }
    ]);
    
    const totalAmount = borrowedAmountResult[0]?.totalAmount || 0;

    // Get recent loans for the borrower
    const recentLoans = await Loan.find(borrowerFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .populate([
        { path: 'lender', select: 'name companyName email' },
        { path: 'assignedLoanOfficer', select: 'firstName lastName email' }
      ]);

    // Calculate percentage changes (mock data for now, could be implemented with historical data)
    const percentChanges = {
      loans: 0,
      applications: 0,
      amount: 0
    };
    
    // Prepare dashboard data
    const dashboardData = {
      totalLoans,
        activeLoans,
      pendingApplications,
      totalAmount,
      percentChanges,
      recentLoans,
      profileCompletion: {
        personalInfo: borrower.user ? 100 : 0,
        financialInfo: borrower.financialInfo ? 100 : 0,
        employmentInfo: borrower.employment ? 100 : 0,
        documents: 0 // This would need to be calculated based on required documents
      }
    };
    
    // Get upcoming payments (mock data for now)
    const paymentSummary = {
      totalPaid: 0,
      upcomingPayment: 0,
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
    
    // Add payment summary to dashboard data
    dashboardData.paymentSummary = paymentSummary;
    
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
    const processedActivities = new Set(); // Track processed activities to avoid duplicates
    const processedMessageContents = new Set(); // Track message contents to avoid duplicates
    
    // Mongoose model references
    const AuditLog = require('../models/auditLog.model');
    const Document = require('../models/document.model');
    const Message = require('../models/message.model');
    const Milestone = require('../models/milestone.model');
    
    // 1. Recent document status changes (approved, rejected, needs correction)
    let documentStatusChanges = [];
    
    try {
      // More comprehensive query to catch all document status changes
      documentStatusChanges = await AuditLog.find({
        $or: [
          {
            entityType: 'document',
            eventType: { $in: ['document:approved', 'document:rejected', 'document:need_correction', 'document:status-changed'] },
            'metadata.borrowerId': borrower._id
          },
          {
            entityType: 'document',
            eventType: 'document:status-changed',
            'metadata.borrowerId': borrower._id
          }
        ],
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
      
      // Make a set of loan IDs for quick checking if a loan exists
      const loanIdSet = new Set(loans.map(loan => loan._id.toString()));
      const loanNumberSet = new Set(loans.map(loan => loan.loanNumber).filter(Boolean));
      
      documentStatusChanges.forEach(log => {
        if (!log.metadata) return;
        
        const { documentId, documentName, loanId, loanNumber, oldStatus, newStatus } = log.metadata;
        if (!documentId && !documentName) return;
        
        // Check if this refers to an actual loan the borrower has
        const loanExists = (loanId && loanIdSet.has(loanId.toString())) || 
                          (loanNumber && loanNumberSet.has(loanNumber));
        
        // Skip notifications for loans that don't exist
        if (loanId && !loanExists && loans.length > 0) {
          console.log(`Skipping document status notification - loan not found: ${loanId}`);
          return;
        }
        
        // Determine the new status
        let statusValue = '';
        if (log.eventType === 'document:approved') statusValue = 'approved';
        else if (log.eventType === 'document:rejected') statusValue = 'rejected';
        else if (log.eventType === 'document:need_correction') statusValue = 'needs_correction';
        else if (log.eventType === 'document:status-changed' && newStatus) statusValue = newStatus.toLowerCase();
        else return;
        
        let statusText = '';
        let statusColor = '';
        let icon = '';
        
        switch(statusValue) {
          case 'approved':
            statusText = 'Approved';
            statusColor = 'green';
            icon = 'CheckCircle';
            break;
          case 'rejected':
            statusText = 'Rejected';
            statusColor = 'red';
            icon = 'XCircle';
            break;
          case 'needs_correction':
          case 'correction':
            statusText = 'Correction';
            statusColor = 'yellow';
            icon = 'FilePen';
            break;
          default:
            statusText = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
            statusColor = 'blue';
            icon = 'FileText';
            break;
        }
        
        const activityKey = `doc-status-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Find the related loan for more context
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        // Prepare loanNumber display
        let loanNumberDisplay = '';
        if (loanNumber) {
          loanNumberDisplay = loanNumber;
        } else if (relatedLoan) {
          loanNumberDisplay = relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5);
        }
        
        activities.push({
          id: activityKey,
          title: `Document ${statusText}`,
          description: `${documentName || 'Document'} ${loanNumberDisplay ? `for loan #${loanNumberDisplay}` : ''}`,
          timestamp: log.timestamp,
          type: 'document_status',
          status: statusText,
          statusColor,
          entityId: documentId,
          entityType: 'document',
          icon,
          loanNumber: loanNumberDisplay ? `#${loanNumberDisplay}` : '',
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/documents`
        });
      });
      
      // Also check the document model for recent status changes
      const recentDocumentStatusChanges = await Document.find({
        borrower: borrower._id,
        status: { $in: ['approved', 'rejected', 'correction_required'] },
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .populate('loan', 'loanNumber')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
      
      recentDocumentStatusChanges.forEach(doc => {
        // Skip if we don't have enough information
        if (!doc.status) return;
        
        const activityKey = `doc-status-model-${doc._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Determine status styling based on document status
        let statusText = '';
        let statusColor = '';
        let icon = '';
        
        switch(doc.status.toLowerCase()) {
          case 'approved':
            statusText = 'Approved';
            statusColor = 'green';
            icon = 'CheckCircle';
            break;
          case 'rejected':
            statusText = 'Rejected';
            statusColor = 'red';
            icon = 'XCircle';
            break;
          case 'correction_required':
            statusText = 'Correction';
            statusColor = 'yellow';
            icon = 'FilePen';
            break;
          default:
            statusText = doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
            statusColor = 'blue';
            icon = 'FileText';
            break;
        }
        
        // Format loan number if available
        let loanNumberDisplay = '';
        if (doc.loan) {
          loanNumberDisplay = doc.loan.loanNumber || doc.loan._id.toString().substr(-5);
        }
        
        activities.push({
          id: activityKey,
          title: `Document ${statusText}`,
          description: `${doc.documentType || 'Document'} ${loanNumberDisplay ? `for loan #${loanNumberDisplay}` : ''}`,
          timestamp: doc.updatedAt,
          type: 'document_status',
          status: statusText,
          statusColor,
          entityId: doc._id,
          entityType: 'document',
          icon,
          loanNumber: loanNumberDisplay ? `#${loanNumberDisplay}` : '',
          time: new Date(doc.updatedAt).toLocaleString(),
          url: `/borrower/documents`
        });
      });
    } catch (err) {
      console.error('Error fetching document status changes:', err);
    }
    
    // 2. Recent messages from lenders
    let recentMessages = [];
    
    try {
      // Get messages directly from the Message model
      recentMessages = await Message.find({
        $or: [
          { receiver: borrower._id, receiverType: 'borrower' },
          { 
            receiverType: 'loan',
            receiver: { $in: loanIds }
          }
        ]
      })
      .populate('sender', 'firstName lastName companyName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
      
      // Process recent messages
      recentMessages.forEach(message => {
        // Skip system messages
        if (!message.sender || message.sender.role === 'system') return;
        
        // Extract sender info
        let senderName = 'Lender';
        if (message.sender) {
          if (message.sender.companyName) {
            senderName = message.sender.companyName;
          } else if (message.sender.firstName) {
            senderName = `${message.sender.firstName} ${message.sender.lastName || ''}`;
          }
        }
        
        // Create a preview of the message content
        const contentPreview = message.content ? message.content.substring(0, 40) + (message.content.length > 40 ? '...' : '') : '';
      
        // Generate a unique content key to avoid duplicate message notifications
        const contentKey = `${message.sender?._id}-${contentPreview}`;
        
        // Skip if we already have a notification for this exact message content
        if (processedMessageContents.has(contentKey)) return;
        processedMessageContents.add(contentKey);
        
        const activityKey = `message-${message._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Add the message activity
        activities.push({
          id: activityKey,
          title: `New message from ${senderName}`,
          description: contentPreview || 'New message received',
          timestamp: message.createdAt,
          type: 'message',
          status: 'New',
          statusColor: 'blue',
          entityId: message._id,
          entityType: 'message',
          icon: 'MessageSquare',
          time: new Date(message.createdAt).toLocaleString(),
          url: '/borrower/messages'
        });
      });
    } catch (err) {
      console.error('Error fetching lender messages:', err);
    }
    
    // 3. Document requests
    try {
      // Also check for document requests in loan conditions
      const documentConditions = await AuditLog.find({
        entityType: 'condition',
        eventType: 'condition:created',
        'metadata.type': 'document',
        'metadata.borrowerId': borrower._id,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
      
      // Process document conditions
      documentConditions.forEach(log => {
        if (!log.metadata) return;
        
        const { title, description, loanId, loanNumber } = log.metadata;
        if (!title) return;
        
        const activityKey = `doc-condition-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Find the related loan
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        if (!relatedLoan) return;
        
        // Add the document request activity
        activities.push({
          id: activityKey,
          title: `Document Requested`,
          description: `${title} for loan #${relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5)}`,
          timestamp: log.timestamp,
          type: 'document_request',
          status: 'Pending',
          statusColor: 'blue',
          entityId: loanId,
          entityType: 'document',
          icon: 'FileText',
          loanNumber: `#${relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5)}`,
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/documents`
        });
      });
      
      // Check for document requests in audit logs - this catches the most recent ones
      const documentRequestLogs = await AuditLog.find({
        $or: [
          { 
            entityType: 'document', 
            eventType: 'document:requested', 
            'metadata.borrowerId': borrower._id 
          },
          {
            entityType: 'condition',
            eventType: 'condition:created',
            'metadata.type': 'document',
            'metadata.borrowerId': borrower._id
          }
        ],
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
      
      // Add document requests from audit logs
      documentRequestLogs.forEach(log => {
        if (!log.metadata) return;
        
        let documentName, loanNumber, loanId;
        
        // Handle different metadata structures
        if (log.eventType === 'document:requested') {
          documentName = log.metadata.documentName;
          loanNumber = log.metadata.loanNumber;
          loanId = log.metadata.loanId;
        } else if (log.eventType === 'condition:created') {
          documentName = log.metadata.title || 'Document';
          loanNumber = log.metadata.loanNumber;
          loanId = log.metadata.loanId;
        }
        
        if ((!documentName && !log.metadata.title) || (!loanNumber && !loanId)) return;
        
        // Find the related loan for more context
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        if (!relatedLoan) return;
        
        const activityKey = `doc-req-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        const loanNumberDisplay = loanNumber || (relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5));
        
        activities.push({
          id: activityKey,
          title: `Document requested`,
          description: `${documentName || log.metadata.title} for loan #${loanNumberDisplay}`,
          timestamp: log.timestamp,
          type: 'document_request',
          status: 'Pending',
          statusColor: 'blue',
          entityId: loanId || relatedLoan._id,
          entityType: 'document',
          icon: 'FilePlus',
          loanNumber: `#${loanNumberDisplay}`,
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/documents`
        });
      });
      
      // Also check the document model for recent requests
      const recentDocumentRequests = await Document.find({
        borrower: borrower._id,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .populate('loan', 'loanNumber')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
      
      recentDocumentRequests.forEach(doc => {
        if (!doc.loan) return;
        
        const activityKey = `doc-model-${doc._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        activities.push({
          id: activityKey,
          title: `Document requested`,
          description: `${doc.documentType || 'Document'} for loan #${doc.loan.loanNumber || doc.loan._id.toString().substr(-5)}`,
          timestamp: doc.createdAt,
          type: 'document_request',
          status: 'Pending',
          statusColor: 'blue',
          entityId: doc.loan._id,
          entityType: 'document',
          icon: 'FilePlus',
          loanNumber: `#${doc.loan.loanNumber || doc.loan._id.toString().substr(-5)}`,
          time: new Date(doc.createdAt).toLocaleString(),
          url: `/borrower/documents`
        });
      });
    } catch (err) {
      console.error('Error fetching document requests:', err);
    }
    
    // 4. Milestone updates
    try {
      // Check for recent milestone completions
      const recentMilestones = await Milestone.find({
        loan: { $in: loanIds },
        status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .populate('loan', 'loanNumber')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
      
      recentMilestones.forEach(milestone => {
        const activityKey = `milestone-${milestone._id}`;
          
          // Skip if already processed
        if (processedActivities.has(activityKey)) return;
          processedActivities.add(activityKey);
        
        // Make sure we have a loan number
        const loanNumber = milestone.loan.loanNumber || 
                          (milestone.loan._id ? milestone.loan._id.toString().substr(-5) : '');
        
        // Make sure we have the milestone title
        const milestoneName = milestone.title || milestone.name || 'Loan milestone';
          
          activities.push({
            id: activityKey,
          title: `Milestone completed`,
          description: `${milestoneName} for loan #${loanNumber}`,
          timestamp: milestone.completedDate || milestone.updatedAt,
            type: 'milestone',
            status: 'Completed',
          statusColor: 'green',
          entityId: milestone.loan._id,
          entityType: 'milestone',
            icon: 'CheckCircle',
          loanNumber: `#${loanNumber}`,
          milestoneName: milestoneName,
          time: new Date(milestone.completedDate || milestone.updatedAt).toLocaleString(),
          url: `/borrower/loans/${milestone.loan._id}?tab=milestones`
        });
      });
      
      // Also check for milestone updates in audit logs
      const milestoneAuditLogs = await AuditLog.find({
        entityType: 'milestone',
        eventType: 'milestone:completed',
        'metadata.borrowerId': borrower._id,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
      
      milestoneAuditLogs.forEach(log => {
        if (!log.metadata) return;
        
        const { milestoneTitle, loanNumber, loanId } = log.metadata;
        if (!milestoneTitle || (!loanNumber && !loanId)) return;
        
        const activityKey = `milestone-audit-${log._id}`;
        
        // Skip if already processed
        if (processedActivities.has(activityKey)) return;
        processedActivities.add(activityKey);
        
        // Find the related loan
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        if (!relatedLoan) return;
        
        const loanNumberDisplay = relatedLoan.loanNumber || relatedLoan._id.toString().substr(-5);
        
        activities.push({
          id: activityKey,
          title: `Milestone completed`,
          description: `${milestoneTitle} for loan #${loanNumberDisplay}`,
          timestamp: log.timestamp,
          type: 'milestone',
          status: 'Completed',
          statusColor: 'green',
          entityId: relatedLoan._id,
          entityType: 'milestone',
          icon: 'CheckCircle',
          loanNumber: `#${loanNumberDisplay}`,
          milestoneName: milestoneTitle,
          time: new Date(log.timestamp).toLocaleString(),
          url: `/borrower/loans/${relatedLoan._id}?tab=milestones`
        });
      });
    } catch (err) {
      console.error('Error fetching milestone updates:', err);
    }
    
    // 5. Loan status changes
    try {
      const loanStatusChanges = await AuditLog.find({
        entityType: 'loan',
        eventType: 'loan:status-changed',
        'metadata.borrowerId': borrower._id,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
      
      loanStatusChanges.forEach(log => {
        if (!log.metadata) return;
        
        const { loanId, loanNumber, oldStatus, newStatus } = log.metadata;
        if (!newStatus || (!loanId && !loanNumber)) return;
        
        // Find the related loan
        const relatedLoan = loanId ? 
          loans.find(loan => loan._id.toString() === loanId.toString()) : 
          loans.find(loan => loan.loanNumber === loanNumber);
        
        if (!relatedLoan) return;
        
        let statusText = '';
        let statusColor = '';
        let icon = '';
        
        switch(newStatus.toLowerCase()) {
          case 'approved':
            statusText = 'Approved';
            statusColor = 'green';
            icon = 'CheckCircle';
            break;
          case 'rejected':
            statusText = 'Rejected';
            statusColor = 'red';
            icon = 'XCircle';
            break;
          case 'pending':
            statusText = 'Pending';
            statusColor = 'yellow';
            icon = 'Clock';
            break;
          case 'in_review':
            statusText = 'In Review';
            statusColor = 'blue';
            icon = 'FileText';
            break;
          default:
            statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            statusColor = 'blue';
            icon = 'FileText';
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
    
    // Format time strings consistently
    activities.forEach(activity => {
      if (activity.timestamp) {
        const timestamp = new Date(activity.timestamp);
        
        // Save ISO string for accurate sorting on frontend
        activity.timestamp = timestamp.toISOString();
        
        // Also provide formatted time string
        activity.time = timestamp.toLocaleString();
      }
    });
    
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
