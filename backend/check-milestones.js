/**
 * Script to manually check for milestone deadlines
 * This can be run directly with: node check-milestones.js
 */

// Load environment variables
require('dotenv').config();

// Connect to database
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

// Import notification service
const milestoneNotificationService = require('./src/services/milestoneNotification.service');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB for milestone check');
    
    // Run the check
    console.log('Starting manual milestone deadline check...');
    milestoneNotificationService
      .checkMilestoneDeadlines()
      .then((result) => {
        console.log('Manual check completed with result:', result);
        
        // Allow time for logs to be written
        setTimeout(() => {
          console.log('Exiting...');
          process.exit(0);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error during manual milestone check:', error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
