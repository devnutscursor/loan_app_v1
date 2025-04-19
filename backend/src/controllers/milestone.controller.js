const Milestone = require('../models/milestone.model');
const Loan = require('../models/loan.model');
const Document = require('../models/document.model');
const User = require('../models/user.model');
const APIError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const { createAuditLog } = require('./auditLog.controller');

/**
 * Get all milestones for a loan
 */
exports.getLoanMilestones = catchAsync(async (req, res) => {
  const { loanId } = req.params;
  const userId = req.user.id;
  
  // Check if loan exists and user has access
  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new APIError('Loan not found', 404);
  }
  
  // Check access based on user role
  if (
    req.user.role === 'borrower' && loan.borrower.toString() !== userId ||
    req.user.role === 'lender' && loan.lender.toString() !== userId
  ) {
    throw new APIError('You do not have access to this loan', 403);
  }
  
  // Get all milestones for the loan, ordered by sequence
  const milestones = await Milestone.find({ loan: loanId })
    .populate({
      path: 'completedBy',
      select: 'firstName lastName email role'
    })
    .sort({ order: 1 });
  
  // Calculate overall loan progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    milestone => milestone.status === 'completed'
  ).length;
  
  const progress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;
  
  // For each milestone, calculate its internal progress
  const milestonesWithProgress = milestones.map(milestone => {
    const milestoneProgress = milestone.calculateProgress();
    return {
      ...milestone.toObject(),
      progress: milestoneProgress
    };
  });
  
  // Log the milestone view for audit
  await createAuditLog({
    eventType: 'milestone:view',
    description: `Viewed milestones for loan ${loan.loanNumber || loanId}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    entityType: 'loan',
    entityId: loanId,
    metadata: { loanNumber: loan.loanNumber }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      milestones: milestonesWithProgress,
      overallProgress: progress,
      currentMilestone: milestones.find(m => m.status === 'current') || null
    }
  });
});

/**
 * Get a specific milestone
 */
exports.getMilestone = catchAsync(async (req, res) => {
  const { milestoneId } = req.params;
  const userId = req.user.id;
  
  // Get the milestone with populated fields
  const milestone = await Milestone.findById(milestoneId)
    .populate({
      path: 'completedBy',
      select: 'firstName lastName email role'
    })
    .populate({
      path: 'requiredDocuments.document',
      select: 'fileName fileType fileSize uploadedBy uploadedAt'
    });
  
  if (!milestone) {
    throw new APIError('Milestone not found', 404);
  }
  
  // Check access via loan
  const loan = await Loan.findById(milestone.loan);
  if (
    req.user.role === 'borrower' && loan.borrower.toString() !== userId ||
    req.user.role === 'lender' && loan.lender.toString() !== userId
  ) {
    throw new APIError('You do not have access to this milestone', 403);
  }
  
  // Calculate milestone progress
  const progress = milestone.calculateProgress();
  
  // Log the milestone view for audit
  await createAuditLog({
    eventType: 'milestone:detail_view',
    description: `Viewed milestone "${milestone.name}" details for loan ${loan.loanNumber || loan._id}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    entityType: 'milestone',
    entityId: milestoneId,
    metadata: { 
      loanId: loan._id,
      loanNumber: loan.loanNumber,
      milestoneName: milestone.name
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      ...milestone.toObject(),
      progress
    }
  });
});

/**
 * Create a new milestone
 */
exports.createMilestone = catchAsync(async (req, res) => {
  // Only lenders and admins can create milestones
  if (!['lender', 'admin'].includes(req.user.role)) {
    throw new APIError('You do not have permission to create milestones', 403);
  }
  
  const {
    loan: loanId,
    name,
    description,
    order,
    startDate,
    dueDate,
    requirements,
    requiredDocuments,
    responsibleParty
  } = req.body;
  
  // Check if loan exists
  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new APIError('Loan not found', 404);
  }
  
  // Only the assigned lender or admin can create milestones
  if (
    req.user.role === 'lender' && 
    loan.lender.toString() !== req.user.id
  ) {
    throw new APIError('You do not have permission to create milestones for this loan', 403);
  }
  
  // Create the milestone
  const milestone = await Milestone.create({
    loan: loanId,
    name,
    description,
    order,
    startDate,
    dueDate,
    requirements: requirements || [],
    requiredDocuments: requiredDocuments || [],
    responsibleParty,
    status: 'pending' // Initial status
  });
  
  // Update milestone status based on dates
  milestone.updateStatus();
  await milestone.save();
  
  // Log the milestone creation for audit
  await createAuditLog({
    eventType: 'milestone:create',
    description: `Created milestone "${name}" for loan ${loan.loanNumber || loanId}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    entityType: 'milestone',
    entityId: milestone._id,
    metadata: { 
      loanId,
      loanNumber: loan.loanNumber,
      milestoneName: name
    }
  });
  
  res.status(201).json({
    status: 'success',
    data: milestone
  });
});

/**
 * Update a milestone
 */
exports.updateMilestone = catchAsync(async (req, res) => {
  const { milestoneId } = req.params;
  const userId = req.user.id;
  
  // Get the milestone
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new APIError('Milestone not found', 404);
  }
  
  // Check loan access
  const loan = await Loan.findById(milestone.loan);
  if (!loan) {
    throw new APIError('Associated loan not found', 404);
  }
  
  // Only lender assigned to loan or admin can update most milestone fields
  const isLenderOrAdmin = req.user.role === 'admin' || 
    (req.user.role === 'lender' && loan.lender.toString() === userId);
  
  // Borrowers can only update specific fields
  const allowedFieldsForBorrower = [
    'notes'
  ];
  
  // Check if user has permission to update
  if (
    req.user.role === 'borrower' && 
    (loan.borrower.toString() !== userId || 
     Object.keys(req.body).some(field => !allowedFieldsForBorrower.includes(field)))
  ) {
    throw new APIError('You do not have permission to update this milestone', 403);
  }
  
  if (
    req.user.role === 'lender' && 
    loan.lender.toString() !== userId
  ) {
    throw new APIError('You do not have permission to update this milestone', 403);
  }
  
  // Handle specific field updates
  
  // Requirements completion
  if (req.body.requirements) {
    // Only update specific requirement
    if (req.body.requirementId) {
      const requirementIndex = milestone.requirements.findIndex(
        req => req._id.toString() === req.body.requirementId
      );
      
      if (requirementIndex === -1) {
        throw new APIError('Requirement not found', 404);
      }
      
      // Update the specific requirement
      milestone.requirements[requirementIndex].isCompleted = req.body.requirements.isCompleted;
      milestone.requirements[requirementIndex].completedDate = req.body.requirements.isCompleted ? new Date() : null;
      milestone.requirements[requirementIndex].completedBy = req.body.requirements.isCompleted ? userId : null;
    } else {
      // Replace all requirements (lender/admin only)
      if (!isLenderOrAdmin) {
        throw new APIError('You do not have permission to update all requirements', 403);
      }
      milestone.requirements = req.body.requirements;
    }
  }
  
  // Required documents update
  if (req.body.requiredDocuments) {
    // Only update specific document
    if (req.body.documentId) {
      const docIndex = milestone.requiredDocuments.findIndex(
        doc => doc._id.toString() === req.body.documentId
      );
      
      if (docIndex === -1) {
        throw new APIError('Required document not found', 404);
      }
      
      // Update the specific document
      milestone.requiredDocuments[docIndex].isReceived = req.body.requiredDocuments.isReceived;
      milestone.requiredDocuments[docIndex].document = req.body.requiredDocuments.document;
    } else {
      // Replace all required documents (lender/admin only)
      if (!isLenderOrAdmin) {
        throw new APIError('You do not have permission to update all required documents', 403);
      }
      milestone.requiredDocuments = req.body.requiredDocuments;
    }
  }
  
  // Notes update
  if (req.body.notes && req.body.notes.content) {
    milestone.notes.push({
      content: req.body.notes.content,
      createdBy: userId,
      createdAt: new Date()
    });
  }
  
  // Status update (only by lender/admin)
  if (req.body.status && isLenderOrAdmin) {
    milestone.status = req.body.status;
    
    // If marked as completed, set completion date and who completed it
    if (req.body.status === 'completed') {
      milestone.completionDate = new Date();
      milestone.completedBy = userId;
    } else if (req.body.status === 'current') {
      milestone.startDate = milestone.startDate || new Date();
      milestone.completionDate = null;
      milestone.completedBy = null;
    }
  }
  
  // Other fields (lender/admin only)
  if (isLenderOrAdmin) {
    if (req.body.name) milestone.name = req.body.name;
    if (req.body.description) milestone.description = req.body.description;
    if (req.body.order) milestone.order = req.body.order;
    if (req.body.startDate) milestone.startDate = req.body.startDate;
    if (req.body.dueDate) milestone.dueDate = req.body.dueDate;
    if (req.body.responsibleParty) milestone.responsibleParty = req.body.responsibleParty;
  }
  
  // Save the updated milestone
  await milestone.save();
  
  // Log the milestone update for audit
  await createAuditLog({
    eventType: 'milestone:update',
    description: `Updated milestone "${milestone.name}" for loan ${loan.loanNumber || loan._id}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'info',
    entityType: 'milestone',
    entityId: milestone._id,
    metadata: { 
      loanId: loan._id,
      loanNumber: loan.loanNumber,
      milestoneName: milestone.name,
      updatedFields: Object.keys(req.body)
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: milestone
  });
});

/**
 * Delete a milestone
 */
exports.deleteMilestone = catchAsync(async (req, res) => {
  const { milestoneId } = req.params;
  
  // Only admins can delete milestones
  if (req.user.role !== 'admin') {
    throw new APIError('You do not have permission to delete milestones', 403);
  }
  
  // Get the milestone
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new APIError('Milestone not found', 404);
  }
  
  // Check loan access
  const loan = await Loan.findById(milestone.loan);
  
  // Delete the milestone
  await Milestone.deleteOne({ _id: milestoneId });
  
  // Log the milestone deletion for audit
  await createAuditLog({
    eventType: 'milestone:delete',
    description: `Deleted milestone "${milestone.name}" for loan ${loan ? (loan.loanNumber || loan._id) : milestone.loan}`,
    userId: req.user.id,
    userRole: req.user.role,
    level: 'warning',
    entityType: 'loan',
    entityId: milestone.loan,
    metadata: { 
      milestoneName: milestone.name,
      loanNumber: loan ? loan.loanNumber : null
    }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Milestone deleted successfully'
  });
});
