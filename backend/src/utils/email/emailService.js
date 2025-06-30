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
      const mailOptions = {
        from: options.from || config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || ''
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${options.to}`, { messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}`, { error: error.message });
      return { success: false, error: error.message };
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
}

module.exports = new EmailService();
