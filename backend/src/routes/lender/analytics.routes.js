const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/lender/analytics.controller');
const authMiddleware = require('../../middleware/auth');

// Protect all analytics routes
router.use(authMiddleware.protect);

// Restrict to lenders and admins
router.use(authMiddleware.restrictTo('lender', 'admin'));

// Summary metrics endpoint
router.get('/summary', analyticsController.getSummaryMetrics);

// Pipeline data endpoint
router.get('/pipeline', analyticsController.getPipelineData);

// Loan distribution data endpoint
router.get('/distribution', analyticsController.getDistributionData);

// Performance trends endpoint
router.get('/performance', analyticsController.getPerformanceTrends);

// Export reports endpoint
router.get('/export', analyticsController.exportReport);

module.exports = router;
