const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const controller = require('../controllers/creditVendorCredential.controller');

// All routes require authentication
router.use(authenticate);
router.use(authorize('lender', 'company'));

// CRUD
router.post('/', controller.createCredential);
router.put('/:id', controller.updateCredential);
router.delete('/:id', controller.deleteCredential);

// Fetch by company
router.get('/company/:companyId', controller.getCompanyCredentials);

router.get('/lender/:lenderUserId', controller.getLenderEffectiveCredentials);

module.exports = router;


