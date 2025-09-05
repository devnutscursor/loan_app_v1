const express = require('express');
const companyController = require('../controllers/company.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create company - available to lenders and admins
router.post('/', authorize('admin'), companyController.createCompany);

// Get all companies
router.get('/', companyController.getAllCompanies);

// Get a specific company
router.get('/:id', companyController.getCompany);

// Update company - available to lenders who belong to the company and admins
router.patch('/:id', companyController.updateCompany);

// Update company branding - available to lenders who belong to the company and admins
router.patch('/:id/branding', companyController.updateBranding);

// Get company lenders
router.get('/:id/lenders', companyController.getCompanyLenders);

// Get company statistics
router.get('/:id/stats', companyController.getCompanyStats);

// Get top lenders for a company
router.get('/:id/top-lenders', companyController.getTopLenders);

// Admin-only routes
// Update company subscription
router.patch('/:id/subscription', authorize('admin'), companyController.updateSubscription);

// Update company active status
router.patch('/:id/status', authorize('admin'), companyController.updateCompanyStatus);

module.exports = router;
