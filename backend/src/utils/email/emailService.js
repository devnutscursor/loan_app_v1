const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('../logger');

/**
 * Email Service for sending emails to users
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: config.email.auth,
      secure: config.email.secure // true for 465, false for other ports
    });
  }
  
  /**
   * Send an email
   * @param {Object} options - The email options
   * @param {string} options.to - The recipient email address
   * @param {string} options.subject - The email subject
   * @param {string} options.text - The plain text email content
   * @param {string} options.html - The HTML email content
   * @param {string} options.from - The sender email address (optional)
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendEmail(options) {
    try {
      // First, verify the transporter is properly initialized
      if (!this.transporter) {
        logger.error('Email transporter not initialized!');
        return { success: false, error: 'Email transporter not initialized' };
      }

      // Log SMTP configuration (without credentials)
      logger.info('Email service configuration:', { 
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        from: config.email.from,
        authConfigured: !!config.email.auth.user && !!config.email.auth.pass
      });
      
      const mailOptions = {
        from: options.from || config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || ''
      };
      
      // Log the full mail options except HTML content (could be large)
      const logMailOptions = { ...mailOptions };
      delete logMailOptions.html;
      logger.info('Sending email with options:', logMailOptions);

      // Verify the SMTP connection before sending
      logger.info('Verifying SMTP connection...');
      await new Promise((resolve, reject) => {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.error('SMTP verification failed:', { error: error.message, code: error.code });
            reject(error);
          } else {
            logger.info('SMTP connection verified successfully');
            resolve(success);
          }
        });
      });
      
      // Send the email
      logger.info(`Attempting to send email to ${options.to}`, { subject: options.subject });
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log detailed information about the send result
      logger.info(`Email sent successfully to ${options.to}`, { 
        messageId: info.messageId,
        response: info.response,
        envelope: info.envelope
      });
      
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response,
        envelope: info.envelope 
      };
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}`, { 
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command
      });
      return { success: false, error: error.message, code: error.code };
    }
  }

  /**
   * Send a document request notification email to a borrower
   * @param {Object} options - The notification options
   * @param {string} options.email - The borrower's email address
   * @param {string} options.borrowerName - The borrower's name
   * @param {string} options.loanNumber - The loan number
   * @param {Array<Object>} options.documents - List of requested documents
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendDocumentRequestNotification(options) {
    try {
      const { email, borrowerName, loanNumber, documents } = options;
      
      // Build the document list HTML
      let documentListHtml = '<ul>';
      documents.forEach(doc => {
        documentListHtml += `<li><strong>${doc.title}</strong>: ${doc.description || ''}</li>`;
      });
      documentListHtml += '</ul>';
      
      // Create email content
      const subject = `Document Request for Loan #${loanNumber}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Document Request Notification</h2>
          <p>Hello ${borrowerName || 'Borrower'},</p>
          <p>We need the following document(s) for your loan application #${loanNumber}:</p>
          ${documentListHtml}
          <p>Please log in to your borrower dashboard and upload these documents at your earliest convenience.</p>
          <p>If you have any questions, please contact your loan officer.</p>
          <br>
          <p>Thank you,</p>
          <p><strong>Loan Application System Team</strong></p>
        </div>
      `;
      
      const text = `
        Document Request Notification
        
        Hello ${borrowerName || 'Borrower'},
        
        We need the following document(s) for your loan application #${loanNumber}:
        ${documents.map(doc => `- ${doc.title}: ${doc.description || ''}`).join('\n')}
        
        Please log in to your borrower dashboard and upload these documents at your earliest convenience.
        
        If you have any questions, please contact your loan officer.
        
        Thank you,
        Loan Application System Team
      `;
      
      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error(`Failed to send document request notification email`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a pre-approval letter email to a borrower
   * @param {Object} options - The pre-approval options
   * @param {string} options.email - The borrower's email address
   * @param {string} options.borrowerName - The borrower's full name
   * @param {string} options.loanNumber - The loan number
   * @param {number} options.loanAmount - The approved loan amount
   * @param {string} options.loanType - The type of loan (Purchase, Refinance, etc.)
   * @param {string} options.lenderName - The name of the lending institution
   * @param {string} options.loanOfficerName - The name of the loan officer
   * @param {string} options.loanOfficerEmail - The email of the loan officer
   * @param {string} options.loanOfficerPhone - The phone number of the loan officer
   * @param {Date} options.approvalDate - The date of approval
   * @param {Date} options.expirationDate - The expiration date of the pre-approval
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendPreApprovalLetter(options) {
    try {
      const { 
        email, 
        borrowerName, 
        loanNumber, 
        loanAmount, 
        loanType,
        lenderName,
        loanOfficerName,
        loanOfficerEmail,
        loanOfficerPhone,
        approvalDate,
        expirationDate
      } = options;
      
      // Format dates
      const formattedApprovalDate = new Date(approvalDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedExpirationDate = new Date(expirationDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format loan amount
      const formattedLoanAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(loanAmount);
      
      // Create email content
      const subject = `Pre-Approval Letter for Loan #${loanNumber}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Pre-Approval Letter</h1>
            <p style="color: #64748b; font-size: 14px;">Loan #${loanNumber}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedApprovalDate}</p>
            <p style="margin: 5px 0;"><strong>Borrower:</strong> ${borrowerName}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p>Dear ${borrowerName.split(' ')[0] || 'Borrower'},</p>
            
            <p>Congratulations! We are pleased to inform you that you have been pre-approved for a ${loanType} loan in the amount of ${formattedLoanAmount}.</p>
            
            <p>This pre-approval is based on the information you have provided and is subject to:</p>
            <ul>
              <li>Verification of the information provided in your application</li>
              <li>Satisfactory property appraisal and title examination</li>
              <li>No significant changes to your credit, employment, or financial situation</li>
              <li>Final underwriting approval</li>
            </ul>
            
            <p>This pre-approval is valid until <strong>${formattedExpirationDate}</strong>.</p>
            
            <p>Please note that this is not a commitment to lend and does not guarantee that you will receive a loan. A final loan approval will be issued once all verification processes are complete.</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #334155;">Lender Information</h3>
            <p style="margin: 5px 0;"><strong>Lending Institution:</strong> ${lenderName}</p>
            <p style="margin: 5px 0;"><strong>Loan Officer:</strong> ${loanOfficerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${loanOfficerEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${loanOfficerPhone}</p>
          </div>
          
          <div style="font-size: 14px; color: #64748b; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            <p>If you have any questions or need further assistance, please don't hesitate to contact your loan officer.</p>
            <p>Thank you for choosing ${lenderName} for your mortgage needs.</p>
          </div>
        </div>
      `;
      
      const text = `
PRE-APPROVAL LETTER
Loan #${loanNumber}

Date: ${formattedApprovalDate}
Borrower: ${borrowerName}

Dear ${borrowerName.split(' ')[0] || 'Borrower'},

Congratulations! We are pleased to inform you that you have been pre-approved for a ${loanType} loan in the amount of ${formattedLoanAmount}.

This pre-approval is based on the information you have provided and is subject to:
- Verification of the information provided in your application
- Satisfactory property appraisal and title examination
- No significant changes to your credit, employment, or financial situation
- Final underwriting approval

This pre-approval is valid until ${formattedExpirationDate}.

Please note that this is not a commitment to lend and does not guarantee that you will receive a loan. A final loan approval will be issued once all verification processes are complete.

LENDER INFORMATION
Lending Institution: ${lenderName}
Loan Officer: ${loanOfficerName}
Email: ${loanOfficerEmail}
Phone: ${loanOfficerPhone}

If you have any questions or need further assistance, please don't hesitate to contact your loan officer.

Thank you for choosing ${lenderName} for your mortgage needs.
      `;
      
      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error(`Failed to send pre-approval letter email`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an email verification email
   * @param {Object} options - The verification options
   * @param {string} options.email - The user's email address
   * @param {string} options.name - The user's full name
   * @param {string} options.token - The verification token
   * @param {string} options.baseUrl - The base URL for the verification link
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendEmailVerification(options) {
    try {
      const { email, name, token, baseUrl } = options;
      
      // Create verification URL
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
      
      // Create email content
      const subject = 'Email Verification - Loan App';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Verify Your Email</h1>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p>Dear ${name.split(' ')[0] || 'User'},</p>
            
            <p>Thank you for registering with our Loan Application System. To complete your registration and ensure the security of your account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
            </div>
            
            <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
            <p style="background-color: #f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all;">${verificationUrl}</p>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you did not create an account with us, please disregard this email.</p>
          </div>
          
          <div style="font-size: 14px; color: #64748b; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>Thank you for choosing our Loan Application System.</p>
          </div>
        </div>
      `;
      
      const text = `
VERIFY YOUR EMAIL

Dear ${name.split(' ')[0] || 'User'},

Thank you for registering with our Loan Application System. To complete your registration and ensure the security of your account, please verify your email address by visiting the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you did not create an account with us, please disregard this email.

This is an automated email. Please do not reply to this message.

Thank you for choosing our Loan Application System.
      `;
      
      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error(`Failed to send email verification email`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {Object} options - Reset email options
   * @param {string} options.email - The recipient email address
   * @param {string} options.name - The recipient name
   * @param {string} options.token - The reset token
   * @param {string} options.baseUrl - The base URL for the reset link
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendPasswordResetEmail(options) {
    try {
      const resetUrl = `${options.baseUrl}/reset-password/${options.token}`;
      
      const subject = 'Password Reset';
      const text = `Hello ${options.name},\n\nYou requested to reset your password. Please click on the following link to set a new password: ${resetUrl}\n\nIf you did not request this reset, please ignore this email.\n\nThanks,\nLoan App Team`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4361ee;">Password Reset</h2>
          <p>Hello ${options.name},</p>
          <p>You requested to reset your password. Please click on the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4361ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can also click on this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this reset, please ignore this email.</p>
          <p>Thanks,<br>Loan App Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `;

      // Send the email using the sendEmail method
      return await this.sendEmail({
        to: options.email,
        subject,
        text,
        html
      });
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send test email for debugging
   * @param {Object} options - Test email options
   * @param {string} options.email - The recipient email address
   * @param {string} options.name - The recipient name
   * @param {string} options.token - The verification token
   * @param {string} options.baseUrl - The base URL for the verification link
   * @returns {Promise<Object>} - The result of sending the email
   */
  async sendTestEmail(options) {
    try {
      const verificationUrl = `${options.baseUrl}/verify-email/${options.token}`;
      
      const subject = 'Test Email - Email Verification';
      const text = `Hello ${options.name},\n\nThis is a TEST email. Please verify your email by clicking on the link: ${verificationUrl}\n\nIf you did not create an account, please ignore this email.\n\nThanks,\nLoan App Team`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4361ee;">TEST EMAIL</h1>
          <h2 style="color: #4361ee;">Email Verification</h2>
          <p>Hello ${options.name},</p>
          <p>This is a <strong>TEST email</strong> to verify that our email service is working correctly.</p>
          <p>Please verify your email by clicking on the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4361ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          <p>If the button doesn't work, you can also click on this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Thanks,<br>Loan App Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>TEST EMAIL - Sent at ${new Date().toISOString()}</p>
          </div>
        </div>
      `;

      // Send the email using the sendEmail method
      return await this.sendEmail({
        to: options.email,
        subject,
        text,
        html
      });
    } catch (error) {
      logger.error(`Failed to send test email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
