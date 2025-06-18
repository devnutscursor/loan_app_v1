/**
 * Script to set a milestone's deadline to today for testing notifications
 * Usage: node set-milestone-today.js <milestoneId>
 */

// Load environment variables
require('dotenv').config();

// Connect to database
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

// Import models
const Milestone = require('./src/models/milestone.model');

// Get milestone ID from command line argument
const milestoneId = process.argv[2];

if (!milestoneId) {
  console.error('Error: Please provide a milestone ID');
  console.log('Usage: node set-milestone-today.js <milestoneId>');
  process.exit(1);
}

console.log(`Going to set deadline to today for milestone: ${milestoneId}`);

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
      console.log(`Current deadline: ${milestone.deadlineDate ? new Date(milestone.deadlineDate).toLocaleString() : 'No deadline set'}`);
      
      // Set today's date with time set to 3 hours from now (to ensure it's within the 24-hour window)
      const today = new Date();
      today.setHours(today.getHours() + 3);
      
      // Update the milestone
      milestone.deadlineDate = today;
      milestone.notificationSent = false; // Reset notification status
      await milestone.save();
      
      console.log(`Updated milestone deadline to: ${new Date(milestone.deadlineDate).toLocaleString()}`);
      console.log(`This milestone should now trigger a notification as it's due within 24 hours.`);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Allow time for logs to be written
      setTimeout(() => {
        console.log('Exiting...');
        mongoose.disconnect();
        process.exit(0);
      }, 1000);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
