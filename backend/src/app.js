const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
  
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
const creditReportRoutes = require('./routes/creditReport.routes');
const creditVendorCredentialRoutes = require('./routes/creditVendorCredential.routes');
const consentRoutes = require('./routes/consent.routes');
const consentEmailRoutes = require('./routes/consentEmail.routes');
const noteRoutes = require('./routes/note.routes');
const testRoutes = require('./routes/test.routes'); // Import test routes
const mortechRoutes = require('./routes/mortech.routes');

// Import error handlers
const { errorConverter, errorHandler, notFound } = require('./middleware/error.middleware');
const ApiError = require('./utils/apiError');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "localhost:*", "https:"],
      connectSrc: ["'self'", "localhost:*", "https:", "wss:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      frameAncestors: ["'self'", "localhost:*", process.env.FRONTEND_URL].filter(Boolean)
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Enable CORS – allow FRONTEND_URL and optional CORS_ORIGINS (comma-separated)
const corsOriginsList = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((u) => u.trim()).filter(Boolean)
  : [];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const baseAllowed = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL, ...corsOriginsList]
      : ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL, ...corsOriginsList];
    const allowedOrigins = baseAllowed.filter(Boolean);

    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map((url) => url.replace(/\/$/, ''));

    if (normalizedAllowed.includes(normalizedOrigin) || normalizedAllowed.includes('*')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
}));

// Development logging with Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 600, // limit each IP to 200 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression middleware
app.use(compression());

// Check if we should use S3 or local storage
const USE_S3 = process.env.USE_S3 === 'true' || false;

if (!USE_S3) {
  // Only serve static files from uploads directory if not using S3
  app.use('/uploads', (req, res, next) => {
    // Set Cache-Control headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400');
    // Allow cross-origin access to the files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *");
    
    // Set appropriate content types for different file extensions
    const filePath = req.url.split('?')[0];
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (['.xlsx', '.xls'].includes(ext)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else if (['.doc', '.docx'].includes(ext)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  }, express.static(path.resolve(__dirname, '../uploads'), {
    setHeaders: (res, path) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('X-Frame-Options', 'ALLOWALL');
      res.set('Content-Security-Policy', "frame-ancestors 'self' *");
    }
  }));
}

// Create a specific route to check if uploads directory is accessible
app.get('/api/check-uploads', (req, res) => {
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    res.json({ 
      success: true, 
      message: 'Uploads directory exists', 
      path: uploadsDir,
      files: files
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Uploads directory does not exist',
      path: uploadsDir
    });
  }
});

// Debug route to check specific file
app.get('/api/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      exists: true,
      filename,
      path: filePath,
      size: stats.size,
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8).slice(-3)
    });
  } else {
    res.json({
      exists: false,
      filename,
      path: filePath
    });
  }
});

// Add a proxy route for images to avoid CORS issues
app.get('/api/image-proxy/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({
      error: 'File not found',
      filename,
      path: filePath
    });
  }
});

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
app.use('/api/v1/credit-report', creditReportRoutes);
app.use('/api/v1/credit-vendor-credentials', creditVendorCredentialRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/consent-email', consentEmailRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/mortech', mortechRoutes);
app.use('/api/v1/test', testRoutes); // Register test routes

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
