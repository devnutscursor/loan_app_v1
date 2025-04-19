const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth');

// Protected routes - require authentication
router.use(authMiddleware.protect);

// Conversation routes
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.getOrCreateConversation);
router.delete('/conversations/:conversationId', messageController.deleteConversation);

// Message routes
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/messages', messageController.sendMessage);
router.patch('/conversations/:conversationId/read', messageController.markAsRead);

module.exports = router;
