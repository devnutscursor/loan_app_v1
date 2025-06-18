const express = require('express');
const router = express.Router();
const Milestone = require('../models/milestone.model');
const Loan = require('../models/loan.model');
const milestoneNotificationService = require('../services/milestoneNotification.service');

/**
 * Debug route to check why milestones are getting notified
 */
router.get('/check-milestone-notifications', async (req, res) => {
  try {
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    
    // Log all milestones with deadlines and their calculation
    const allMilestonesWithDeadlines = await Milestone.find({
      deadlineDate: { $exists: true, $ne: null }
    }).populate({
      path: 'loan',
      populate: [
        { 
          path: 'lender',
          populate: { path: 'user', model: 'User' }
        },
        { 
          path: 'assignedLoanOfficer', 
          model: 'User' 
        }
      ]
    });

    const results = allMilestonesWithDeadlines.map(milestone => {
      const deadline = new Date(milestone.deadlineDate);
      const hoursUntilDeadline = Math.round((deadline - now) / (1000 * 60 * 60) * 10) / 10;
      const shouldNotify = hoursUntilDeadline <= 24 && hoursUntilDeadline > -24 && !milestone.notificationSent;
      
      return {
        id: milestone._id,
        name: milestone.name,
        deadline: deadline.toISOString(),
        notificationSent: milestone.notificationSent,
        hoursUntilDeadline,
        shouldNotify
      };
    });
    
    // Count how many would notify
    const countToNotify = results.filter(r => r.shouldNotify).length;
    
    // Return the analysis
    res.status(200).json({
      message: `Found ${results.length} milestones with deadlines, ${countToNotify} would be notified based on 24-hour rule`,
      milestones: results
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Force check for all notifications with enhanced logging
 */
router.get('/force-check-notifications', async (req, res) => {
  try {
    console.log('Forcing notification check');
    const result = await milestoneNotificationService.checkMilestoneDeadlines();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error forcing notification check:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
