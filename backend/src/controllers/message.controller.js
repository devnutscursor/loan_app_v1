const Message = require('../models/message.model');
const User = require('../models/user.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    
    if ((!content || content.trim() === '') && (!req.files || !req.files.attachments)) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }
    
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
    
    // Process file uploads if any
    let attachments = [];
    
    if (req.files && req.files.attachments) {
      try {
        const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.resolve(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Process each file
        for (const file of files) {
          try {
            // Generate a unique filename to prevent collisions
            const fileExtension = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const uploadPath = path.join(uploadsDir, fileName);
            
            // Move the file to the uploads directory
            await file.mv(uploadPath);
            
            // Log file information for debugging
            console.log('File saved:', {
              originalName: file.name,
              savedAs: fileName,
              path: uploadPath,
              exists: fs.existsSync(uploadPath)
            });
            
            // Add attachment metadata with absolute URL
            attachments.push({
              url: `/uploads/${fileName}`,
              fileName: file.name,
              fileType: file.mimetype,
              fileSize: file.size
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
      content: content || '',
      attachments
    });
    
    await message.save();
    
    // Populate sender info before returning
    await message.populate('sender', 'firstName lastName email profileImage role');
    
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
    if (!req.files || !req.files.attachment) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.files.attachment;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate a unique filename to prevent collisions
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadPath = path.join(uploadsDir, fileName);
    
    // Move the file to the uploads directory
    await file.mv(uploadPath);
    
    // Log file information for debugging
    console.log('File uploaded:', {
      originalName: file.name,
      savedAs: fileName,
      path: uploadPath,
      exists: fs.existsSync(uploadPath)
    });
    
    // Construct the URL for the frontend
    const fileUrl = `/uploads/${fileName}`;
    
    return res.status(200).json({
      url: fileUrl,
      fileName: file.name,
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
