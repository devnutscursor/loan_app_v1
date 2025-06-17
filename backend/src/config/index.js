const authConfig = require('./auth');
const dbConfig = require('./database');

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME || '',
    pass: process.env.EMAIL_PASSWORD || ''
  },
  from: process.env.EMAIL_FROM || '"Loan App" <noreply@loanapp.com>'
};

// Export all configurations
module.exports = {
  auth: authConfig,
  db: dbConfig,
  email: emailConfig,
  
  // Server settings
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // File upload settings
  uploads: {
    path: process.env.UPLOAD_PATH || './uploads'
  }
};
