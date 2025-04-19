const express = require('express');
const loanTypeController = require('../controllers/loanType.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all loan types - public route, no authentication required
router.get('/', loanTypeController.getAllLoanTypes);

module.exports = router;
