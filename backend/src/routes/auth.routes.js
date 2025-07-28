const express = require('express');
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/register/borrower', authController.registerBorrower);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Email verification routes
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// Email test route (for debugging)
router.post('/test-email', authController.testEmail);

// Email change verification route (public)
router.get('/verify-email-change/:token', userController.verifyEmailChange);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.post('/update-password', authController.updatePassword);
router.post('/logout', authController.logout);

module.exports = router;
