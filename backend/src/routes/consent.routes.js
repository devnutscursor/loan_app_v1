const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  grantCreditReportConsent,
  getConsentStatus,
  revokeCreditReportConsent
} = require('../controllers/consent.controller');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/consent/credit-report/status
 * @desc    Get credit report consent status for a borrower
 * @access  Private (Borrower for self, Lender/Company for their borrowers)
 * @query   borrowerId (required for lender/company, optional for borrower)
 */
router.get('/credit-report/status', getConsentStatus);

/**
 * @route   POST /api/v1/consent/credit-report
 * @desc    Grant credit report consent
 * @access  Private (Borrower for self, Lender/Company can record for their borrowers)
 * @body    { borrowerId?, consentMethod?, notes? }
 */
router.post('/credit-report', grantCreditReportConsent);

/**
 * @route   POST /api/v1/consent/credit-report/revoke
 * @desc    Revoke credit report consent
 * @access  Private (Borrower for self, Admin can revoke for any)
 * @body    { borrowerId? }
 */
router.post('/credit-report/revoke', revokeCreditReportConsent);

module.exports = router;

