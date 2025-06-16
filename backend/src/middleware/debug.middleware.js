/**
 * Debug middleware to log request body information
 */
const debugMiddleware = (req, res, next) => {
  console.log('DEBUG MIDDLEWARE:');
  console.log('- Request URL:', req.originalUrl);
  console.log('- Method:', req.method);
  console.log('- Content Type:', req.headers['content-type']);
  console.log('- Body Keys:', Object.keys(req.body));
  
  // Log the body size
  const bodySize = JSON.stringify(req.body).length;
  console.log('- Body Size:', `${Math.round(bodySize / 1024)} KB`);
  
  // Log files if any
  if (req.files) {
    if (Array.isArray(req.files)) {
      console.log('- Files:', `${req.files.length} files`);
      req.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
      });
    } else {
      console.log('- Files:', 'files object present but not an array');
    }
  } else {
    console.log('- Files: no files');
  }
  
  // Check for common issues
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    if (Object.keys(req.body).length === 0) {
      console.log('WARNING: Empty form data received. This may indicate a parsing error.');
    }
  }
  
  // For JSON requests, log a sample of the body for debugging
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    try {
      const bodyStr = JSON.stringify(req.body, null, 2);
      // Log just the first 500 characters to avoid console flooding
      console.log('- Body Sample:', bodyStr.length > 500 ? bodyStr.substring(0, 500) + '...' : bodyStr);
      
      // Check for specific fields that might cause issues
      if (req.body.borrowerDetails) {
        console.log('- Has borrowerDetails:', !!req.body.borrowerDetails);
      }
      if (req.body.borrowers && req.body.borrowers.length > 0) {
        console.log('- Has borrowers array:', req.body.borrowers.length);
      }
      if (req.body.property) {
        console.log('- Has property:', !!req.body.property);
      }
      if (req.body.propertyInfo) {
        console.log('- Has propertyInfo:', !!req.body.propertyInfo);
      }
    } catch (err) {
      console.log('- Error stringifying body:', err.message);
    }
  }
  
  next();
};

module.exports = debugMiddleware; 