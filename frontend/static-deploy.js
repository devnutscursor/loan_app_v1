#!/usr/bin/env node

/**
 * This script creates a simple static deployment for Vercel
 * It bypasses the complexity of the Next.js build
 */

const fs = require('fs');
const path = require('path');

console.log('Preparing a simplified static deployment for Vercel...');

// Ensure we have the necessary directories
const publicDir = path.join(__dirname, 'public');
const vercelOutputDir = path.join(__dirname, '.vercel', 'output');
const staticDir = path.join(vercelOutputDir, 'static');
const configFile = path.join(vercelOutputDir, 'config.json');

// Create directories if they don't exist
[vercelOutputDir, staticDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy index.html to the static directory
try {
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    fs.copyFileSync(
      path.join(__dirname, 'index.html'),
      path.join(staticDir, 'index.html')
    );
    console.log('✅ index.html copied to static directory');
  } else {
    console.error('❌ index.html file not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error copying index.html:', error.message);
  process.exit(1);
}

// Copy anything from public directory
if (fs.existsSync(publicDir)) {
  try {
    const copyRecursive = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursive(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    
    copyRecursive(publicDir, staticDir);
    console.log('✅ Public directory contents copied successfully');
  } catch (error) {
    console.error('❌ Error copying public directory:', error.message);
  }
}

// Create Vercel config.json
try {
  const config = {
    version: 3,
    routes: [
      {
        handle: "filesystem"
      },
      {
        src: "/(.*)",
        dest: "/index.html"
      }
    ]
  };
  
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log('✅ Vercel config.json created successfully');
  
  console.log('\n🚀 Static deployment files prepared!');
  console.log('\nRun the following command to deploy:');
  console.log('vercel deploy --prebuilt');
  
} catch (error) {
  console.error('❌ Error creating config.json:', error.message);
  process.exit(1);
} 