const express = require('express');
const lenderController = require('../controllers/lender.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create lender profile
router.post('/', lenderController.createLender);

// Get current lender profile
router.get('/profile', lenderController.getLenderProfile);

// Update current lender profile
router.patch('/profile', lenderController.updateLenderProfile);

// Get lender dashboard statistics
router.get('/dashboard', lenderController.getLenderDashboard);

// Associate with a company
router.post('/company', lenderController.associateWithCompany);

// Update rate settings
router.patch('/rates', lenderController.updateRateSettings);

// Admin-only routes
// Get all lenders
router.get('/', authorize('admin'), lenderController.getAllLenders);

// Get specific lender by ID
router.get('/:id', authorize('admin'), lenderController.getLenderById);

// Update lender active status
router.patch('/:id/status', authorize('admin'), lenderController.updateLenderStatus);

module.exports = router;
