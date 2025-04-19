/**
 * Debug middleware to log request body information
 */
const debugMiddleware = (req, res, next) => {
  console.log('DEBUG MIDDLEWARE:');
  console.log('- Headers:', req.headers);
  console.log('- Content Type:', req.headers['content-type']);
  console.log('- Body Keys:', Object.keys(req.body));
  console.log('- Files:', req.files ? `${req.files.length} files` : 'no files');
  
  // Try to provide detailed info on each key
  console.log('- Body Content Details:');
  Object.entries(req.body).forEach(([key, value]) => {
    console.log(`  - ${key}: ${typeof value === 'string' ? `String (length: ${value.length})` : typeof value}`);
    if (typeof value === 'string' && value.length > 0) {
      console.log(`    Sample: ${value.substring(0, 30)}...`);
      
      // Try parsing JSON
      try {
        const parsed = JSON.parse(value);
        console.log(`    Parsed successfully as JSON: ${typeof parsed}`);
        if (typeof parsed === 'object') {
          console.log(`    JSON keys: ${Object.keys(parsed)}`);
        }
      } catch (e) {
        console.log(`    Not valid JSON: ${e.message}`);
      }
    }
  });
  
  next();
};

module.exports = debugMiddleware; 