const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLog.controller');
const authMiddleware = require('../middleware/auth');

// Protected routes - require authentication
router.use(authMiddleware.protect);

// Create audit log entry
router.post('/', auditLogController.createAuditLogAPI);

// Get audit logs - restricted to lenders and admins
router.get(
  '/',
  authMiddleware.restrictTo('lender', 'admin'),
  auditLogController.getAuditLogs
);

// Get entity audit logs
router.get(
  '/entity/:entityType/:entityId',
  authMiddleware.restrictTo('lender', 'admin'),
  auditLogController.getEntityAuditLogs
);

// Get user activity logs
router.get(
  '/user/:userId',
  auditLogController.getUserActivityLogs
);

module.exports = router;
