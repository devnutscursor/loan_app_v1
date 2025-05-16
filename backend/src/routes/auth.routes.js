const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/register/borrower', authController.registerBorrower);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.post('/update-password', authController.updatePassword);
router.post('/logout', authController.logout);

module.exports = router;
