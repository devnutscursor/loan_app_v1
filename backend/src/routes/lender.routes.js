const express = require('express');
const lenderController = require('../controllers/lender.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/public/:id', lenderController.getPublicLenderProfile);

// All other routes require authentication
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

// Borrower management
// Get borrowers for the current lender
router.get('/borrowers', authorize('lender'), lenderController.getLenderBorrowers);

// Get borrowers for a specific lender
router.get('/:lenderId/borrowers', authorize('lender', 'admin'), lenderController.getLenderBorrowers);

// Get a specific borrower by ID for a lender
router.get('/:lenderId/borrowers/:borrowerId', authorize('lender', 'admin'), lenderController.getLenderBorrowerById);

// Admin-only routes
// Get all lenders
router.get('/', authorize('admin'), lenderController.getAllLenders);

// Get specific lender by ID
router.get('/:id', authorize('admin'), lenderController.getLenderById);

// Update lender active status
router.patch('/:id/status', authorize('admin'), lenderController.updateLenderStatus);

module.exports = router;
