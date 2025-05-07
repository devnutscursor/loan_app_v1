const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const loanRateController = require('../controllers/loanRate.controller');

// GET /api/v1/loan-rates - Get all loan rates
router.get('/', authenticate, loanRateController.getAllLoanRates);

// PUT /api/v1/loan-rates - Update loan rates
router.put('/', authenticate, loanRateController.updateLoanRates);

// GET /api/v1/loan-rates/:type - Get loan rate for a specific program type
router.get('/:type', authenticate, loanRateController.getLoanRateByType);

module.exports = router;
