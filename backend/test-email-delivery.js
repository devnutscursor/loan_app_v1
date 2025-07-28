const emailService = require('./src/utils/email/emailService');
const logger = require('./src/utils/logger');

async function testEmailDelivery() {
  try {
    console.log('🧪 Testing email delivery...');
    
    const testEmail = 'hussnainali50674@gmail.com';
    
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    const result = await emailService.sendEmail({
      to: testEmail,
      subject: 'Test Email - Loan App System',
      text: `This is a test email sent at ${new Date().toISOString()}\n\nIf you receive this, email delivery is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Test Email - Loan App System</h2>
            <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
            <p>If you receive this email, it means:</p>
            <ul>
              <li>✅ Email service is configured correctly</li>
              <li>✅ SMTP connection is working</li>
              <li>✅ Emails are being sent successfully</li>
            </ul>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              This is an automated test email. Please do not reply.
            </p>
          </div>
        </div>
      `
    });
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`⏰ Sent at: ${new Date().toISOString()}`);
      console.log('\n📋 Next steps:');
      console.log('1. Check your inbox (including spam/junk folder)');
      console.log('2. Wait 5-10 minutes for delivery');
      console.log('3. If you don\'t receive it, check your email provider settings');
    } else {
      console.log('❌ Test email failed!');
      console.log(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testEmailDelivery(); 