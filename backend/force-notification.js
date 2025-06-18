/**
 * Script to force send notification for a specific milestone
 * Usage: node force-notification.js <milestoneId>
 */

// Load environment variables
require('dotenv').config();

// Connect to database
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

// Import models
const Milestone = require('./src/models/milestone.model');
const milestoneNotificationService = require('./src/services/milestoneNotification.service');

// Get milestone ID from command line argument
const milestoneId = process.argv[2];

if (!milestoneId) {
  console.error('Error: Please provide a milestone ID');
  console.log('Usage: node force-notification.js <milestoneId>');
  process.exit(1);
}

console.log(`Going to force notification for milestone: ${milestoneId}`);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB');
    
    try {
      // Check if milestone exists
      const milestone = await Milestone.findById(milestoneId);
      if (!milestone) {
        console.error(`Error: Milestone with ID ${milestoneId} not found`);
        process.exit(1);
      }
      
      console.log(`Found milestone: ${milestone.name}`);
      console.log(`Deadline: ${milestone.deadlineDate ? new Date(milestone.deadlineDate).toLocaleString() : 'No deadline set'}`);
      
      // Force notification regardless of deadline
      const result = await milestoneNotificationService.forceNotification(milestoneId);
      console.log('Force notification result:', result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Allow time for logs to be written
      setTimeout(() => {
        console.log('Exiting...');
        mongoose.disconnect();
        process.exit(0);
      }, 2000);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
