const express = require('express');
const loanController = require('../controllers/loan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new loan application
router.post('/', loanController.createLoan);

// Get all loans with filters and pagination
router.get('/', loanController.getAllLoans);

// Get a specific loan by ID
router.get('/:id', loanController.getLoan);

// Update loan details
router.put('/:id', loanController.updateLoan);

// Update loan status and processing state - lender/admin only
router.patch('/:id/status', authorize('lender', 'admin'), loanController.updateLoanStatus);

// Manage loan milestones - lender/admin only
router.patch('/:id/milestone', authorize('lender', 'admin'), loanController.updateMilestone);

// Condition routes
router.post('/:id/conditions', loanController.addCondition);
router.put('/:id/conditions/:conditionId', loanController.updateCondition);
router.delete('/:id/conditions/:conditionId', loanController.removeCondition);

// Add a note to a loan - available to both borrowers and lenders
router.post('/:id/note', loanController.addNote);

// Calculate loan metrics (DTI, LTV, etc.)
router.get('/:id/metrics', loanController.calculateLoanMetrics);

// Update loan parameters and calculations
router.put('/:id/parameters', loanController.updateLoanParameters);

// Loan drafts routes
router.post('/draft', loanController.saveDraft);
router.get('/draft/recent', loanController.getRecentDrafts);
router.get('/draft/:id', loanController.getDraft);

module.exports = router;
