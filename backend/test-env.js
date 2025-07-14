require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME ? '(set)' : '(not set)');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(set)' : '(not set)');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '(set)' : '(not set)');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '(set)' : '(not set)');

if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.log('\n❌ EMAIL CREDENTIALS MISSING!');
    console.log('Make sure to restart your server after fixing .env file');
} else {
    console.log('\n✅ EMAIL CREDENTIALS LOADED SUCCESSFULLY!');
}
