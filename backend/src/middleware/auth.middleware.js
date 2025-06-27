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
    console.log('🔐 AUTHENTICATE MIDDLEWARE DEBUG 🔐');
    console.log('URL:', req.originalUrl);
    console.log('Method:', req.method);
    
    // Log headers with sensitive parts redacted
    const safeHeaders = { ...req.headers };
    if (safeHeaders.authorization) {
      safeHeaders.authorization = safeHeaders.authorization.substring(0, 15) + '...';
    }
    console.log('Headers:', safeHeaders);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ AUTHENTICATION FAILED: No token provided');
      return next(new ApiError('Access denied. No token provided', 401));
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received (first 10 chars):', token.substring(0, 10) + '...');
    
    // Verify token
    const decoded = verifyToken(token);
    console.log('Token decoded:', { 
      id: decoded.id, 
      role: decoded.role, 
      email: decoded.email
    });

    // Find user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('❌ AUTHENTICATION FAILED: User not found');
      return next(new ApiError('User not found', 404));
    }
    
    if (!user.isActive) {
      console.log('❌ AUTHENTICATION FAILED: User account is inactive');
      return next(new ApiError('User account is inactive', 403));
    }

    console.log('User found in DB:', { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      isActive: user.isActive 
    });
    
    // Add user to request object
    req.user = user;
    console.log('✅ AUTHENTICATION SUCCESS');
    next();
  } catch (error) {
    console.log('❌ AUTHENTICATION ERROR:', error.name, error.message);
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
    // Debug log for authorizing requests
    console.log('⭐ AUTHORIZE DEBUG ⭐');
    console.log('URL:', req.originalUrl);
    console.log('Method:', req.method);
    console.log('Required roles:', roles);
    console.log('User in request:', req.user ? {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email
    } : 'No user');

    if (!req.user) {
      console.log('❌ AUTHORIZATION FAILED: User not authenticated');
      return next(new ApiError('User not authenticated', 401));
    }
    
    // Case-insensitive role check with type safety and trim whitespace
    const userRole = req.user.role && typeof req.user.role === 'string' 
      ? req.user.role.toLowerCase().trim() 
      : String(req.user.role || '').toLowerCase().trim();
    
    const allowedRoles = roles.map(role => 
      typeof role === 'string' 
        ? role.toLowerCase().trim() 
        : String(role || '').toLowerCase().trim());
        
    // Print exact character codes to debug any hidden characters
    console.log('User role exact chars:', userRole.split('').map(c => c.charCodeAt(0)));
    console.log('Allowed roles exact chars:', allowedRoles.map(r => r.split('').map(c => c.charCodeAt(0))));
    
    
    console.log('User role (normalized):', userRole);
    console.log('Allowed roles (normalized):', allowedRoles);
    console.log('Role match?', allowedRoles.includes(userRole));
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ AUTHORIZATION FAILED: User role '${userRole}' not in allowed roles: [${allowedRoles.join(', ')}]`);
      return next(new ApiError(`Not authorized to access this resource. Role '${userRole}' not in allowed roles: [${roles.join(', ')}]`, 403));
    }
    
    console.log('✅ AUTHORIZATION SUCCESS');
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
