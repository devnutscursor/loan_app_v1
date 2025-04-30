const express = require('express');
const borrowerController = require('../controllers/borrower.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const debugMiddleware = require('../middleware/debug.middleware');
const loanController = require('../controllers/loan.controller');

const router = express.Router();

// Public routes (no authentication required)
router.get('/loan-types', loanController.getLoanTypes);

// All other routes require authentication
router.use(authenticate);

// Dashboard routes for borrowers
router.get('/dashboard', borrowerController.getDashboard);
router.get('/loans', borrowerController.getBorrowerLoans);
router.get('/loans/draft/recent', borrowerController.getRecentDraftLoans);
router.get('/activities', borrowerController.getBorrowerActivities);

// Document & condition routes
router.get('/loan-conditions', borrowerController.getLoanConditions);

// Loan draft routes (these use the loan controller)
router.post('/loans/draft', loanController.saveDraft);
router.get('/loans/draft/:id', loanController.getDraft);

// Loan application routes - using upload.array('documents') to handle multipart/form-data
router.post('/loans', upload.array('documents'), debugMiddleware, loanController.createLoan);
// Add routes for loan number operations
router.get('/loans/by-number/:number', loanController.getLoanByNumber);
// Add PUT route for updating loans by loan number
router.put('/loans/by-number/:number', loanController.updateLoanByNumber);

// Regular loan routes
router.get('/loans/:id', loanController.getLoan);
router.put('/loans/:id', loanController.updateLoan);
router.delete('/loans/:loanId/documents/:documentId', loanController.removeDocument);

// Routes for both borrowers and lenders
router.get('/profile', borrowerController.getBorrowerProfile);
router.put('/profile', borrowerController.updateBorrowerProfile);
router.put('/personal-info', borrowerController.updateBorrowerPersonalInfo);
router.put('/financial-info', borrowerController.updateFinancialInfo);
router.put('/employment-info', borrowerController.updateEmploymentInfo);

// Routes for lenders only
router.get('/', authorize('lender', 'admin'), borrowerController.getAllBorrowers);
router.get('/:id', authorize('lender', 'admin'), borrowerController.getBorrowerProfile);
router.put('/:id/profile', authorize('lender', 'admin'), borrowerController.updateBorrowerProfile);
router.put('/:id/personal-info', authorize('lender', 'admin'), borrowerController.updateBorrowerPersonalInfo);
router.put('/:id/financial-info', authorize('lender', 'admin'), borrowerController.updateFinancialInfo);
router.put('/:id/employment-info', authorize('lender', 'admin'), borrowerController.updateEmploymentInfo);

module.exports = router;
