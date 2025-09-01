const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:userId/borrower', adminController.getBorrowerByUserId);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// Admin user creation
router.post('/users/admin', adminController.createAdminUser);
router.post('/users/lender', adminController.createLenderUser);

// Loan management
router.get('/loans', adminController.getAllLoans);
router.get('/loans/:id', adminController.getLoanById);
router.patch('/loans/:id', adminController.updateLoan);

// System logs
router.get('/logs', adminController.getSystemLogs);

// System settings
router.get('/settings', adminController.getSystemSettings);

module.exports = router;
