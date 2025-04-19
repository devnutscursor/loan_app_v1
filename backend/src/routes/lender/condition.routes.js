const express = require('express');
const router = express.Router();
const conditionController = require('../../controllers/lender/condition.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// Apply authentication and lender role authorization to all routes
router.use(authenticate);
router.use(authorize(['lender', 'admin']));

// Loan condition routes
router.get('/loans/:loanId/conditions', conditionController.getLoanConditions);
router.post('/loans/:loanId/conditions', conditionController.createCondition);
router.post('/loans/:loanId/conditions/fromLibrary', conditionController.addConditionsFromLibrary);
router.patch('/conditions/:conditionId/status', conditionController.updateConditionStatus);
router.post('/conditions/:conditionId/notes', conditionController.addConditionNote);
router.delete('/conditions/:conditionId', conditionController.deleteCondition);

// Conditions Dashboard routes
router.get('/conditions', conditionController.getAllConditions);
router.get('/conditions/tags', conditionController.getConditionTags);

// Condition library routes
router.get('/conditions/library', conditionController.getConditionLibrary);
router.post('/conditions/library', conditionController.createLibraryItem);
router.delete('/conditions/library/:itemId', conditionController.deleteLibraryItem);

module.exports = router;
