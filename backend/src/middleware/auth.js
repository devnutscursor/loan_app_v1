/**
 * Auth middleware adapter
 * Redirects to the main auth middleware implementation
 * and provides proper naming compatibility for various routes
 */
const authMiddleware = require('./auth.middleware');

module.exports = {
  // Function name mappings for backwards compatibility
  protect: authMiddleware.authenticate,
  restrictTo: authMiddleware.authorize, // This is the missing function
  
  // Include original functions for completeness
  authenticate: authMiddleware.authenticate,
  authorize: authMiddleware.authorize
};
