const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const APIError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all conversations for a user
 */
exports.getConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const conversations = await Conversation.find({ 
    participants: userId,
    isActive: true 
  })
  .populate({
    path: 'participants',
    select: 'firstName lastName email role profilePicture'
  })
  .populate({
    path: 'lastMessage',
    select: 'content createdAt sender'
  })
  .populate({
    path: 'loan',
    select: 'loanNumber propertyAddress loanType loanAmount'
  })
  .sort({ updatedAt: -1 });
  
  // Get unread count for each conversation
  const conversationsWithUnread = conversations.map(conversation => {
    const unreadInfo = conversation.unreadCountByUser.find(
      item => item.user.toString() === userId
    );
    
    return {
      ...conversation.toObject(),
      unreadCount: unreadInfo ? unreadInfo.count : 0
    };
  });
  
  res.status(200).json({
    status: 'success',
    results: conversationsWithUnread.length,
    data: conversationsWithUnread
  });
});

/**
 * Get or create a conversation
 */
exports.getOrCreateConversation = catchAsync(async (req, res) => {
  const { participantId, loanId } = req.body;
  const userId = req.user.id;
  
  if (!participantId) {
    throw new APIError('Participant ID is required', 400);
  }
  
  // Check if participant exists
  const participant = await User.findById(participantId);
  if (!participant) {
    throw new APIError('Participant not found', 404);
  }
  
  // If loan ID provided, verify the loan
  if (loanId) {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new APIError('Loan not found', 404);
    }
  }
  
  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    loan: loanId || { $exists: false },
    isActive: true
  });
  
  // If not, create new conversation
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, participantId],
      loan: loanId,
      unreadCountByUser: [
        { user: userId, count: 0 },
        { user: participantId, count: 0 }
      ]
    });
    
    // Populate participants and loan
    conversation = await Conversation.findById(conversation._id)
      .populate({
        path: 'participants',
        select: 'firstName lastName email role profilePicture'
      })
      .populate({
        path: 'loan',
        select: 'loanNumber propertyAddress loanType loanAmount'
      });
  }
  
  res.status(200).json({
    status: 'success',
    data: conversation
  });
});

/**
 * Get messages in a conversation
 */
exports.getMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;
  
  // Check if conversation exists and user is a participant
  const conversation = await Conversation.findOne({ 
    _id: conversationId,
    participants: userId,
    isActive: true
  });
  
  if (!conversation) {
    throw new APIError('Conversation not found or you do not have access', 404);
  }
  
  // Get messages with pagination
  const skip = (page - 1) * limit;
  const messages = await Message.find({ conversationId })
    .populate({
      path: 'sender',
      select: 'firstName lastName email role profilePicture'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Mark messages as read
  await Promise.all(
    messages.map(async message => {
      // Only mark others' messages as read
      if (message.sender._id.toString() !== userId) {
        // Check if user has already read the message
        const alreadyRead = message.readBy.some(
          item => item.user.toString() === userId
        );
        
        if (!alreadyRead) {
          message.readBy.push({ user: userId, readAt: new Date() });
          await message.save();
        }
      }
    })
  );
  
  // Reset unread count for this user in the conversation
  const unreadIndex = conversation.unreadCountByUser.findIndex(
    item => item.user.toString() === userId
  );
  
  if (unreadIndex !== -1) {
    conversation.unreadCountByUser[unreadIndex].count = 0;
    await conversation.save();
  }
  
  // Get total count for pagination info
  const totalMessages = await Message.countDocuments({ conversationId });
  
  res.status(200).json({
    status: 'success',
    results: messages.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalMessages / limit),
      totalResults: totalMessages
    },
    data: messages.reverse() // Return in chronological order
  });
});

/**
 * Send a message
 */
exports.sendMessage = catchAsync(async (req, res) => {
  const { conversationId, content, attachments = [] } = req.body;
  const userId = req.user.id;
  
  if (!conversationId || !content) {
    throw new APIError('Conversation ID and content are required', 400);
  }
  
  // Check if conversation exists and user is a participant
  const conversation = await Conversation.findOne({ 
    _id: conversationId,
    participants: userId,
    isActive: true
  });
  
  if (!conversation) {
    throw new APIError('Conversation not found or you do not have access', 404);
  }
  
  // Create the message
  const message = await Message.create({
    conversationId,
    sender: userId,
    content,
    attachments,
    readBy: [{ user: userId, readAt: new Date() }]
  });
  
  // Update conversation's last message and increment unread count for other participants
  conversation.lastMessage = message._id;
  
  // Increment unread count for other participants
  conversation.participants.forEach(participantId => {
    if (participantId.toString() !== userId) {
      const unreadIndex = conversation.unreadCountByUser.findIndex(
        item => item.user.toString() === participantId.toString()
      );
      
      if (unreadIndex !== -1) {
        conversation.unreadCountByUser[unreadIndex].count += 1;
      } else {
        conversation.unreadCountByUser.push({
          user: participantId,
          count: 1
        });
      }
    }
  });
  
  await conversation.save();
  
  // Populate sender information
  const populatedMessage = await Message.findById(message._id).populate({
    path: 'sender',
    select: 'firstName lastName email role profilePicture'
  });
  
  res.status(201).json({
    status: 'success',
    data: populatedMessage
  });
});

/**
 * Mark messages as read
 */
exports.markAsRead = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  
  // Check if conversation exists and user is a participant
  const conversation = await Conversation.findOne({ 
    _id: conversationId,
    participants: userId,
    isActive: true
  });
  
  if (!conversation) {
    throw new APIError('Conversation not found or you do not have access', 404);
  }
  
  // Find all unread messages sent by others
  const messages = await Message.find({
    conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
  
  // Mark each message as read
  await Promise.all(
    messages.map(message => {
      message.readBy.push({ user: userId, readAt: new Date() });
      return message.save();
    })
  );
  
  // Reset unread count for this user in the conversation
  const unreadIndex = conversation.unreadCountByUser.findIndex(
    item => item.user.toString() === userId
  );
  
  if (unreadIndex !== -1) {
    conversation.unreadCountByUser[unreadIndex].count = 0;
    await conversation.save();
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Messages marked as read',
    data: {
      markedCount: messages.length
    }
  });
});

/**
 * Delete a conversation (soft delete)
 */
exports.deleteConversation = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  
  // Check if conversation exists and user is a participant
  const conversation = await Conversation.findOne({ 
    _id: conversationId,
    participants: userId,
    isActive: true
  });
  
  if (!conversation) {
    throw new APIError('Conversation not found or you do not have access', 404);
  }
  
  // Soft delete by setting isActive to false
  conversation.isActive = false;
  await conversation.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Conversation deleted successfully'
  });
});
