const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadWithErrorHandling } = require('../middleware/upload.middleware');

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

// Profile image upload/delete
router.post('/profile-picture', uploadWithErrorHandling.single('profilePicture', 'profile-images'), userController.uploadProfilePicture);
router.delete('/profile-picture', userController.deleteProfilePicture);

// Email change routes
router.post('/request-email-change', userController.requestEmailChange);

module.exports = router;
