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
}

module.exports = new EmailService();
