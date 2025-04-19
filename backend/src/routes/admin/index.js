const express = require('express');
const router = express.Router();

// Import admin route modules
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');
const loanRoutes = require('./loan.routes');
const documentRoutes = require('./document.routes');
const settingsRoutes = require('./settings.routes');

// Register admin route modules
router.use(dashboardRoutes);
router.use(userRoutes);
router.use(loanRoutes);
router.use(documentRoutes);
router.use(settingsRoutes);

module.exports = router;
