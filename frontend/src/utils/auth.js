/**
 * Authentication Utilities
 * 
 * Provides authentication, authorization, and security utilities
 * for the loan application system.
 */

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Token management
const TOKEN_KEY = 'loan_app_token';
const USER_DATA_KEY = 'loan_app_user';

/**
 * Saves authentication token and user data to cookies with secure flags
 * 
 * @param {string} token - JWT token
 * @param {object} userData - User data object
 */
export const saveAuthData = (token, userData) => {
  const tokenOptions = {
    expires: 1, // 1 day
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  Cookies.set(TOKEN_KEY, token, tokenOptions);
  
  if (userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
};

/**
 * Retrieves authentication token from cookie
 * 
 * @returns {string|null} Token if exists, otherwise null
 */
export const getToken = () => {
  return Cookies.get(TOKEN_KEY) || null;
};

/**
 * Retrieves current user data from local storage
 * 
 * @returns {object|null} User data if exists, otherwise null
 */
export const getUserData = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Checks if user is authenticated
 * 
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      clearAuthData();
      return false;
    }
    
    return true;
  } catch (error) {
    clearAuthData();
    return false;
  }
};

/**
 * Clears authentication data (logout)
 */
export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Checks if user has required role
 * 
 * @param {string|string[]} requiredRoles - Role(s) required for access
 * @returns {boolean} True if user has required role
 */
export const hasRole = (requiredRoles) => {
  const userData = getUserData();
  if (!userData || !userData.role) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userData.role);
  }
  
  return userData.role === requiredRoles;
};

/**
 * Gets user's role
 * 
 * @returns {string|null} User role if authenticated, otherwise null
 */
export const getUserRole = () => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

/**
 * Refreshes authentication token
 * 
 * @returns {Promise<string>} Promise that resolves to new token
 */
export const refreshToken = async () => {
  try {
    const currentToken = getToken();
    if (!currentToken) throw new Error('No token to refresh');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to refresh token');
    
    const data = await response.json();
    saveAuthData(data.token, data.user);
    
    return data.token;
  } catch (error) {
    clearAuthData();
    throw error;
  }
};

/**
 * Encrypt sensitive data using AES
 * This is a client-side utility for encrypting non-critical data
 * Critical data should be encrypted server-side.
 * 
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (optional)
 * @returns {string} Encrypted data
 */
export const encryptData = (data, key = process.env.REACT_APP_ENCRYPTION_KEY) => {
  // Simple implementation - in production, use a robust library like CryptoJS
  if (!data) return '';
  
  // This is a placeholder for actual encryption logic
  // For production, use a proper encryption library
  const encoded = btoa(data);
  return encoded;
};

/**
 * Decrypt data encrypted with encryptData
 * 
 * @param {string} encryptedData - Data to decrypt
 * @param {string} key - Encryption key (optional)
 * @returns {string} Decrypted data
 */
export const decryptData = (encryptedData, key = process.env.REACT_APP_ENCRYPTION_KEY) => {
  // Simple implementation - in production, use a robust library like CryptoJS
  if (!encryptedData) return '';
  
  // This is a placeholder for actual decryption logic
  // For production, use a proper encryption library
  try {
    const decoded = atob(encryptedData);
    return decoded;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return '';
  }
};

/**
 * Sanitize user input to prevent XSS attacks
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
