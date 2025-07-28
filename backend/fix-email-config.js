const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Email Configuration Fix Script');
console.log('================================');

// Check current environment variables
console.log('\n📋 Current Environment Variables:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'NOT SET');
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME || 'NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');

// Provide recommendations
console.log('\n💡 Recommendations:');

if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === 'smtp.mailtrap.io') {
  console.log('❌ You need to configure Mailgun for production emails');
  console.log('\n📝 Create a .env file in the backend directory with:');
  console.log('EMAIL_HOST=smtp.mailgun.org');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_SECURE=false');
  console.log('EMAIL_USERNAME=your-mailgun-username');
  console.log('EMAIL_PASSWORD=your-mailgun-password');
  console.log('EMAIL_FROM=noreply@mg.syncly360.com');
} else if (process.env.EMAIL_HOST === 'smtp.mailgun.org') {
  console.log('✅ Mailgun host is configured correctly');
  
  if (process.env.EMAIL_PORT !== '587') {
    console.log('⚠️  Warning: Mailgun should use port 587, not', process.env.EMAIL_PORT);
  }
  
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Missing Mailgun credentials');
    console.log('Please set EMAIL_USERNAME and EMAIL_PASSWORD in your .env file');
  } else {
    console.log('✅ Mailgun credentials are set');
  }
}

// Test SMTP connection if credentials are available
if (process.env.EMAIL_HOST && process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
  console.log('\n🧪 Testing SMTP connection...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  transporter.verify()
    .then(() => {
      console.log('✅ SMTP connection successful!');
    })
    .catch((error) => {
      console.log('❌ SMTP connection failed:', error.message);
      console.log('Error code:', error.code);
      
      if (error.code === 'EAUTH') {
        console.log('💡 Authentication failed. Check your username and password.');
      } else if (error.code === 'ESOCKET') {
        console.log('💡 Connection failed. Check your host and port settings.');
      }
    });
} else {
  console.log('\n⚠️  Cannot test SMTP connection - missing credentials');
}

console.log('\n📚 For detailed setup instructions, see: EMAIL_SETUP_GUIDE.md'); 