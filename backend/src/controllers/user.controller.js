const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already available in req.user from the authentication middleware
    // But we want to get a fresh copy from the database with all fields except password
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return next(new ApiError('User not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};
