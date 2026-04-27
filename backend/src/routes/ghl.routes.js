const express = require('express');
const ghlController = require('../controllers/ghl.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/connect-url', authenticate, authorize('admin', 'company', 'lender'), ghlController.getConnectUrl);
router.get('/status', authenticate, authorize('admin', 'company', 'lender'), ghlController.getIntegrationStatus);
router.get('/token-storage-status', authenticate, authorize('admin', 'company', 'lender'), ghlController.getTokenStorageStatus);
router.post('/create-admin-user', authenticate, authorize('admin', 'company', 'lender'), ghlController.createAdminUser);
router.post('/link-loan-officer', authenticate, authorize('admin', 'company'), ghlController.linkLoanOfficerUser);
router.post('/link-borrower-contact', authenticate, authorize('admin', 'company', 'lender'), ghlController.linkBorrowerContact);
router.post('/refresh-token', authenticate, authorize('admin', 'company', 'lender'), ghlController.refreshIntegrationToken);
router.post('/disconnect', authenticate, authorize('admin', 'company', 'lender'), ghlController.disconnectIntegration);
router.get('/health', authenticate, authorize('admin', 'company', 'lender'), ghlController.healthCheck);

// Phase 4: Opportunities (pipeline/stage configuration)
router.get('/opportunity/pipelines', authenticate, authorize('admin', 'company', 'lender'), ghlController.getOpportunityPipelines);
router.get('/opportunity/config', authenticate, authorize('admin', 'company'), ghlController.getOpportunityConfig);
router.post('/opportunity/config', authenticate, authorize('admin', 'company'), ghlController.setOpportunityConfig);
router.post('/opportunity/sync-loan', authenticate, authorize('admin', 'company', 'lender'), ghlController.syncLoanOpportunity);
router.get('/opportunity/loan-officer-contacts', authenticate, authorize('lender'), ghlController.getLoanOfficerGhlContacts);

module.exports = router;
