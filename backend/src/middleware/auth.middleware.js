const { verifyToken } = require('../config/auth');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');

/**
 * Middleware to authenticate user token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError('Access denied. No token provided', 401));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    if (!user.isActive) {
      return next(new ApiError('User account is inactive', 403));
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError('Invalid token', 401));
  }
};

/**
 * Middleware to check user role
 * @param  {...String} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Not authorized to access this resource', 403));
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
