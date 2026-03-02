const express = require('express');
const router = express.Router();
const mcrController = require('../controllers/mcr.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All MCR routes require authentication
router.use(authenticate);

// Only lenders, company admins, and admins can access MCR
router.use(authorize('lender', 'company', 'admin'));

// ===== Report Generation & Management =====
router.post('/generate', mcrController.generateReport);
router.get('/reports', mcrController.getReports);
router.get('/reports/:id', mcrController.getReport);
router.put('/reports/:id', mcrController.updateReport);
router.delete('/reports/:id', mcrController.deleteReport);
router.get('/reports/:id/export', mcrController.exportReport);

// ===== Admin — Lender list for "Generate as LO" =====
router.get('/lenders', mcrController.getLendersForMCR);

// ===== State Configuration =====
router.get('/states', mcrController.getStateConfigs);
router.put('/states/:stateCode', mcrController.updateStateConfig);

// ===== Financial Condition =====
router.get('/financial-condition/:year/:quarter', mcrController.getFinancialCondition);
router.put('/financial-condition/:year/:quarter', mcrController.saveFinancialCondition);

module.exports = router;
