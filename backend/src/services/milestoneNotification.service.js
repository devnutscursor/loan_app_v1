const mongoose = require('mongoose');
const Milestone = require('../models/milestone.model');
const Loan = require('../models/loan.model');
const User = require('../models/user.model');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

/**
 * Service for handling milestone deadline notifications
 */
class MilestoneNotificationService {
  /**
   * Check for milestones with approaching deadlines and send notifications
   * This runs periodically via the scheduler
   */
  async checkMilestoneDeadlines() {
    try {
      console.log('======= MILESTONE NOTIFICATION CHECK START =======');
      logger.info('Starting milestone deadline check...');
      const now = new Date();
      console.log(`Current server date/time: ${now.toISOString()}`);
      
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      console.log(`24 hours from now: ${twentyFourHoursFromNow.toISOString()}`);
      
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      console.log(`24 hours ago: ${dayAgo.toISOString()}`);
      
      // First, check ALL milestones with deadlines to debug
      const allMilestones = await Milestone.find({
        deadlineDate: { $exists: true, $ne: null }
      });
      
      console.log(`DEBUGGING: Total milestones with deadlines: ${allMilestones.length}`);
      
      // Log each milestone's deadline for debugging
      if (allMilestones.length > 0) {
        console.log('DEBUGGING - All milestone deadlines:');
        allMilestones.forEach(m => {
          // Calculate time until deadline in hours
          const deadline = new Date(m.deadlineDate);
          const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
          
          console.log(`Milestone ID: ${m._id}, Name: ${m.name}, Deadline: ${deadline.toISOString()}, Hours until deadline: ${hoursUntilDeadline.toFixed(2)}, Already notified: ${m.notificationSent}, Status: ${m.status}`);
        });
      }
      
      // Try a more simplified query for today's deadline
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log(`Looking for milestones with deadlines between ${today.toISOString()} and ${tomorrow.toISOString()}`);
      
      // Find milestones with deadlines TODAY (regardless of notification status for debugging)
      const todayMilestones = await Milestone.find({
        deadlineDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $ne: 'completed' }
      });
      
      console.log(`DEBUGGING: Milestones with deadline TODAY: ${todayMilestones.length}`);
      if (todayMilestones.length > 0) {
        console.log('Today\'s milestones:', todayMilestones.map(m => ({
          id: m._id,
          name: m.name,
          deadline: new Date(m.deadlineDate).toISOString(),
          notified: m.notificationSent
        })));
      }
      
      // Now do our actual query for approaching deadlines with improved criteria
      console.log('Running query for milestones needing notification...');
      
      // Find milestones that:
      // 1. Have a deadline within next 24 hours OR are already overdue but not more than 24 hours
      // 2. Have not had a notification sent
      // 3. Are not already completed
      // For milestones due within exactly 24 hours (not more)
      const approachingMilestones = await Milestone.find({
        deadlineDate: { $exists: true, $ne: null },
        notificationSent: false,
        status: { $ne: 'completed' },
        $or: [
          // Due within EXACTLY 24 hours (future) - fixed to ensure only 24hr window
          { 
            deadlineDate: { 
              $gte: now,
              $lte: twentyFourHoursFromNow
            }
          },
          // Recently overdue (past 24 hours)
          { 
            deadlineDate: { 
              $lt: now,
              $gte: dayAgo
            }
          }
        ]
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
      
      console.log(`Found ${approachingMilestones.length} milestones with approaching or overdue deadlines`);
      logger.info(`Found ${approachingMilestones.length} milestones with approaching or overdue deadlines`);
      
      // Log details of each milestone to be notified
      if (approachingMilestones.length > 0) {
        console.log('Milestones to be notified:');
        approachingMilestones.forEach(m => {
          console.log(`ID: ${m._id}, Name: ${m.name}, Deadline: ${new Date(m.deadlineDate).toISOString()}, Loan ID: ${m.loan ? m.loan._id : 'N/A'}, Has populated lender: ${m.loan && m.loan.lender ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('No milestones found that need notification');
      }
      
      // Process each milestone and send notification
      let successCount = 0;
      for (const milestone of approachingMilestones) {
        console.log(`Processing milestone: ${milestone._id} - ${milestone.name}`);
        const result = await this.sendDeadlineNotification(milestone);
        console.log(`Notification result for milestone ${milestone._id}: ${result ? 'SUCCESS' : 'FAILED'}`);
        if (result) successCount++;
      }
      
      console.log(`Successfully sent ${successCount} milestone deadline notifications`);
      logger.info(`Successfully sent ${successCount} milestone deadline notifications`);
      console.log('======= MILESTONE NOTIFICATION CHECK END =======');
      
      return { checked: approachingMilestones.length, notified: successCount };
    } catch (error) {
      console.error('ERROR checking milestone deadlines:', error);
      logger.error('Error checking milestone deadlines:', error);
      return { error: error.message };
    }
  }

  /**
   * Send a notification for a single milestone
   * @param {Object} milestone - Milestone document with populated loan and lender
   */
  async sendDeadlineNotification(milestone) {
    try {
      console.log(`\n----- PROCESSING MILESTONE ${milestone._id} -----`);
      console.log(`Milestone name: ${milestone.name}`);
      console.log(`Milestone deadline: ${new Date(milestone.deadlineDate).toISOString()}`);
      console.log(`Milestone status: ${milestone.status}`);
      console.log(`Notification already sent: ${milestone.notificationSent}`);
      
      if (!milestone.loan) {
        console.error(`ERROR: Milestone ${milestone._id} has no associated loan`);
        logger.error(`Milestone ${milestone._id} has no associated loan`);
        return false;
      }
      
      const loan = milestone.loan;
      console.log(`Associated loan ID: ${loan._id}`);
      
      // Get the lender's email (from populated lender or directly from User model)
      let lenderEmail = null;
      
      // STEP 1: Try to get email from populated lender
      console.log('STEP 1: Checking populated lender with user...');
      if (loan.lender && typeof loan.lender === 'object') {
        console.log(`Found lender object ID: ${loan.lender._id}`);
        
        // Check if the lender has an email field directly
        if (loan.lender.email) {
          lenderEmail = loan.lender.email;
          console.log(`Found lender's email directly: ${lenderEmail}`);
          logger.info(`Using lender's email directly: ${lenderEmail}`);
        }
        // Check if the lender has a populated user field
        else if (loan.lender.user && typeof loan.lender.user === 'object') {
          console.log(`Found lender's user: ${JSON.stringify({
            _id: loan.lender.user._id,
            email: loan.lender.user.email || 'undefined'
          })}`);
          
          if (loan.lender.user.email) {
            lenderEmail = loan.lender.user.email;
            console.log(`Using lender's user email: ${lenderEmail}`);
            logger.info(`Using lender's user email: ${lenderEmail}`);
          } else {
            console.log('Lender\'s user has no email property');
          }
        } else {
          console.log('Lender object found but user not populated properly');
        }
      } else {
        console.log(`Lender not populated properly. Raw value: ${loan.lender}`);
      }
      
      // STEP 2: Try to fetch the lender and its user
      if (!lenderEmail && loan.lender) {
        console.log('STEP 2: Fetching lender and associated user...');
        try {
          const lenderId = typeof loan.lender === 'object' ? loan.lender._id : loan.lender;
          console.log(`Fetching lender with ID: ${lenderId}`);
          
          // Import the Lender model dynamically to avoid circular dependency
          const Lender = mongoose.model('Lender');
          
          // Find lender and populate its user
          const lender = await Lender.findById(lenderId).populate('user');
          console.log(`Lender found: ${lender ? 'Yes' : 'No'}`);
          
          if (lender && lender.user) {
            console.log(`Lender's user details: ${JSON.stringify({
              _id: lender.user._id,
              email: lender.user.email || 'undefined',
              name: `${lender.user.firstName || ''} ${lender.user.lastName || ''}`.trim() || 'unnamed'
            })}`);
            
            if (lender.user.email) {
              lenderEmail = lender.user.email;
              console.log(`Found lender's user email: ${lenderEmail}`);
              logger.info(`Found lender's user email: ${lenderEmail}`);
            } else {
              console.error(`Lender's user found but has no email for loan ${loan._id}`);
            }
          } else {
            console.error(`Lender found but has no associated user for loan ${loan._id}`);
          }
        } catch (err) {
          console.error(`ERROR fetching lender for loan ${loan._id}: ${err.message}`);
          logger.error(`Error fetching lender for loan ${loan._id}: ${err.message}`);
        }
      }
      
      // STEP 3: If we still don't have lender email, try assignedLoanOfficer
      if (!lenderEmail && loan.assignedLoanOfficer) {
        console.log('STEP 3: Trying to get email from assignedLoanOfficer...');
        try {
          const officerId = typeof loan.assignedLoanOfficer === 'object' 
            ? loan.assignedLoanOfficer._id 
            : loan.assignedLoanOfficer;
          
          console.log(`Trying assigned loan officer with ID: ${officerId}`);
          const officer = await User.findById(officerId);
          
          console.log(`Loan officer found: ${officer ? 'Yes' : 'No'}`);
          if (officer) {
            console.log(`Loan officer details: ${JSON.stringify({
              _id: officer._id,
              email: officer.email || 'undefined',
              name: `${officer.firstName || ''} ${officer.lastName || ''}`.trim() || 'unnamed'
            })}`);
          }
          
          if (officer && officer.email) {
            lenderEmail = officer.email;
            console.log(`Using loan officer email: ${lenderEmail}`);
            logger.info(`Using loan officer email: ${lenderEmail}`);
          }
        } catch (err) {
          console.error(`ERROR fetching loan officer: ${err.message}`);
          logger.error(`Error fetching loan officer: ${err.message}`);
        }
      }
      
      // STEP 4: Log an error if no email was found but don't use fallback
      if (!lenderEmail) {
        // Do not use fallback email - this would send to the wrong person
        console.error(`No lender email found for milestone ${milestone._id} (loan: ${loan._id})`);
        logger.error(`No lender email found for milestone ${milestone._id} (loan: ${loan._id})`);
        return false; // Cannot proceed without a valid lender email
      }

      // Check if emailService exists
      if (!emailService || typeof emailService.sendMilestoneDeadlineNotification !== 'function') {
        console.error('Email service or sendMilestoneDeadlineNotification method not found');
        return false;
      }

      // STEP 5: Calculate fresh time until deadline
      console.log('STEP 5: Calculating fresh time until deadline...');
      
      // Explicitly fetch the fresh milestone to ensure we have the latest deadline date
      const freshMilestone = await Milestone.findById(milestone._id);
      const deadlineDate = freshMilestone ? new Date(freshMilestone.deadlineDate) : new Date(milestone.deadlineDate);
      const now = new Date();
      
      // Calculate hours until deadline (or since it passed) with precision
      const hoursUntilDeadline = Math.round((deadlineDate - now) / (1000 * 60 * 60) * 10) / 10;
      const isOverdue = now > deadlineDate;
      
      // Create time description for the email
      const timeDescription = isOverdue 
        ? `is ${Math.abs(hoursUntilDeadline).toFixed(1)} hours overdue` 
        : `is due in ${hoursUntilDeadline.toFixed(1)} hours`;
      
      console.log(`Fresh time calculation: Milestone "${milestone.name}" ${timeDescription}`);
      console.log(`Using deadline date: ${deadlineDate.toISOString()}, Current time: ${now.toISOString()}`);
      
      // STEP 6: Send notification email
      console.log('STEP 6: Sending email notification...');
      try {
        // Send email with fresh time calculation
        // Temporarily disable email sending for debugging/maintenance
        // const emailResult = await emailService.sendMilestoneDeadlineNotification({
        //   to: lenderEmail,
        //   milestone: {
        //     ...(freshMilestone ? freshMilestone._doc : milestone._doc),
        //     timeDescription
        //   },
        //   loan
        // });
        
        // console.log(`Email sending result: ${JSON.stringify(emailResult)}`);
        console.log("Email sending is temporarily disabled.");
        
        // Mark notification as sent
        console.log('Marking notification as sent in the database');
        milestone.notificationSent = true;
        await milestone.save();
        
        console.log(`Successfully sent deadline notification for milestone ${milestone._id} to ${lenderEmail}`);
        logger.info(`Successfully sent deadline notification for milestone ${milestone._id} to ${lenderEmail}`);
        return true;
      } catch (emailError) {
        console.error(`ERROR sending email: ${emailError.message}`);
        return false;
      }
    } catch (error) {
      console.error(`ERROR in sendDeadlineNotification: ${error.message}`);
      console.error(error.stack);
      logger.error(`Error sending notification for milestone ${milestone._id}: ${error.message}`);
      return false;
    }
  }

  /**
   * Reset notification flags for milestones with updated deadlines
   * This is called when a milestone deadline is updated
   * @param {String} milestoneId - ID of the milestone
   */
  async resetNotificationFlag(milestoneId) {
    try {
      const milestone = await Milestone.findById(milestoneId);
      if (milestone) {
        milestone.notificationSent = false;
        await milestone.save();
        logger.info(`Reset notification flag for milestone ${milestoneId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error resetting notification flag for milestone ${milestoneId}:`, error);
      return false;
    }
  }
  
  /**
   * Manually check a specific milestone and send notification regardless of deadline
   * Useful for testing notification functionality
   * @param {String} milestoneId - ID of the milestone to check
   */
  async forceNotification(milestoneId) {
    try {
      logger.info(`Force sending notification for milestone ${milestoneId}`);
      
      // Use deeper population to ensure we have all required data
      const milestone = await Milestone.findById(milestoneId).populate({
        path: 'loan',
        populate: [
          { path: 'lender', model: 'User' },
          { path: 'assignedLoanOfficer', model: 'User' }
        ]
      });
      
      if (!milestone) {
        logger.error(`Milestone ${milestoneId} not found`);
        return { success: false, message: 'Milestone not found' };
      }
      
      // Log details about the milestone and related data
      console.log(`Force notification for milestone: ${milestone.name} (${milestone._id})`);
      console.log(`Loan ID: ${milestone.loan?._id || 'Not found'}`);
      
      if (milestone.loan && milestone.loan.lender) {
        const lender = milestone.loan.lender;
        console.log(`Lender: ${typeof lender === 'object' ? 
          `${lender._id} (${lender.email || 'no email'})` : 
          `ID only: ${lender}`}`);
      } else {
        console.log('No lender found on loan');
      }
      
      // Reset notification flag first
      milestone.notificationSent = false;
      await milestone.save();
      
      // Send notification regardless of deadline time
      const result = await this.sendDeadlineNotification(milestone);
      
      return { 
        success: result, 
        message: result ? 'Notification sent successfully' : 'Failed to send notification',
        milestone: {
          id: milestone._id,
          name: milestone.name,
          deadlineDate: milestone.deadlineDate,
          status: milestone.status
        }
      };
    } catch (error) {
      logger.error(`Error force sending notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MilestoneNotificationService();
