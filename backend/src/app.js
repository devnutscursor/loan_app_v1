const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const borrowerRoutes = require('./routes/borrower.routes');
const loanRoutes = require('./routes/loan.routes');
const lenderRoutes = require('./routes/lender.routes');
const documentRoutes = require('./routes/document.routes');
const companyRoutes = require('./routes/company.routes');
const adminRoutes = require('./routes/admin.routes');
const messageRoutes = require('./routes/message.routes');
const milestoneRoutes = require('./routes/milestone.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const lenderAnalyticsRoutes = require('./routes/lender/analytics.routes');
const userRoutes = require('./routes/user.routes');
const loanTypeRoutes = require('./routes/loanType.routes');
const loanProgramRoutes = require('./routes/loanProgram.routes');
const loanRateRoutes = require('./routes/loanRate.routes');

// Import error handlers
const { errorConverter, errorHandler, notFound } = require('./middleware/error.middleware');
const ApiError = require('./utils/apiError');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Development logging with Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 400, // limit each IP to 200 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression middleware
app.use(compression());

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/borrower', borrowerRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/lenders', lenderRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/lender/analytics', lenderAnalyticsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/loan-types', loanTypeRoutes);
app.use('/api/v1/loan-programs', loanProgramRoutes);
app.use('/api/v1/loan-rates', loanRateRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Loan Application System API',
    version: '1.0.0'
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(errorConverter); // Convert errors to ApiError instances
app.use(errorHandler);  // Handle and respond to errors

module.exports = app;
