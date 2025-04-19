const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'loan-app-system-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object from database
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object from database
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRATION }
  );
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
  generateToken,
  generateRefreshToken,
  verifyToken
};
