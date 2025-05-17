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
  console.log("params", req.params);
  console.log("user", req.user);
  const { loanId } = req.params;
  const userId = req.user.id;
  
  console.log("userId", userId);
  // Check if loan exists and user has access
  const loan = await Loan.findById(loanId);
  console.log("loan", loan);
  if (!loan) {
    throw new APIError('Loan not found', 404);
  }
  
  // Check access based on user role
  // if (
  //   req.user.role === 'borrower' && loan.borrower.toString() !== userId ||
  //   req.user.role === 'lender' && loan.lender.toString() !== userId
  // ) {
  //   throw new APIError('You do not have access to this loan', 403);
  // }
  
  // Get all milestones for the loan, ordered by sequence
  const milestones = await Milestone.find({ loan: loanId }).sort({ order: 1 });
  
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
  const milestone = await Milestone.findById(milestoneId);
  
  if (!milestone) {
    throw new APIError('Milestone not found', 404);
  }
  
  // Check access via loan
  const loan = await Loan.findById(milestone.loan);
  // if (
  //   req.user.role === 'borrower' && loan.borrower.toString() !== userId ||
  //   req.user.role === 'lender' && loan.lender.toString() !== userId
  // ) {
  //   throw new APIError('You do not have access to this milestone', 403);
  // }
  
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
  
  console.log("req.body", req.body);
  const {
    loan: loanId,
    name,
    description,
    order
  } = req.body;
  
  // Check if loan exists
  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new APIError('Loan not found', 404);
  }
  
  // Only the assigned lender or admin can create milestones
  // if (
  //   req.user.role === 'lender' && 
  //   loan.lender.toString() !== req.user.id
  // ) {
  //   throw new APIError('You do not have permission to create milestones for this loan', 403);
  // }
  
  // Check if this is the first milestone for this loan
  const existingMilestones = await Milestone.find({ loan: loanId });
  const isFirstMilestone = existingMilestones.length === 0;

  // Create the milestone with 'in_progress' status if it's the first one
  const milestone = await Milestone.create({
    loan: loanId,
    name,
    description,
    order: order || 0,
    status: isFirstMilestone ? 'in_progress' : 'pending'
  });
  
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
 * Updates milestone statuses based on completion
 * - When a milestone is marked as 'completed', the next milestone becomes 'in_progress'
 * - If there's no 'in_progress' milestone, the first non-completed one becomes 'in_progress'
 */
const updateMilestoneProgression = async (loanId) => {
  try {
    // Get all milestones for the loan, sorted by order
    const milestones = await Milestone.find({ loan: loanId }).sort({ order: 1 });
    
    if (!milestones || milestones.length === 0) return;
    
    // Check if there's any 'in_progress' milestone
    const inProgressExists = milestones.some(m => m.status === 'in_progress');
    
    if (!inProgressExists) {
      // Find the first non-completed milestone and set it to 'in_progress'
      const firstPendingMilestone = milestones.find(m => m.status === 'pending');
      if (firstPendingMilestone) {
        firstPendingMilestone.status = 'in_progress';
        await firstPendingMilestone.save();
        console.log(`Set milestone ${firstPendingMilestone._id} to in_progress`);
      }
    }
  } catch (error) {
    console.error('Error updating milestone progression:', error);
  }
};

/**
 * Update a milestone
 */
exports.updateMilestone = catchAsync(async (req, res) => {
  console.log("req.body", req.body);
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
  
  // Store previous status to check if there's a change to 'completed'
  const previousStatus = milestone.status;
  
  // Only lender assigned to loan or admin can update most milestone fields
  // const isLenderOrAdmin = req.user.role === 'admin' || 
  //   (req.user.role === 'lender' && loan.lender.toString() === userId);
  
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
  
  // Simple milestone model only needs name, description, order, and status
  
  // Status update (only by lender/admin)
  if ((req.user.role === 'admin' || req.user.role === 'lender') && req.body.status) {
    milestone.status = req.body.status;
    
    // If milestone is marked as completed, find the next milestone and mark it as in_progress
    if (milestone.status === 'completed' && previousStatus !== 'completed') {
      // Find the next milestone in order
      const nextMilestone = await Milestone.findOne({
        loan: milestone.loan,
        order: { $gt: milestone.order },
        status: { $ne: 'completed' }
      }).sort({ order: 1 });
      
      if (nextMilestone) {
        // Set the next milestone to in_progress
        nextMilestone.status = 'in_progress';
        await nextMilestone.save();
        console.log(`Set next milestone ${nextMilestone._id} to in_progress`);
      }
    }
  }
  
  // Update only name and description (lender/admin only)
  if (req.user.role === 'admin' || 
    (req.user.role === 'lender')) {
    if (req.body.name) milestone.name = req.body.name;
    if (req.body.description) milestone.description = req.body.description;
    if (req.body.order) milestone.order = req.body.order;
  }
  
  // Save the updated milestone
  await milestone.save();
  
  // If no milestone is in_progress, set the first pending one to in_progress
  if (milestone.status !== 'in_progress') {
    await updateMilestoneProgression(milestone.loan);
  }
  
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
  // if (req.user.role !== 'admin') {
  //   throw new APIError('You do not have permission to delete milestones', 403);
  // }
  
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
