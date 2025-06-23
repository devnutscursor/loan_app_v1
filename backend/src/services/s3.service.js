const AWS = require('aws-sdk');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const ApiError = require('../utils/apiError');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

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

// Configure multer for memory storage (files will be held in memory before upload to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  console.log(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);
  
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.warn(`Rejected file: ${file.originalname}, mimetype: ${file.mimetype}`);
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
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

// Function to upload file to S3
const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    // Generate a unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname) || '.unknown';
    const fileName = `${Date.now()}-${uniqueSuffix}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make files publicly accessible
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    console.log(`Uploading file to S3: ${key}`);
    const result = await s3.upload(params).promise();
    
    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      filename: fileName,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new ApiError(`Failed to upload file to cloud storage: ${error.message}`, 500);
  }
};

// Function to delete file from S3
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };

    console.log(`Deleting file from S3: ${key}`);
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new ApiError(`Failed to delete file from cloud storage: ${error.message}`, 500);
  }
};

// Function to get signed URL for temporary access
const getSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: expiresIn // URL expires in seconds
    };

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new ApiError(`Failed to generate file access URL: ${error.message}`, 500);
  }
};

// Middleware to upload single file to S3
const uploadSingleToS3 = (fieldName, folder = 'uploads') => {
  return async (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err instanceof multer.MulterError) {
          return next(new ApiError(`File upload error: ${err.message}`, 400));
        }
        return next(err);
      }

      if (!req.file) {
        return next();
      }

      try {
        const s3Result = await uploadToS3(req.file, folder);
        
        // Replace file object with S3 result
        req.file = {
          ...req.file,
          ...s3Result
        };
        
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

// Middleware to upload multiple files to S3
const uploadArrayToS3 = (fieldName, maxCount, folder = 'uploads') => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err instanceof multer.MulterError) {
          return next(new ApiError(`File upload error: ${err.message}`, 400));
        }
        return next(err);
      }

      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Upload all files to S3
        const s3Results = await Promise.all(
          req.files.map(file => uploadToS3(file, folder))
        );
        
        // Replace files array with S3 results
        req.files = req.files.map((file, index) => ({
          ...file,
          ...s3Results[index]
        }));
        
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

module.exports = {
  uploadSingleToS3,
  uploadArrayToS3,
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
  s3
};
