/**
 * Script to list all milestones with deadlines
 * Usage: node list-milestones.js
 */

// Load environment variables
require('dotenv').config();

// Connect to database
const mongoose = require('mongoose');

// Import models
const Milestone = require('./src/models/milestone.model');
const Loan = require('./src/models/loan.model');
const User = require('./src/models/user.model');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB');
    
    try {
      // Find all milestones with deadlines
      const milestones = await Milestone.find({
        deadlineDate: { $exists: true, $ne: null }
      }).populate({
        path: 'loan',
        populate: { path: 'lender', model: 'User' }
      });
      
      console.log(`\n===== FOUND ${milestones.length} MILESTONES WITH DEADLINES =====\n`);
      
      // Current date for comparison
      const now = new Date();
      
      // Format and display each milestone
      for (const milestone of milestones) {
        const deadline = new Date(milestone.deadlineDate);
        const timeUntilDeadline = (deadline - now) / (1000 * 60 * 60); // in hours
        
        // Calculate deadline status
        let status;
        if (timeUntilDeadline < 0) {
          status = '🔴 OVERDUE';
        } else if (timeUntilDeadline <= 24) {
          status = '🟠 DUE SOON';
        } else {
          status = '🟢 UPCOMING';
        }
        
        // Check if lender email is available
        let lenderInfo = 'No lender info';
        if (milestone.loan && milestone.loan.lender) {
          if (typeof milestone.loan.lender === 'object' && milestone.loan.lender.email) {
            lenderInfo = `${milestone.loan.lender.email}`;
          } else {
            lenderInfo = `Lender ID: ${milestone.loan.lender}`;
          }
        }
        
        console.log(`ID: ${milestone._id}`);
        console.log(`Name: ${milestone.name}`);
        console.log(`Description: ${milestone.description || 'No description'}`);
        console.log(`Status: ${milestone.status.toUpperCase()}`);
        console.log(`Deadline: ${deadline.toLocaleString()}`);
        console.log(`Hours until deadline: ${timeUntilDeadline.toFixed(1)}`);
        console.log(`Deadline status: ${status}`);
        console.log(`Notification sent: ${milestone.notificationSent ? 'YES' : 'NO'}`);
        console.log(`Loan ID: ${milestone.loan ? milestone.loan._id : 'N/A'}`);
        console.log(`Lender: ${lenderInfo}`);
        console.log('\n----------------------------\n');
      }
      
      console.log(`Total milestones with deadlines: ${milestones.length}`);
      console.log(`Upcoming (>24h): ${milestones.filter(m => new Date(m.deadlineDate) - now > 24 * 60 * 60 * 1000).length}`);
      console.log(`Due soon (≤24h): ${milestones.filter(m => {
        const diff = new Date(m.deadlineDate) - now;
        return diff > 0 && diff <= 24 * 60 * 60 * 1000;
      }).length}`);
      console.log(`Overdue: ${milestones.filter(m => new Date(m.deadlineDate) < now).length}`);
      
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
