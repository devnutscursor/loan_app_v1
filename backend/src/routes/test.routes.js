const express = require('express');
const router = express.Router();
const emailService = require('../utils/email/emailService');
const logger = require('../utils/logger');

/**
 * Test route for sending verification email
 * @route POST /api/test/email
 * @param {string} email.body.required - Email address
 * @returns {Object} 200 - Success response
 */
router.post('/email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required'
      });
    }
    
    logger.info(`TEST: Sending test verification email to ${email}`);
    
    const emailResult = await emailService.sendTestEmail({
      email,
      name: 'Test User',
      token: '123456789abcdef', // Test token
      baseUrl: 'http://localhost:3001'
    });
    
    if (emailResult.success) {
      logger.info(`TEST: Email sent successfully to ${email}`, emailResult);
      return res.status(200).json({
        status: 'success',
        message: 'Test email sent successfully',
        data: emailResult
      });
    } else {
      logger.error(`TEST: Failed to send email to ${email}`, emailResult);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send test email',
        error: emailResult.error
      });
    }
  } catch (error) {
    logger.error(`TEST: Error in test email endpoint: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
