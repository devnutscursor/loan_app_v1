#!/usr/bin/env node

/**
 * Script to deploy frontend to Vercel
 * Run with: node deploy-to-vercel.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if vercel.json exists
const vercelJsonPath = path.join(__dirname, 'vercel.json');
if (!fs.existsSync(vercelJsonPath)) {
  console.error('Error: vercel.json not found!');
  process.exit(1);
}

// Deploy to Vercel
console.log('Deploying to Vercel...');

try {
  // Run vercel command with production flag
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('\n✅ Deployment successful!');
  
  console.log('\n🔗 After deployment:');
  console.log('1. Copy your Vercel frontend URL');
  console.log('2. Update FRONTEND_URL in your Render backend environment variables');
  console.log('3. Restart your backend service on Render\n');
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
} 