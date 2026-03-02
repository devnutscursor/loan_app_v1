const express = require('express');
const router = express.Router();
const loanCompensationController = require('../controllers/loanCompensation.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Only lenders, company admins, and admins can manage compensation data
router.use(authorize('lender', 'company', 'admin'));

// Get compensation data for a loan
router.get('/:loanId/compensation', loanCompensationController.getCompensation);

// Update compensation data for a loan
router.put('/:loanId/compensation', loanCompensationController.updateCompensation);

// Get status history for a loan
router.get('/:loanId/status-history', loanCompensationController.getStatusHistory);

// Sync MCR defaults (backfill classification, dates, derived fields) for a loan
router.post('/:loanId/sync-mcr', loanCompensationController.syncMCRDefaults);

module.exports = router;
