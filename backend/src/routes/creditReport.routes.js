const express = require('express');
const {
    createCreditReport,
    getCreditReport,
    refreshCreditReport,
    getCreditReportHistory,
    getCreditReportFile,
    getCreditReportStatus,
    reissueCreditReport,
    upgradeCreditReport
} = require('../controllers/creditReportController');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { verifyCreditReportConsent } = require('../middleware/creditConsent.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply lender authorization to all routes
router.use(authorize('lender', 'company'));

/**
 * @route   POST /api/credit-report/:loanId/:lenderId
 * @desc    Create a new credit report for a loan
 * @access  Private (Lender only) - Requires borrower consent
 * @body    { providers: { equifax: boolean, experian: boolean, transunion: boolean } }
 */
router.post('/:loanId/:lenderId', verifyCreditReportConsent, createCreditReport);

/**
 * @route   GET /api/credit-report/:loanId/:lenderId
 * @desc    Get existing active credit report for a loan
 * @access  Private (Lender only)
 */
router.get('/:loanId/:lenderId', getCreditReport);

/**
 * @route   PUT /api/credit-report/:loanId/:lenderId/refresh
 * @desc    Refresh an existing credit report
 * @access  Private (Lender only) - Requires borrower consent
 */
router.put('/:loanId/:lenderId/refresh', verifyCreditReportConsent, refreshCreditReport);

/**
 * @route   PUT /api/credit-report/:loanId/:lenderId/reissue
 * @desc    Reissue an existing credit report (retrieve using StatusQuery)
 * @access  Private (Lender only) - Requires borrower consent
 */
router.put('/:loanId/:lenderId/reissue', verifyCreditReportConsent, reissueCreditReport);

/**
 * @route   PUT /api/credit-report/:loanId/:lenderId/upgrade
 * @desc    Upgrade an existing credit report order
 * @access  Private (Lender only) - Requires borrower consent
 */
router.put('/:loanId/:lenderId/upgrade', verifyCreditReportConsent, upgradeCreditReport);

/**
 * @route   GET /api/credit-report/:loanId/:lenderId/history
 * @desc    Get all credit reports for a loan (including expired)
 * @access  Private (Lender only)
 */
router.get('/:loanId/:lenderId/history', getCreditReportHistory);

/**
 * @route   GET /api/credit-report/:loanId/:lenderId/file
 * @desc    Get signed URL for credit report file
 * @access  Private (Lender only)
 */
router.get('/:loanId/:lenderId/file', getCreditReportFile);

/**
 * @route   GET /api/credit-report/:loanId/:lenderId/status
 * @desc    Check if loan has an active credit report
 * @access  Private (Lender only)
 */
router.get('/:loanId/:lenderId/status', getCreditReportStatus);

module.exports = router;
