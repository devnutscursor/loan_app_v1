require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const logger = require('./utils/logger');
const scheduler = require('./utils/scheduler');
const milestoneNotificationService = require('./services/milestoneNotification.service');
const { connectDatabase } = require('./config/database');

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory at: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
} else {
  console.log(`Uploads directory exists at: ${uploadsDir}`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to MongoDB
connectDatabase();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL,
          'https://loan-app-frontend-taupe.vercel.app',
          'https://loan-app-frontend-taupe.vercel.app/',
          'https://loan-app-system.vercel.app'
        ].filter(Boolean)
      : ['http://localhost:3000', process.env.FRONTEND_URL, '*'].filter(Boolean),
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  // Join a room based on user ID
  socket.on('join', (userId) => {
    socket.join(userId);
    logger.info(`User ${userId} joined their room`);
    socket.join(`borrower-${userId}`);
    logger.info(`User ${userId} also joined room borrower-${userId}`);
  });
  
  // Handle new messages
  socket.on('new_message', (message) => {
    // Broadcast to recipient
    if (message.recipient) {
      io.to(message.recipient).emit('receive_message', message);
    }
  });
  
  // Handle document request notifications
  socket.on('document_request', (data) => {
    // Broadcast to borrower
    if (data.borrowerId) {
      logger.info(`[SOCKET] Emitting document-request to ${data.borrowerId} and borrower-${data.borrowerId}`);
      io.to(data.borrowerId).emit('document-request', data);
      io.to(`borrower-${data.borrowerId}`).emit('document-request', data);
    }
  });
  
  // Also handle the hyphenated version for consistency
  socket.on('document-request', (data) => {
    // Broadcast to borrower
    if (data.borrowerId) {
      logger.info(`[SOCKET] Emitting document-request to ${data.borrowerId} and borrower-${data.borrowerId}`);
      io.to(data.borrowerId).emit('document-request', data);
      io.to(`borrower-${data.borrowerId}`).emit('document-request', data);
    }
  });
  
  // Handle document status change notifications
  socket.on('document_status', (data) => {
    // Broadcast to borrower
    if (data.borrowerId) {
      logger.info(`[SOCKET] Emitting document-status to ${data.borrowerId} and borrower-${data.borrowerId}`);
      io.to(data.borrowerId).emit('document-status', data);
      io.to(`borrower-${data.borrowerId}`).emit('document-status', data);
    }
  });
  
  // Also handle the hyphenated version for consistency
  socket.on('document-status', (data) => {
    // Broadcast to borrower
    if (data.borrowerId) {
      logger.info(`[SOCKET] Emitting document-status to ${data.borrowerId} and borrower-${data.borrowerId}`);
      io.to(data.borrowerId).emit('document-status', data);
      io.to(`borrower-${data.borrowerId}`).emit('document-status', data);
    }
  });
  
  // Handle direct to room events (for testing)
  socket.on('direct_to_room', (data) => {
    if (data.room && data.eventName && data.data) {
      logger.info(`[SOCKET] Direct emit to room ${data.room}: ${data.eventName}`);
      io.to(data.room).emit(data.eventName, data.data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible from other modules
app.set('io', io);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  
  // Start the milestone deadline notification scheduler
  // Check for approaching deadlines every hour
  scheduler.startTask(
    'milestoneDeadlineChecker',
    () => milestoneNotificationService.checkMilestoneDeadlines(),
    60 * 60 * 1000 // 1 hour
  );
  logger.info('Milestone deadline notification scheduler started');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// For Graceful shutdown in SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

module.exports = { app, io };
