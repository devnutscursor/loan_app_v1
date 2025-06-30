const AWS = require('aws-sdk');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const ApiError = require('../utils/apiError');
const fs = require('fs');
const logger = require('../utils/logger');

// Check if we should use S3 or local storage directly from env
const USE_S3 = process.env.USE_S3 === 'true' || false;

// Configure AWS with credentials from environment variables
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
      // ACL removed - modern S3 buckets often use bucket policies instead of ACLs
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Log the bucket name for debugging
    console.log(`Using S3 bucket: ${process.env.AWS_S3_BUCKET}`);

    console.log(`Uploading file to S3: ${key} (Content-Type: ${file.mimetype}, Size: ${file.size} bytes)`);
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
    console.error('S3 upload error details:', JSON.stringify({
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      file: {
        name: file.originalname,
        type: file.mimetype,
        size: file.size
      },
      error: error.message
    }));
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

/**
 * Upload a single file to S3
 * @param {string} fieldName - Name of the field in the form for the file
 * @param {string} folder - Subfolder in S3 to store the file
 * @returns {Function} Express middleware
 */
const uploadSingleToS3 = (fieldName, folder = 'uploads') => {
  return (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Accept all file types for now
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
      }
    }).single(fieldName);

    upload(req, res, async (err) => {
      if (err) {
        logger.error('Multer error on S3 upload:', err);
        return next(new ApiError(`S3 upload error: ${err.message}`, 400));
      }
      
      // If there's no file, just proceed
      if (!req.file) {
        logger.info(`No file uploaded to field ${fieldName}`);
        return next();
      }

      logger.info(`Processing file upload to S3: ${req.file.originalname}`);
      
      // Special handling for XML files (especially for loan imports)
      const isXMLFile = req.file.originalname.toLowerCase().endsWith('.xml') || 
                        req.file.mimetype === 'application/xml' || 
                        req.file.mimetype === 'text/xml';
      
      try {
        const fileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}-${req.file.originalname.replace(/\s+/g, '_')}`;
        const key = folder ? `${folder}/${fileName}` : fileName;
        const bucket = process.env.AWS_S3_BUCKET || 'loan-app-documents';
        
        logger.info(`Uploading to S3: bucket=${bucket}, key=${key}`);
        
        // Upload the file to S3
        const params = {
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ContentDisposition: 'inline',
          Metadata: {
            originalname: encodeURIComponent(req.file.originalname)
          }
        };
        
        const uploadResult = await s3.upload(params).promise();
        logger.info(`File uploaded to S3 successfully: ${uploadResult.Location}`);
        
        // Set the file information on req.file
        req.file.bucket = bucket;
        req.file.key = key;
        req.file.url = uploadResult.Location || `https://${bucket}.s3.amazonaws.com/${key}`;
        
        // For XML files (especially loan imports), keep the buffer for immediate processing
        if (isXMLFile) {
          logger.info('XML file detected, keeping buffer for immediate processing');
          // Buffer is already there from multer memory storage
        }
        
        logger.info('S3 upload complete');
        next();
      } catch (error) {
        logger.error('S3 upload error:', error);
        return next(new ApiError(`Failed to upload to S3: ${error.message}`, 500));
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

/**
 * Read file content from S3 or local filesystem
 * @param {Object} fileInfo - File information object with path or S3 details
 * @returns {Promise<Buffer>} File content as buffer
 */
const readFile = async (fileInfo) => {
  try {
    if (!fileInfo) {
      throw new Error('No file information provided');
    }
    
    // Get USE_S3 directly from environment to avoid circular dependencies
    const USE_S3 = process.env.USE_S3 === 'true' || false;
    
    logger.info(`Reading file: ${JSON.stringify({
      isS3: USE_S3,
      hasKey: !!fileInfo.key,
      path: fileInfo.path,
      key: fileInfo.key,
      bucket: fileInfo.bucket,
      hasBuffer: !!fileInfo.buffer
    })}`);

    // If S3 is enabled and we have S3 details
    if (USE_S3 && fileInfo.key && fileInfo.bucket) {
      logger.info(`Reading file from S3: ${fileInfo.bucket}/${fileInfo.key}`);
      
      try {
        const data = await s3.getObject({
          Bucket: fileInfo.bucket,
          Key: fileInfo.key
        }).promise();
        
        logger.info('Successfully read file from S3');
        return data.Body;
      } catch (s3Error) {
        logger.error(`Error reading from S3: ${s3Error.message}`, s3Error);
        throw new Error(`S3 read error: ${s3Error.message}`);
      }
    } 
    // If we have a buffer (already in memory)
    else if (fileInfo.buffer) {
      logger.info('File content already available in buffer');
      return fileInfo.buffer;
    }
    // Local file path
    else if (fileInfo.path && fs.existsSync(fileInfo.path)) {
      logger.info(`Reading file from local path: ${fileInfo.path}`);
      return fs.readFileSync(fileInfo.path);
    } 
    else {
      throw new Error(`Invalid file path or S3 information`);
    }
  } catch (error) {
    logger.error(`Error reading file: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadSingleToS3,
  uploadArrayToS3,
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
  s3,
  readFile,
  USE_S3
};
