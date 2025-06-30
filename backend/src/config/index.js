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

// AWS configuration from environment variables
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.AWS_S3_BUCKET || 'loan-app-documents'
};

// Storage configuration
const storageConfig = {
  useS3: process.env.USE_S3 === 'true' || false,
  uploadPath: process.env.UPLOAD_PATH || './uploads'
};

// Export all configurations
module.exports = {
  auth: authConfig,
  db: dbConfig,
  email: emailConfig,
  aws: awsConfig,
  storage: storageConfig,
  
  // Server settings
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // File upload settings
  uploads: {
    path: process.env.UPLOAD_PATH || './uploads'
  }
};
