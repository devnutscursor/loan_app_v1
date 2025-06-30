const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const { uploadSingleToS3, uploadArrayToS3 } = require('../services/s3.service');
const logger = require('../utils/logger');

// Check if we should use S3 or local storage - get directly from env
const USE_S3 = process.env.USE_S3 === 'true' || false;

if (USE_S3) {
  logger.info('Using AWS S3 for file storage');
} else {
  logger.info('Using local file storage');
  
  // Create uploads directory if it doesn't exist (for local storage)
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Created uploads directory at: ${uploadDir}`);
  } else {
    logger.info(`Using existing uploads directory at: ${uploadDir}`);
  }
}

// Define allowed file types
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  
  // Compressed archives
  'application/zip',
  'application/x-rar-compressed',
  
  // Allow unknown types for testing (remove in production)
  'application/octet-stream'
];

// Configure storage based on environment
const storage = USE_S3 ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent overwriting
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname) || '.unknown';
    cb(null, `${Date.now()}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  logger.info(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);
  
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Rejected file: ${file.originalname}, mimetype: ${file.mimetype}`);
    // Accept the file but log a warning - this is more permissive for testing
    cb(null, true);
    // In production, use this instead:
    // cb(new ApiError(`Unsupported file type: ${file.mimetype}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`, 400), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (increased for testing)
  }
});

// Add error handling wrapper
const uploadWithErrorHandling = {
  array: (fieldName, maxCount, folder = 'uploads') => {
    if (USE_S3) {
      return uploadArrayToS3(fieldName, maxCount, folder);
    }
    
    return (req, res, next) => {
      upload.array(fieldName, maxCount)(req, res, (err) => {
        if (err) {
          logger.error('File upload error:', err);
          if (err instanceof multer.MulterError) {
            return next(new ApiError(`File upload error: ${err.message}`, 400));
          }
          return next(err);
        }
        
        // Add local file URLs for compatibility
        if (req.files) {
          req.files = req.files.map(file => ({
            ...file,
            url: `/uploads/${file.filename}`
          }));
        }
        
        next();
      });
    };
  },
  
  single: (fieldName, folder = 'uploads') => {
    if (USE_S3) {
      return uploadSingleToS3(fieldName, folder);
    }
    
    return (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err) {
          logger.error('File upload error:', err);
          if (err instanceof multer.MulterError) {
            return next(new ApiError(`File upload error: ${err.message}`, 400));
          }
          return next(err);
        }
        
        // Enhanced logging for debugging file upload issues
        if (req.file) {
          logger.info(`File uploaded: ${JSON.stringify({
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
          })}`);
          
          // Add local file URL for compatibility
          req.file.url = `/uploads/${req.file.filename}`;
          
          // Ensure path is valid for XML processing
          if (!req.file.path) {
            // If somehow path is missing, set it explicitly
            req.file.path = path.join(process.cwd(), 'uploads', req.file.filename);
            logger.info(`File path was missing, set to: ${req.file.path}`);
          }
        } else {
          logger.info(`No file uploaded for field: ${fieldName}`);
        }
        
        next();
      });
    };
  }
};

module.exports = { uploadWithErrorHandling };
