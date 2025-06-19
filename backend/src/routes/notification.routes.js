const express = require('express');
const router = express.Router();
const milestoneNotificationService = require('../services/milestoneNotification.service');
const catchAsync = require('../utils/catchAsync');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

// Ensure only lender and admin roles can access these routes
router.use(protect);
router.use(restrictTo('lender', 'admin'));

/**
 * @route   POST /api/notifications/check-milestones
 * @desc    Manually trigger a check for milestone deadlines
 * @access  Private (Lender, Admin)
 */
router.post('/check-milestones', catchAsync(async (req, res) => {
  logger.info('Manual milestone deadline check triggered by user:', req.user.id);
  const result = await milestoneNotificationService.checkMilestoneDeadlines();
  res.status(200).json({
    status: 'success',
    message: `Checked ${result.checked || 0} milestones, sent ${result.notified || 0} notifications`,
    data: result
  });
}));

/**
 * @route   POST /api/notifications/force-notification/:milestoneId
 * @desc    Force send notification for a specific milestone
 * @access  Private (Lender, Admin)
 */
router.post('/force-notification/:milestoneId', catchAsync(async (req, res) => {
  const { milestoneId } = req.params;
  logger.info(`Force notification for milestone ${milestoneId} triggered by user: ${req.user.id}`);
  
  const result = await milestoneNotificationService.forceNotification(milestoneId);
  
  if (result.success) {
    res.status(200).json({
      status: 'success',
      message: 'Notification sent successfully',
      data: result
    });
  } else {
    res.status(400).json({
      status: 'fail',
      message: result.message || 'Failed to send notification',
      data: result
    });
  }
}));

/**
 * @route   POST /api/notifications/test-today-milestones
 * @desc    Force send notification for all milestones with today's deadline
 * @access  Private (Lender, Admin)
 */
router.post('/test-today-milestones', catchAsync(async (req, res) => {
  logger.info('Test today\'s milestone notifications triggered by user:', req.user.id);
  
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find milestones with deadlines TODAY
    const todayMilestones = await Milestone.find({
      deadlineDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'completed' }
    }).populate({
      path: 'loan',
      populate: { path: 'lender', model: 'User' }
    });
    
    // Reset notification flags
    for (const milestone of todayMilestones) {
      milestone.notificationSent = false;
      await milestone.save();
    }
    
    // Send notifications for all today's milestones
    const results = [];
    for (const milestone of todayMilestones) {
      const result = await milestoneNotificationService.sendDeadlineNotification(milestone);
      results.push({
        milestoneId: milestone._id,
        name: milestone.name,
        success: result
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: `Processed ${todayMilestones.length} milestones with today's deadline`,
      data: {
        totalMilestones: todayMilestones.length,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      error
    });
  }
}));

module.exports = router;
