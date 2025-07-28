const config = require('./src/config');

console.log('🔍 Current Email Configuration:');
console.log('================================');
console.log(`Host: ${config.email.host}`);
console.log(`Port: ${config.email.port}`);
console.log(`Secure: ${config.email.secure}`);
console.log(`From: ${config.email.from}`);
console.log(`Auth User: ${config.email.auth.user || 'NOT SET'}`);
console.log(`Auth Pass: ${config.email.auth.pass ? 'SET' : 'NOT SET'}`);

console.log('\n🌍 Environment Variables:');
console.log('========================');
console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
console.log(`EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'NOT SET'}`);
console.log(`EMAIL_USERNAME: ${process.env.EMAIL_USERNAME || 'NOT SET'}`);
console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'}`);
console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);

console.log('\n💡 Recommendation:');
console.log('==================');
if (config.email.host === 'smtp.mailtrap.io') {
  console.log('❌ Currently using Mailtrap (testing service)');
  console.log('✅ You need to configure Mailgun for production emails');
  console.log('\nTo fix this, set these environment variables:');
  console.log('EMAIL_HOST=smtp.mailgun.org');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_SECURE=false');
  console.log('EMAIL_USERNAME=your-mailgun-username');
  console.log('EMAIL_PASSWORD=your-mailgun-password');
  console.log('EMAIL_FROM=noreply@mg.syncly360.com');
} else {
  console.log('✅ Email configuration looks correct');
} 