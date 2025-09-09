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

// Get company lenders
router.get('/:id/lenders', companyController.getCompanyLenders);

// Create a new lender for the company
router.post('/:id/lenders', companyController.createCompanyLender);

// Get company statistics
router.get('/:id/stats', companyController.getCompanyStats);

// Get top lenders for a company
router.get('/:id/top-lenders', companyController.getTopLenders);

// Get lender dashboard data for company access
router.get('/:companyId/lenders/:lenderId/dashboard', companyController.getLenderDashboard);

// Get lender borrowers for company access
router.get('/:companyId/lenders/:lenderId/borrowers', companyController.getLenderBorrowers);

// Get lender activities for company access
router.get('/:companyId/lenders/:lenderId/activities', companyController.getLenderActivities);

// Get a specific lender for company access
router.get('/:companyId/lenders/:lenderId', companyController.getLender);

// Get lender programs for company access
router.get('/:companyId/lenders/:lenderId/programs', companyController.getLenderPrograms);

// Get a specific company (moved after more specific routes)
router.get('/:id', companyController.getCompany);

// Update company - available to lenders who belong to the company and admins
router.patch('/:id', companyController.updateCompany);

// Update company branding - available to lenders who belong to the company and admins
router.patch('/:id/branding', companyController.updateBranding);

// Admin-only routes
// Update company subscription
router.patch('/:id/subscription', authorize('admin'), companyController.updateSubscription);

// Update company active status
router.patch('/:id/status', authorize('admin'), companyController.updateCompanyStatus);

module.exports = router;
