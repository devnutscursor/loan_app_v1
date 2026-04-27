# AWS S3 Integration Setup Guide

This guide will help you set up AWS S3 integration for file storage in your loan application system.

## Prerequisites

1. AWS Account with S3 access
2. AWS Access Key ID and Secret Access Key
3. S3 Bucket created

## Setup Instructions

### 1. Create AWS S3 Bucket

1. Log into AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., `your-app-name-uploads`)
5. Select your preferred region
6. Configure bucket settings:
   - Uncheck "Block all public access" (we need public read access for files)
   - Acknowledge the warning about public access
7. Click "Create bucket"

### 2. Create IAM User and Permissions

1. Navigate to IAM service in AWS Console
2. Click "Users" → "Add user"
3. Choose a username (e.g., `s3-upload-user`)
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Choose "Attach existing policies directly"
7. Search for and select `AmazonS3FullAccess` (or create a custom policy with specific bucket permissions)
8. Complete the user creation
9. **Important**: Copy the Access Key ID and Secret Access Key (you won't see the secret again)

### 3. Configure Environment Variables

Add the following to your `.env` file:

```env
# S3 Configuration
USE_S3=true
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name-here
```

Replace the values with your actual AWS credentials and bucket name.

### 4. Update Bucket Policy (Optional but Recommended)

To allow public read access to uploaded files, add this bucket policy:

1. Go to your S3 bucket
2. Click on "Permissions" tab
3. Click on "Bucket Policy"
4. Add the following policy (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### 5. Test the Integration

1. Restart your application server
2. Try uploading a document through the application
3. Check that the file appears in your S3 bucket
4. Verify that the file URL in the database is an S3 URL (starts with `https://`)

### 6. Migrate Existing Files (Optional)

If you have existing files in the local uploads directory, run the migration script:

```bash
node migrate-to-s3.js
```

This will:
- Upload all existing files to S3
- Update database records with S3 URLs
- Preserve original filenames and metadata

## Switching Between Local and S3 Storage

You can switch between local file storage and S3 by changing the `USE_S3` environment variable:

- `USE_S3=true` - Use AWS S3 for file storage
- `USE_S3=false` - Use local file storage

## Security Considerations

1. **IAM Permissions**: Consider creating a custom IAM policy with minimal required permissions instead of using `AmazonS3FullAccess`
2. **Bucket Access**: Files are set to public-read by default. For sensitive documents, consider using signed URLs with expiration
3. **Environment Variables**: Never commit your AWS credentials to version control
4. **CORS**: If serving files to web applications, configure CORS on your S3 bucket

## Custom IAM Policy (Recommended)

Instead of using `AmazonS3FullAccess`, create a custom policy with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

## CORS Configuration for Office Online Viewer

To enable viewing Office documents with Office Online viewer, you need to configure CORS on your S3 bucket:

1. Go to your S3 bucket in AWS Console
2. Click on the "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and paste the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "Content-Type", "Content-Length", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click "Save changes"

This configuration is required for Office Online and Google Docs viewer to access the documents from your S3 bucket.

## Troubleshooting

1. **Upload Fails**: Check AWS credentials and bucket permissions
2. **Files Not Accessible**: Verify bucket policy allows public read access
3. **Migration Issues**: Ensure local files exist and AWS credentials are correct
4. **CORS Errors**: Configure CORS policy on S3 bucket for web access

## Features Included

- ✅ Automatic file upload to S3
- ✅ Secure file deletion from S3
- ✅ Signed URL generation for secure downloads
- ✅ Backward compatibility with local storage
- ✅ Migration script for existing files
- ✅ Proper error handling and logging
- ✅ Support for all file types (documents, images, etc.)
- ✅ Organized file structure in S3 (folders: uploads, documents, messages, etc.)

## Cost Considerations

AWS S3 pricing includes:
- Storage: ~$0.023/GB/month (varies by region)
- Requests: ~$0.0004 per 1,000 PUT requests
- Data transfer: Free for uploads, charges for downloads

For most applications, the cost is minimal compared to the benefits of cloud storage.
