const express = require('express');
const router = express.Router();

// Import lender route modules
const dashboardRoutes = require('./dashboard.routes');
const applicationRoutes = require('./application.routes');
const borrowerRoutes = require('./borrower.routes');
const documentRoutes = require('./document.routes');
const conditionRoutes = require('./condition.routes');
const communicationRoutes = require('./communication.routes');

// Register lender route modules
router.use(dashboardRoutes);
router.use(applicationRoutes);
router.use(borrowerRoutes);
router.use(documentRoutes);
router.use(conditionRoutes);
router.use(communicationRoutes);

module.exports = router;
