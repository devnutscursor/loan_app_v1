const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/fileHandler');

// All routes are protected with auth middleware
router.use(protect);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get messages between current user and a borrower
router.get('/:borrowerId', messageController.getMessages);

// Send a message to a borrower/lender
router.post('/send', upload.array('attachments', 10), messageController.sendMessage);

// Upload attachment
router.post('/upload-attachment', upload.single('attachment'), messageController.uploadAttachment);

// Get unread message count
router.get('/unread/count', messageController.getUnreadCount);

module.exports = router;
