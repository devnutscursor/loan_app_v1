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
  
  // Update the loan's completion percentage
  await updateLoanCompletionPercentage(loanId);
  
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
    order,
    startDate,
    deadlineDate
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
    status: isFirstMilestone ? 'in_progress' : 'pending',
    startDate: startDate || new Date(),
    deadlineDate: deadlineDate || null
  });
  
  // Update the loan's completion percentage
  await updateLoanCompletionPercentage(loanId);
  
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
  
  // If milestone has a deadline, check if it's within 24 hours and send notification immediately
  if (deadlineDate) {
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
    
    // If deadline is within 24 hours, trigger notification check immediately
    if (hoursUntilDeadline <= 24) {
      const milestoneNotificationService = require('../services/milestoneNotification.service');
      try {
        console.log(`New milestone has deadline within 24 hours (${hoursUntilDeadline.toFixed(1)} hours). Sending notification immediately...`);
        // Force a notification for this specific milestone rather than checking all milestones
        const populatedMilestone = await Milestone.findById(milestone._id).populate({
          path: 'loan',
          populate: [
            { 
              path: 'lender',
              populate: { path: 'user', model: 'User' } // Get User from Lender
            },
            { 
              path: 'assignedLoanOfficer', 
              model: 'User' 
            }
          ]
        });
        
        if (populatedMilestone) {
          await milestoneNotificationService.sendDeadlineNotification(populatedMilestone);
        } else {
          console.error('Could not find newly created milestone with populated data');
        }
      } catch (err) {
        console.error('Error sending milestone notification after creation:', err);
      }
    }
  }
  
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
 * Update the loan's completion percentage based on milestone statuses
 */
const updateLoanCompletionPercentage = async (loanId) => {
  try {
    // Get all milestones for the loan
    const milestones = await Milestone.find({ loan: loanId });
    
    if (!milestones || milestones.length === 0) return;
    
    // Calculate progress
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      milestone => milestone.status === 'completed'
    ).length;
    const inProgressMilestones = milestones.filter(
      milestone => milestone.status === 'in_progress'
    ).length;
    
    // Calculate weighted progress (completed = 100%, in_progress = 50%)
    const progressValue = (completedMilestones + (inProgressMilestones * 0.5)) / totalMilestones;
    const completionPercentage = Math.round(progressValue * 100);
    
    console.log(`Updating loan ${loanId} completion percentage to ${completionPercentage}%`);
    
    // Update the loan's completion percentage
    await Loan.findByIdAndUpdate(loanId, { completionPercentage });
  } catch (error) {
    console.error('Error updating loan completion percentage:', error);
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
  
  // Update only name, description, and dates (lender/admin only)
  if (req.user.role === 'admin' || 
    (req.user.role === 'lender')) {
    if (req.body.name) milestone.name = req.body.name;
    if (req.body.description) milestone.description = req.body.description;
    if (req.body.order) milestone.order = req.body.order;
    if (req.body.startDate) milestone.startDate = req.body.startDate;
    if (req.body.deadlineDate) {
      // Store the original deadline for logging purposes
      const originalDeadline = milestone.deadlineDate ? new Date(milestone.deadlineDate).toISOString() : 'none';
      const newDeadline = new Date(req.body.deadlineDate).toISOString();
      
      console.log(`[DEADLINE UPDATE] Milestone ${milestone._id}: Updating deadline from ${originalDeadline} to ${newDeadline}`);
      
      // Update the milestone with new deadline
      milestone.deadlineDate = req.body.deadlineDate;
      milestone.notificationSent = false; // Reset notification flag when deadline changes
      
      // Save the milestone first to ensure the update is persisted
      await milestone.save();
      console.log(`[DEADLINE UPDATE] Milestone ${milestone._id}: Saved updated deadline to database`);
      
      // Import the service here to avoid circular dependency
      const milestoneNotificationService = require('../services/milestoneNotification.service');
      await milestoneNotificationService.resetNotificationFlag(milestone._id);
      
      // If the updated deadline is within 24 hours, trigger notification check immediately
      const now = new Date();
      const deadline = new Date(req.body.deadlineDate);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline <= 24) {
        try {
          // Add a small delay to ensure database consistency before fetching again
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log(`[DEADLINE UPDATE] Updated milestone has deadline within 24 hours (${hoursUntilDeadline.toFixed(1)} hours). Sending notification...`);
          
          // Check the database record to verify our update is persisted
          const verifyMilestone = await Milestone.findById(milestoneId);
          console.log(`[DEADLINE UPDATE] Verification check - milestone deadline in DB: ${new Date(verifyMilestone.deadlineDate).toISOString()}`);
          
          // Force a notification for this specific milestone with completely fresh data
          const populatedMilestone = await Milestone.findById(milestoneId).populate({
            path: 'loan',
            populate: [
              { 
                path: 'lender',
                populate: { path: 'user', model: 'User' } // Get User from Lender
              },
              { 
                path: 'assignedLoanOfficer', 
                model: 'User' 
              }
            ]
          });
          
          if (populatedMilestone) {
            console.log(`[DEADLINE UPDATE] Fetched fresh milestone data, sending notification with deadline: ${new Date(populatedMilestone.deadlineDate).toISOString()}`);
            await milestoneNotificationService.sendDeadlineNotification(populatedMilestone);
          } else {
            console.error('Could not find updated milestone with populated data');
          }
        } catch (err) {
          console.error('Error sending milestone notification after update:', err);
        }
      }
    }
  }
  
  // Save the updated milestone
  await milestone.save();
  
  // If no milestone is in_progress, set the first pending one to in_progress
  if (milestone.status !== 'in_progress') {
    await updateMilestoneProgression(milestone.loan);
  }
  
  // Update the loan's completion percentage
  await updateLoanCompletionPercentage(milestone.loan);
  
  // Check if all milestones are completed and update loan status if needed
  if (milestone.status === 'completed') {
    // Get all milestones for the loan
    const allMilestones = await Milestone.find({ loan: milestone.loan });
    
    // Check if all milestones are completed
    const allCompleted = allMilestones.every(m => m.status === 'completed');
    
    // If all milestones are completed, update loan status to "Conditional Approval"
    if (allCompleted) {
      console.log(`All milestones completed for loan ${loan._id}. Updating status to Conditional Approval.`);
      
      // Update the loan status
      loan.status = 'Conditional Approval';
      await loan.save();
      
      // Log the loan approval
      await createAuditLog({
        eventType: 'loan:status_changed', // Changing to match the pattern used in lender.controller
        description: `Loan ${loan.loanNumber || loan._id} automatically received conditional approval after all milestones completed`,
        userId: req.user.id,
        userRole: req.user.role,
        level: 'info',
        entityType: 'loan',
        entityId: loan._id,
        metadata: { 
          loanId: loan._id,
          loanNumber: loan.loanNumber,
          previousStatus: loan.status,
          newStatus: 'Conditional Approval',
          borrowerName: loan.borrowerDetails ? `${loan.borrowerDetails.firstName || ''} ${loan.borrowerDetails.lastName || ''}`.trim() : 'Unknown',
          loanAmount: loan.loanDetails?.loanAmount || 0
        }
      });
      
      console.log(`Loan ${loan._id} status updated to Conditional Approval`);
    }
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
  
  // Store the loan ID for updating completion percentage after deletion
  const loanId = milestone.loan;
  
  // Delete the milestone
  await Milestone.deleteOne({ _id: milestoneId });
  
  // Update the loan's completion percentage
  await updateLoanCompletionPercentage(loanId);
  
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
