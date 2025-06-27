const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getCurrentUser);
// Update current user profile
router.put('/me', userController.updateCurrentUser);

// Alias routes expected by frontend
router.get('/profile', userController.getCurrentUser);
router.put('/profile', userController.updateCurrentUser);

module.exports = router;
