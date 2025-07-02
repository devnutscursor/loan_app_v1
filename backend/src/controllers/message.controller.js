const Message = require('../models/message.model');
const User = require('../models/user.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Check if we should use S3 or local storage
const USE_S3 = process.env.USE_S3 === 'true' || false;

// Get conversations for a user (lender or borrower)
exports.getConversations = async (req, res) => {
  try {
  const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'lender') {
      // Find lender details
      const lender = await Lender.findOne({ user: userId });
      
      if (!lender) {
        return res.status(404).json({ message: 'Lender profile not found' });
      }
      
      // Find all borrowers associated with this lender
      const borrowers = await Borrower.find({ lender: lender._id })
        .populate('user', 'firstName lastName email profileImage');
      
      // Get the latest message with each borrower
      const conversations = await Promise.all(
        borrowers.map(async (borrower) => {
          const latestMessage = await Message.findOne({
            lender: lender._id,
            borrower: borrower._id
          })
          .sort({ createdAt: -1 })
          .limit(1);
          
          const unreadCount = await Message.countDocuments({
            lender: lender._id,
            borrower: borrower._id,
            recipient: userId,
            isRead: false
          });
    
    return {
            borrower: {
              _id: borrower._id,
              user: borrower.user
            },
            latestMessage: latestMessage || null,
            unreadCount
          };
        })
      );
      
      return res.status(200).json(conversations);
    } 
    else if (user.role === 'borrower') {
      // Find borrower details
      const borrower = await Borrower.findOne({ user: userId });
      
      if (!borrower) {
        return res.status(404).json({ message: 'Borrower profile not found' });
      }
      
      // Find lender associated with this borrower
      const lender = await Lender.findById(borrower.lender)
        .populate('user', 'firstName lastName email profileImage');
      
      if (!lender) {
        return res.status(404).json({ message: 'Lender not found for this borrower' });
      }
      
      // Get the latest message between borrower and lender
      const latestMessage = await Message.findOne({
        lender: lender._id,
        borrower: borrower._id
      })
      .sort({ createdAt: -1 })
      .limit(1);
      
      const unreadCount = await Message.countDocuments({
        lender: lender._id,
        borrower: borrower._id,
        recipient: userId,
        isRead: false
      });
      
      const conversation = {
        lender: {
          _id: lender._id,
          user: lender.user
        },
        latestMessage: latestMessage || null,
        unreadCount
      };
      
      return res.status(200).json([conversation]);
    }
    
    return res.status(403).json({ message: 'Unauthorized role' });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get messages between a lender and borrower
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { borrowerId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let lenderId, borrower;
    
    if (user.role === 'lender') {
      // Find lender details
      const lender = await Lender.findOne({ user: userId });
      
      if (!lender) {
        return res.status(404).json({ message: 'Lender profile not found' });
      }
      
      lenderId = lender._id;
      borrower = await Borrower.findById(borrowerId).populate('user', 'firstName lastName email profileImage');
      
      // Check if borrower is associated with this lender
      if (!borrower || !borrower.lender.equals(lenderId)) {
        return res.status(403).json({ message: 'Unauthorized to view these messages' });
      }
    } 
    else if (user.role === 'borrower') {
      // Find borrower details
      borrower = await Borrower.findOne({ user: userId });
      
      if (!borrower) {
        return res.status(404).json({ message: 'Borrower profile not found' });
      }
      
      // Check if the requested borrowerId matches the user's borrower profile
      if (!borrower._id.equals(borrowerId)) {
        return res.status(403).json({ message: 'Unauthorized to view these messages' });
      }
      
      lenderId = borrower.lender;
    } 
    else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }
    
    // Find all messages between the lender and borrower
    const messages = await Message.find({
      lender: lenderId,
      borrower: borrowerId
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName email profileImage role');
    
    // Mark messages as read if user is the recipient
    await Message.updateMany(
      {
        lender: lenderId,
        borrower: borrowerId,
        recipient: userId,
        isRead: false
      },
      { isRead: true }
    );
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { borrowerId, content } = req.body;
    
    // Check if we have either content or attachments
    const hasAttachments = req.files && req.files.length > 0;
    const hasContent = content && content.trim() !== '';
    
    if (!hasContent && !hasAttachments) {
      return res.status(400).json({ message: 'Message must contain either text content or attachments' });
    }
    
    console.log('Message request:', {
      userId,
      borrowerId,
      hasContent,
      hasAttachments: hasAttachments ? req.files.length : 0
    });
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let lender, borrower, recipient;
    
    if (user.role === 'lender') {
      // Find lender details
      lender = await Lender.findOne({ user: userId });
      
      if (!lender) {
        return res.status(404).json({ message: 'Lender profile not found' });
      }
      
      // Find borrower
      borrower = await Borrower.findById(borrowerId);
      
      if (!borrower) {
        return res.status(404).json({ message: 'Borrower not found' });
      }
      
      // Check if borrower is associated with this lender
      if (!borrower.lender.equals(lender._id)) {
        return res.status(403).json({ message: 'Unauthorized to message this borrower' });
      }
      
      recipient = borrower.user;
    } 
    else if (user.role === 'borrower') {
      // Find borrower details
      borrower = await Borrower.findOne({ user: userId });
      
      if (!borrower) {
        return res.status(404).json({ message: 'Borrower profile not found' });
      }
      
      // Check if the requested borrowerId matches the user's borrower profile
      if (!borrower._id.equals(borrowerId)) {
        return res.status(403).json({ message: 'Unauthorized to send messages as this borrower' });
      }
      
      // Find lender associated with this borrower
      lender = await Lender.findById(borrower.lender);
      
      if (!lender) {
        return res.status(404).json({ message: 'Lender not found for this borrower' });
      }
      
      recipient = lender.user;
    } 
    else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }
    
    // Process file uploads if any (now handled by multer)
    let attachments = [];
    
    if (hasAttachments) {
      try {
        // Files are already processed by multer and uploaded to S3 or local storage
        for (const file of req.files) {
          try {
            // Log file information for debugging
            console.log('File processed by multer:', {
              originalName: file.originalname,
              savedAs: file.filename,
              url: file.url || file.location,
              mimetype: file.mimetype,
              size: file.size
            });
            
            // Add attachment metadata - use S3 URL or local URL
            attachments.push({
              url: file.url || file.location, // S3 URL or local path
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              s3Key: file.key || null // Store S3 key if available
            });
          } catch (fileError) {
            console.error('Error processing individual file:', fileError);
            // Continue with other files even if one fails
          }
        }
      } catch (filesError) {
        console.error('Error processing file uploads:', filesError);
        return res.status(500).json({ message: 'Error processing file uploads', error: filesError.message });
      }
    }
    
    // Create and save the message
    const message = new Message({
      sender: userId,
      recipient,
      lender: lender._id,
      borrower: borrower._id,
      content: content || '', // Use empty string if no content
      attachments
    });
    
    await message.save();
    
    // Populate sender info before returning
    await message.populate('sender', 'firstName lastName email profileImage role');
    
    // Create audit log entry if the sender is a borrower
    if (user.role === 'borrower') {
      try {
        const AuditLog = require('../models/auditLog.model');
        const borrowerUser = await User.findById(userId).select('firstName lastName');
        
        await AuditLog.create({
          eventType: 'message:received',
          description: `New message received from borrower`,
          userId: userId,
          userRole: 'borrower',
          level: 'info',
          entityType: 'message',
          entityId: message._id,
          metadata: {
            messageId: message._id,
            borrowerId: borrower._id,
            borrowerName: borrowerUser ? `${borrowerUser.firstName} ${borrowerUser.lastName}` : 'Unknown',
            lenderId: lender._id,
            content: content && content.length > 50 ? `${content.substring(0, 50)}...` : content,
            hasAttachments: attachments.length > 0
          }
        });
        
        console.log('Created audit log for new borrower message');
      } catch (auditError) {
        // Don't fail the message send if audit logging fails
        console.error('Failed to create audit log for message:', auditError);
      }
    }
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(recipient.toString()).emit('receive_message', message);
    }
    
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file;
    
    // Log file information for debugging
    console.log('File uploaded via multer:', {
      originalName: file.originalname,
      savedAs: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Construct the URL for the frontend
    const fileUrl = `/uploads/${file.filename}`;
    
    return res.status(200).json({
      url: fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
  const userId = req.user.id;
  
    const unreadCount = await Message.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
