const express = require('express');
const router = express.Router();
const controller = require('../controllers/consentEmail.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Protected routes (require authentication)
router.post('/send-email', authenticate, controller.sendConsentEmail);
router.get('/token-status/:tokenId', authenticate, controller.getTokenStatus);

// Public routes (no authentication required)
router.get('/verify-token/:token', controller.verifyConsentToken);
router.post('/grant-via-token', controller.grantConsentViaToken);

module.exports = router;

