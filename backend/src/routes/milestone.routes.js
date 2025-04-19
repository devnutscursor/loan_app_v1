const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestone.controller');
const authMiddleware = require('../middleware/auth');

// Protected routes - require authentication
router.use(authMiddleware.protect);

// Get milestones for a loan
router.get('/loans/:loanId/milestones', milestoneController.getLoanMilestones);

// Get specific milestone
router.get('/milestones/:milestoneId', milestoneController.getMilestone);

// Create new milestone - restricted to lenders and admins
router.post(
  '/milestones',
  authMiddleware.restrictTo('lender', 'admin'),
  milestoneController.createMilestone
);

// Update milestone
router.patch('/milestones/:milestoneId', milestoneController.updateMilestone);

// Delete milestone - restricted to admin
router.delete(
  '/milestones/:milestoneId',
  authMiddleware.restrictTo('admin'),
  milestoneController.deleteMilestone
);

module.exports = router;
