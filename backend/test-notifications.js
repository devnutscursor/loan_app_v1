/**
 * Milestone Notification Test Script
 * 
 * This script tests the milestone notification functionality by finding milestones
 * with today's deadline and forcing notifications to be sent.
 */
require('dotenv').config();
const mongoose = require('mongoose');
// Load all models first to avoid MissingSchemaError
require('./src/models/loan.model');
require('./src/models/borrower.model');
require('./src/models/lender.model');

const Milestone = require('./src/models/milestone.model');
const User = require('./src/models/user.model');
const Loan = mongoose.model('Loan');
const emailService = require('./src/utils/email');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/config/database');

// Function to set all milestone notification flags to false
const resetNotificationFlags = async () => {
  console.log('Resetting notification flags for all milestones...');
  try {
    const result = await Milestone.updateMany(
      { notificationSent: true },
      { notificationSent: false }
    );
    console.log(`Reset ${result.modifiedCount} milestone notification flags`);
  } catch (err) {
    console.error('Error resetting notification flags:', err);
  }
};

// Force sending notification for all milestones with today's deadline
const testTodayNotifications = async () => {
  try {
    console.log('=== MILESTONE NOTIFICATION TEST SCRIPT ===');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Looking for milestones with deadlines between ${today.toISOString()} and ${tomorrow.toISOString()}`);
    
    // Find milestones with deadlines TODAY (regardless of notification status)
    // Use deeper population to ensure we get all the required data
    const todayMilestones = await Milestone.find({
      deadlineDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate({
      path: 'loan',
      populate: [
        { 
          path: 'lender',
          populate: { path: 'user', model: 'User' } // Get User from Lender
        },
        { 
          path: 'assignedLoanOfficer', 
          model: 'User' 
        }
      ]
    });
    
    console.log(`Found ${todayMilestones.length} milestones with deadline TODAY`);
    
    if (todayMilestones.length === 0) {
      console.log('\nNo milestones found with today\'s deadline.');
      console.log('Creating a test milestone with today\'s deadline...');
      
      // Create a test milestone with today's deadline
      const loans = await Loan.find().limit(1);
      if (loans.length === 0) {
        console.error('No loans found in the database to create test milestone');
        return;
      }
      
      const testMilestone = new Milestone({
        loan: loans[0]._id,
        name: 'Test Deadline Milestone',
        description: 'This is a test milestone with today\'s deadline',
        order: 999,
        status: 'pending',
        startDate: new Date(),
        deadlineDate: new Date(),
        notificationSent: false
      });
      
      await testMilestone.save();
      console.log(`Created test milestone with ID: ${testMilestone._id}`);
      
      // Reload with populated data
      const populatedMilestone = await Milestone.findById(testMilestone._id).populate({
        path: 'loan',
        populate: { path: 'lender', model: 'User' }
      });
      
      todayMilestones.push(populatedMilestone);
    }
    
    // Reset notification flags
    for (const milestone of todayMilestones) {
      milestone.notificationSent = false;
      await milestone.save();
    }
    
    // Process each milestone and send notification
    let successCount = 0;
    for (const milestone of todayMilestones) {
      console.log(`\nProcessing milestone: ${milestone._id} - ${milestone.name}`);
      console.log(`Deadline: ${new Date(milestone.deadlineDate).toISOString()}`);
      
      if (!milestone.loan) {
        console.error(`ERROR: Milestone ${milestone._id} has no associated loan`);
        continue;
      }
      
      // Get lender email
      let lenderEmail;
      
      // From populated lender user
      if (milestone.loan.lender && 
          typeof milestone.loan.lender === 'object' && 
          milestone.loan.lender.user &&
          typeof milestone.loan.lender.user === 'object' &&
          milestone.loan.lender.user.email) {
        lenderEmail = milestone.loan.lender.user.email;
        console.log(`Using populated lender's user email: ${lenderEmail}`);
      } 
      // Try fetching lender and its user
      else if (milestone.loan.lender) {
        const lenderId = typeof milestone.loan.lender === 'object' ? milestone.loan.lender._id : milestone.loan.lender;
        const Lender = mongoose.model('Lender');
        const lender = await Lender.findById(lenderId).populate('user');
        
        if (lender && lender.user && lender.user.email) {
          lenderEmail = lender.user.email;
          console.log(`Found lender's user email: ${lenderEmail}`);
        } else {
          console.log('No lender email found');
        }
      }
      
      // If no lender email found, use fallback email from environment
      if (!lenderEmail) {
        if (process.env.NOTIFICATION_FALLBACK_EMAIL) {
          lenderEmail = process.env.NOTIFICATION_FALLBACK_EMAIL;
          console.log(`Using fallback email from environment: ${lenderEmail}`);
        } else {
          console.error('No lender email found and no fallback email configured in environment');
          continue; // Skip this milestone if no email available
        }
      }
      
      // Calculate time description
      const now = new Date();
      const deadline = new Date(milestone.deadlineDate);
      const hoursLeft = Math.round((deadline - now) / (1000 * 60 * 60) * 10) / 10;
      
      const timeDescription = now > deadline
        ? `is ${Math.abs(hoursLeft).toFixed(1)} hours overdue`
        : `is due in ${hoursLeft.toFixed(1)} hours`;
      
      // Send email notification
      try {
        console.log(`Sending notification to ${lenderEmail} for milestone "${milestone.name}"`);
        
        const emailResult = await emailService.sendMilestoneDeadlineNotification({
          to: lenderEmail,
          milestone: {
            ...milestone._doc,
            timeDescription
          },
          loan: milestone.loan
        });
        
        console.log('Email sent successfully!');
        console.log(`Message ID: ${emailResult.messageId}`);
        
        // Mark notification as sent
        milestone.notificationSent = true;
        await milestone.save();
        
        successCount++;
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
    
    console.log(`\n=== TEST COMPLETE ===`);
    console.log(`Successfully sent ${successCount} of ${todayMilestones.length} notifications`);
  } catch (error) {
    console.error('Error in test script:', error);
  }
};

// Connect to database and run tests
const runTests = async () => {
  try {
    await connectDatabase();
    await resetNotificationFlags();
    await testTodayNotifications();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTests();
