# Email Configuration Fix Guide

## Problem Analysis
Your email service is failing with the error: `connect ETIMEDOUT 34.160.63.108:25`

This is happening because:
1. Wrong SMTP port (using port 25 instead of 587)
2. Missing or incorrect environment variables
3. Using Mailtrap (testing service) instead of Mailgun (production)

## Solution Steps

### Step 1: Create .env file
Create a `.env` file in your `backend` directory with the following content:

```env
# Email Configuration for Mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@mg.syncly360.com

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Server Configuration
PORT=5000
NODE_ENV=development

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
USE_S3=false
```

### Step 2: Get Mailgun Credentials
1. Go to your Mailgun dashboard
2. Navigate to Settings > API Keys
3. Copy your SMTP credentials:
   - Username: Usually your domain (e.g., `postmaster@mg.syncly360.com`)
   - Password: Your Mailgun SMTP password

### Step 3: Update the .env file
Replace the placeholder values in your `.env` file:
- `your-mailgun-username` → Your Mailgun SMTP username
- `your-mailgun-password` → Your Mailgun SMTP password
- `your-mongodb-connection-string` → Your MongoDB connection string
- `your-jwt-secret-key` → A secure random string for JWT signing

### Step 4: Test the Configuration
Run the email configuration check:
```bash
node check-email-config.js
```

You should see:
```
✅ Email configuration looks correct
```

### Step 5: Test Email Sending
Run the email test:
```bash
node test-email-delivery.js
```

## Alternative: Use Mailtrap for Testing
If you want to test with Mailtrap first, use these settings:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USERNAME=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@mg.syncly360.com
```

## Common Issues and Solutions

### Issue: Connection Timeout
- **Cause**: Wrong port or firewall blocking
- **Solution**: Use port 587 for Mailgun, ensure firewall allows outbound SMTP

### Issue: Authentication Failed
- **Cause**: Wrong username/password
- **Solution**: Double-check Mailgun SMTP credentials

### Issue: SSL/TLS Errors
- **Cause**: Wrong secure setting
- **Solution**: Use `EMAIL_SECURE=false` for port 587, `true` for port 465

## Verification Commands

After setting up, run these commands to verify:

1. Check configuration:
   ```bash
   node check-email-config.js
   ```

2. Test SMTP connection:
   ```bash
   node src/utils/email/emailTest.js
   ```

3. Test email delivery:
   ```bash
   node test-email-delivery.js
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| EMAIL_HOST | SMTP server hostname | smtp.mailgun.org |
| EMAIL_PORT | SMTP server port | 587 |
| EMAIL_SECURE | Use SSL/TLS | false |
| EMAIL_USERNAME | SMTP username | postmaster@mg.syncly360.com |
| EMAIL_PASSWORD | SMTP password | your-mailgun-password |
| EMAIL_FROM | Sender email address | noreply@mg.syncly360.com | 