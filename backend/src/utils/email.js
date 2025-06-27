const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Email utility for sending various types of emails
 */
class Email {
  constructor() {
    console.log('Initializing Email Service with the following config:');
    console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`- EMAIL_USERNAME: ${process.env.EMAIL_USERNAME ? '(set)' : '(not set)'}`);
    console.log(`- EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '(set)' : '(not set)'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    
    try {
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.error('ERROR: Missing email configuration environment variables');
        logger.error('Missing required email configuration variables');
      }
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '2525'),
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        },
        // For debugging connection issues
        debug: true,
        logger: true,
        secure: false, // Disable TLS - set to true if using TLS
        tls: {
          rejectUnauthorized: false // Accept all certificates - set to true for production
        }
      });
      console.log('Email transporter created successfully');
    } catch (error) {
      console.error('ERROR creating email transporter:', error);
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.text - Plain text content
   * @param {String} options.html - HTML content (optional)
   */
  async send(options) {
    try {
      console.log(`\n===== SENDING EMAIL =====`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Email Text Content Preview:', options.text.substring(0, 100) + '...');
      
      if (!this.transporter) {
        console.error('ERROR: Email transporter not initialized');
        throw new Error('Email transporter not initialized');
      }
      
      // Check SMTP configuration
      console.log('Verifying SMTP connection...');
      await this.verifyConnection();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Loan App System" <noreply@loanappsystem.com>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || null
      };
      
      console.log('Sending email with options:', JSON.stringify({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      }));
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', JSON.stringify(result, null, 2));
      // Only show preview URL if it's using Ethereal
      if (result && result.envelope && result.envelope.from && result.envelope.from.includes('ethereal.email')) {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      } else if (process.env.EMAIL_HOST?.includes('mailtrap.io')) {
        console.log(`Check Mailtrap inbox: https://mailtrap.io/inboxes`);
      }
      logger.info(`Email sent to ${options.to}, subject: ${options.subject}`);
      
      return result;
    } catch (error) {
      console.error('ERROR sending email:', error);
      logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      const result = await this.transporter.verify();
      console.log('SMTP connection verified:', result);
      return result;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      throw error;
    }
  }

  /**
   * Send a milestone deadline notification
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {Object} options.milestone - Milestone data
   * @param {Object} options.loan - Loan data
   */
  async sendMilestoneDeadlineNotification(options) {
    try {
      console.log('\n===== PREPARING MILESTONE NOTIFICATION EMAIL =====');
      console.log(`Milestone: ${options.milestone.name}`);
      console.log(`Milestone deadline: ${new Date(options.milestone.deadlineDate).toISOString()}`);
      console.log(`Sending to: ${options.to}`);
      
      // IMPORTANT: Always recalculate the time until deadline to ensure accuracy
      console.log('Recalculating time until deadline with current time to ensure accuracy');
      const deadlineDate = new Date(options.milestone.deadlineDate);
      const now = new Date();
      
      // Calculate the precise hours until deadline (or since it passed)
      const hoursUntilDeadline = Math.round((deadlineDate - now) / (1000 * 60 * 60) * 10) / 10;
      const isOverdue = now > deadlineDate;
      
      // Generate a fresh time description
      const timeDescription = isOverdue 
        ? `is ${Math.abs(hoursUntilDeadline).toFixed(1)} hours overdue` 
        : `is due in ${hoursUntilDeadline.toFixed(1)} hours`;
      
      console.log(`Freshly calculated time description: ${timeDescription}`);
      console.log(`Deadline date used: ${deadlineDate.toISOString()}`);
      console.log(`Current time used: ${now.toISOString()}`);
      console.log(`Is milestone overdue: ${isOverdue}`);
      
      // Check if the deadline is today (ignoring time)
      const isToday = deadlineDate.getFullYear() === now.getFullYear() &&
                     deadlineDate.getMonth() === now.getMonth() &&
                     deadlineDate.getDate() === now.getDate();
      
      console.log(`Deadline date: ${deadlineDate.toISOString()}`);
      console.log(`Current date: ${now.toISOString()}`);
      console.log(`Is deadline today: ${isToday}`);
      
      // Set deadline text based on date checks
      let deadlineText = timeDescription;
      if (isToday && !isOverdue) {
        deadlineText = 'is due TODAY';
        console.log('Setting special deadline text for today:', deadlineText);
      }
      
      const subject = isOverdue
        ? `[URGENT - OVERDUE] Milestone "${options.milestone.name}" for loan ${options.loan.loanNumber || options.loan._id}`
        : `[Deadline Alert] Milestone "${options.milestone.name}" ${deadlineText}`;
      
      console.log(`Email subject: ${subject}`);
      
      // Format due date information
      const formattedDueDate = new Date(options.milestone.deadlineDate).toLocaleString();
      
      // Create appropriate context message based on milestone status
      let contextMessage;
      if (isOverdue) {
        contextMessage = `This milestone is now <strong>overdue</strong>. Immediate attention is required.`;
      } else if (isToday) {
        contextMessage = `This milestone is due <strong>TODAY</strong>. Urgent attention is required.`;
      } else if (options.milestone.status === 'in_progress') {
        contextMessage = `This milestone is currently in progress but the deadline is approaching.`;
      } else {
        contextMessage = `This milestone needs your attention before the deadline.`;
      }
      
      // Determine appropriate color for the alert box
      const alertColor = isOverdue ? '#dc3545' : isToday ? '#FF6600' : '#f0ad4e';
      const alertBgColor = isOverdue ? '#f8d7da' : isToday ? '#fff3cd' : '#fcf8e3';
      
      // Get borrower name if available in loan data
      const borrowerName = options.loan.borrower && typeof options.loan.borrower === 'object' && options.loan.borrower.name
        ? options.loan.borrower.name
        : 'Borrower';
      
      console.log('Creating email content...');
      
      const text = `
Dear Lender,

${isOverdue ? 'URGENT: ' : isToday ? 'ATTENTION REQUIRED TODAY: ' : ''}This is a notification that the milestone "${options.milestone.name}" for loan ${options.loan.loanNumber || options.loan._id} ${deadlineText}.

Milestone: ${options.milestone.name}
Description: ${options.milestone.description || 'No description provided'}
Due Date: ${formattedDueDate}
Loan: ${options.loan.loanNumber || options.loan._id}
Borrower: ${borrowerName}
Status: ${options.milestone.status.charAt(0).toUpperCase() + options.milestone.status.slice(1)}

${isOverdue ? 'This milestone is now OVERDUE. Immediate attention is required.' : isToday ? 'This milestone is due TODAY. Urgent attention is required.' : 'Please take action before the deadline.'}

Please log into the system to review and take appropriate action.

This is an automated message from the Loan Application System.
`;

      const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 3px solid ${alertColor};">
    <h2 style="margin: 0; color: #333;">${isOverdue ? 'URGENT: ' : isToday ? 'DUE TODAY: ' : ''}Milestone Deadline Alert</h2>
  </div>
  
  <div style="padding: 20px;">
    <p>Dear Lender,</p>
    <p>This is a notification that the milestone <strong>"${options.milestone.name}"</strong> for loan <strong>${options.loan.loanNumber || options.loan._id}</strong> ${deadlineText}.</p>
    
    <div style="margin: 20px 0; padding: 15px; border-left: 4px solid ${alertColor}; background-color: ${alertBgColor};">
      <p><strong>Milestone:</strong> ${options.milestone.name}</p>
      <p><strong>Description:</strong> ${options.milestone.description || 'No description provided'}</p>
      <p><strong>Due Date:</strong> ${formattedDueDate}</p>
      <p><strong>Loan:</strong> ${options.loan.loanNumber || options.loan._id}</p>
      <p><strong>Borrower:</strong> ${borrowerName}</p>
      <p><strong>Status:</strong> ${options.milestone.status.charAt(0).toUpperCase() + options.milestone.status.slice(1)}</p>
    </div>
    
    <p style="font-weight: ${isOverdue || isToday ? 'bold' : 'normal'}; color: ${isOverdue ? '#dc3545' : isToday ? '#FF6600' : '#333'};">
      ${contextMessage}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/lender/milestones" 
         style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
         Review Milestone
      </a>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
      This is an automated message from the Loan Application System.<br>
      Please do not reply to this email.<br>
      Sent on: ${new Date().toLocaleString()}
    </p>
  </div>
</div>
`;

      console.log('Email content prepared, sending email...');
      
      // Call the send method with detailed options
      return await this.send({
        to: options.to,
        subject,
        text,
        html
      });
    } catch (error) {
      console.error('ERROR preparing or sending milestone notification:', error);
      logger.error(`Error sending milestone notification: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new Email();
