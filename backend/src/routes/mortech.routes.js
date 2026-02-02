const express = require('express');
const mortechController = require('../controllers/mortech.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/search', authorize('lender'), mortechController.searchRates);

module.exports = router;
