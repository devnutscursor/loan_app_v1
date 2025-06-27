const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Document = require('./src/models/document.model');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to upload file to S3
const uploadFileToS3 = async (filePath, fileName, bucketFolder = 'uploads') => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const key = `${bucketFolder}/${fileName}`;
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: getMimeType(fileName)
    };

    console.log(`Uploading ${fileName} to S3...`);
    const result = await s3.upload(params).promise();
    
    return {
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    console.error(`Error uploading ${fileName} to S3:`, error);
    throw error;
  }
};

// Function to get MIME type based on file extension
const getMimeType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.csv': 'text/csv'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// Migration function
const migrateFilesToS3 = async () => {
  try {
    console.log('Starting migration of files to S3...');
    
    // Get all documents from database
    const documents = await Document.find({});
    console.log(`Found ${documents.length} documents to migrate`);
    
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('No uploads directory found. Nothing to migrate.');
      return;
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const document of documents) {
      try {
        // Skip if already migrated (has S3 key)
        if (document.s3Key) {
          console.log(`Document ${document._id} already migrated, skipping...`);
          continue;
        }
        
        const localFilePath = path.join(uploadsDir, document.fileUrl);
        
        // Check if local file exists
        if (!fs.existsSync(localFilePath)) {
          console.warn(`Local file not found: ${localFilePath}`);
          errorCount++;
          continue;
        }
        
        // Upload to S3
        const s3Result = await uploadFileToS3(localFilePath, document.fileUrl);
        
        // Update document in database
        await Document.findByIdAndUpdate(document._id, {
          fileUrl: s3Result.url,
          s3Key: s3Result.key
        });
        
        console.log(`Migrated: ${document.fileUrl} -> ${s3Result.url}`);
        migratedCount++;
        
        // Optional: Delete local file after successful migration
        // fs.unlinkSync(localFilePath);
        
      } catch (error) {
        console.error(`Error migrating document ${document._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Successfully migrated: ${migratedCount} files`);
    console.log(`- Errors: ${errorCount} files`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await migrateFilesToS3();
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateFilesToS3 };
