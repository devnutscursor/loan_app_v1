const express = require('express');
const {
    createCreditReport,
    getCreditReport,
    refreshCreditReport,
    getCreditReportHistory,
    getCreditReportFile,
    getCreditReportStatus
} = require('../controllers/creditReportController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply lender authorization to all routes
router.use(authorize('lender', 'company'));

/**
 * @route   POST /api/credit-report/:loanId
 * @desc    Create a new credit report for a loan
 * @access  Private (Lender only)
 * @body    { providers: { equifax: boolean, experian: boolean, transunion: boolean } }
 */
router.post('/:loanId', createCreditReport);

/**
 * @route   GET /api/credit-report/:loanId
 * @desc    Get existing active credit report for a loan
 * @access  Private (Lender only)
 */
router.get('/:loanId', getCreditReport);

/**
 * @route   PUT /api/credit-report/:loanId/refresh
 * @desc    Refresh an existing credit report
 * @access  Private (Lender only)
 */
router.put('/:loanId/refresh', refreshCreditReport);

/**
 * @route   GET /api/credit-report/:loanId/history
 * @desc    Get all credit reports for a loan (including expired)
 * @access  Private (Lender only)
 */
router.get('/:loanId/history', getCreditReportHistory);

/**
 * @route   GET /api/credit-report/:loanId/file
 * @desc    Get signed URL for credit report file
 * @access  Private (Lender only)
 */
router.get('/:loanId/file', getCreditReportFile);

/**
 * @route   GET /api/credit-report/:loanId/status
 * @desc    Check if loan has an active credit report
 * @access  Private (Lender only)
 */
router.get('/:loanId/status', getCreditReportStatus);

module.exports = router;
