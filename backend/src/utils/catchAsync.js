/**
 * Utility function to catch async errors in Express route handlers
 * This eliminates the need for try/catch blocks in each controller
 * and ensures all errors are passed to the global error handler
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
