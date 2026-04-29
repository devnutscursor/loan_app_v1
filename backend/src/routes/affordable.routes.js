const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getAffordableStates,
  getAffordableCounties,
  getAffordableEligibility,
  getUsdaEligibility,
} = require('../controllers/affordable.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorize('lender', 'company', 'admin'));

router.get('/states', getAffordableStates);
router.get('/counties', getAffordableCounties);
router.get('/eligibility', getAffordableEligibility);
router.get('/usda-eligibility', getUsdaEligibility);

module.exports = router;

