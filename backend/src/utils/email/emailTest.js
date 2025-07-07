/**
 * Email test script to debug SMTP connection issues
 */
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Log email configuration
console.log('Email Configuration:');
console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('- EMAIL_SECURE:', process.env.EMAIL_SECURE);
console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('- EMAIL_USERNAME configured:', !!process.env.EMAIL_USERNAME);
console.log('- EMAIL_PASSWORD configured:', !!process.env.EMAIL_PASSWORD);

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME || '',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

// Function to test SMTP connection with timeout
async function testConnection() {
  return new Promise((resolve) => {
    try {
      console.log('Testing SMTP connection...');
      
      // Set a timeout in case the connection hangs
      const timeout = setTimeout(() => {
        console.error('❌ SMTP connection timed out after 10 seconds');
        resolve(false);
      }, 10000);
      
      transporter.verify()
        .then(result => {
          clearTimeout(timeout);
          console.log('✅ SMTP connection successful!', result);
          resolve(true);
        })
        .catch(error => {
          clearTimeout(timeout);
          console.error('❌ SMTP connection failed:', error.message);
          console.error('Error code:', error.code);
          if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your username and password.');
          } else if (error.code === 'ESOCKET') {
            console.error('Socket connection failed. Please check your host and port settings.');
          }
          resolve(false);
        });
    } catch (error) {
      console.error('❌ Unexpected error during SMTP test:', error);
      resolve(false);
    }
  });
}

// Function to send a test email
async function sendTestEmail() {
  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Test" <test@example.com>',
      to: process.env.TEST_EMAIL || 'test@example.com',
      subject: 'Email Verification Test',
      text: 'This is a test email to verify SMTP configuration is working correctly.',
      html: '<p>This is a test email to verify SMTP configuration is working correctly.</p>'
    });
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectionOk = await testConnection();
  
  if (connectionOk) {
    await sendTestEmail();
  }
}

runTests();
