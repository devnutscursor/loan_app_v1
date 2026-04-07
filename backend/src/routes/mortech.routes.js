const express = require('express');
const mortechController = require('../controllers/mortech.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/search', authorize('lender'), mortechController.searchRates);
router.get('/catalog/products', authorize('lender'), mortechController.catalogProducts);
router.post('/catalog/sync', authorize('lender'), mortechController.catalogSync);

module.exports = router;
