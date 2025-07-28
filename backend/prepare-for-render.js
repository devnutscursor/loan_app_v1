#!/usr/bin/env node

/**
 * Script to prepare backend for Render deployment
 * Run with: node prepare-for-render.js
 */

const fs = require('fs');
const path = require('path');

console.log('Preparing backend for Render deployment...');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check if render.yaml exists
const renderYamlPath = path.join(__dirname, 'render.yaml');
if (!fs.existsSync(renderYamlPath)) {
  console.error('Error: render.yaml not found!');
  process.exit(1);
}

// Check for MongoDB URI in environment
if (!process.env.MONGODB_URI) {
  console.log('\n⚠️  Warning: MONGODB_URI environment variable not found.');
  console.log('You will need to set this in your Render environment variables.');
}

console.log('\n✅ Backend is ready for Render deployment!');
console.log('\n🔗 Deployment steps:');
console.log('1. Push your repository to GitHub');
console.log('2. Create a new Web Service in Render dashboard');
console.log('3. Connect your GitHub repository');
console.log('4. Configure with these settings:');
console.log('   - Name: loan-app-backend');
console.log('   - Build Command: npm install');
console.log('   - Start Command: npm start');
console.log('5. Add environment variables:');
console.log('   - NODE_ENV: production');
console.log('   - PORT: 10000');
console.log('   - MONGODB_URI: (your MongoDB connection string)');
console.log('   - JWT_SECRET: (generate a secure string)');
console.log('   - FRONTEND_URL: https://www.loanapp360.com');
console.log('   - USE_S3: false');
console.log('\n6. Once deployed, update the frontend Vercel env variable:');
console.log('   - NEXT_PUBLIC_API_URL: https://your-render-backend-url.onrender.com'); 