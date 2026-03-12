const express = require('express');
const loanController = require('../controllers/loan.controller');
const milestoneController = require('../controllers/milestone.controller');
const { uploadWithErrorHandling } = require('../middleware/upload.middleware');

const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new loan application
router.post('/', loanController.createLoan);

// Import loan from XML file
router.post('/import-xml', uploadWithErrorHandling.single('xmlFile'), loanController.importFromXML);

// Get all loans with filters and pagination
router.get('/', loanController.getAllLoans);

router.get(
    '/borrower/:borrowerId',
    authorize('lender', 'company'),
    loanController.getBorrowerLoans
  );

// Get a specific loan by ID
router.get('/:id', authorize('lender', 'company', 'admin'), loanController.getLoan);

// Get a loan with all details (documents, milestones) in a single request
router.get('/:id/with-details', authorize('lender', 'company', 'admin'), loanController.getLoanWithDetails);

// Get conditions for a loan
router.get('/:id/conditions', authorize('lender', 'company', 'admin', 'borrower'), loanController.getLoanConditions);

// Update loan details
router.put('/:id', authorize('lender','company', 'admin'), loanController.updateLoan);

// Update loan status and processing state - lender/company only
router.patch('/:id/status', loanController.updateLoanStatus);

// Send pre-approval letter - lender/company only
router.post('/:loanId/send-pre-approval', authorize('lender', 'company', 'admin'), loanController.sendPreApprovalLetter);

// Manage loan milestones - lender/company only
router.patch('/:id/milestone', authorize('lender', 'company', 'admin'), loanController.updateMilestone);

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

// Toggle editing permission - lender/company only
router.patch('/:id/toggle-editing', authorize('lender', 'company', 'admin'), loanController.toggleEditingPermission);

// Update loan status - lender/company only
router.patch('/:id/update-status', authorize('lender', 'company', 'admin' ), loanController.updateLoanStatus);

// Loan drafts routes
router.post('/draft', loanController.saveDraft);
router.get('/draft/recent', loanController.getRecentDrafts);
router.get('/draft/:id', loanController.getDraft);


// Get milestones for a loan
router.get('/:loanId/milestones', milestoneController.getLoanMilestones);

// Get specific milestone
router.get('/milestones/:milestoneId', milestoneController.getMilestone);

// Create new milestone - restricted to lenders and admins
router.post('/milestones', milestoneController.createMilestone);

// Update milestone
router.patch('/milestones/:milestoneId', milestoneController.updateMilestone);

// Delete milestone - restricted to admin
router.delete('/milestones/:milestoneId', milestoneController.deleteMilestone);

module.exports = router;
