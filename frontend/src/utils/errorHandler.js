/**
 * API Error handling utilities
 */

/**
 * Handles API errors in a standardized way
 * @param {Error} error - The error object from axios or other source
 * @returns {Error} A standardized error with additional information
 */
export const handleApiError = (error) => {
  // Get response data if available
  const responseData = error.response?.data;
  
  // Create a more informative error
  const enhancedError = new Error(
    responseData?.message || error.message || 'An unknown error occurred'
  );
  
  // Add additional properties from the response
  enhancedError.status = error.response?.status || 500;
  enhancedError.statusText = error.response?.statusText || 'Internal Server Error';
  enhancedError.data = responseData || null;
  enhancedError.originalError = error;
  
  // Log the error for debugging
  console.error('API Error:', {
    url: error.config?.url,
    method: error.config?.method,
    status: enhancedError.status,
    message: enhancedError.message,
    data: enhancedError.data
  });
  
  return enhancedError;
};

/**
 * Format validation errors from API responses
 * @param {Object} errorData - Error data from API
 * @returns {Object} Formatted validation errors for form display
 */
export const formatValidationErrors = (errorData) => {
  if (!errorData || !errorData.errors) {
    return {};
  }
  
  const formattedErrors = {};
  
  // Process each validation error
  errorData.errors.forEach(error => {
    // Convert path to form field name (e.g., 'user.firstName' to 'firstName')
    const fieldName = error.path.split('.').pop();
    formattedErrors[fieldName] = error.message;
  });
  
  return formattedErrors;
};

export default {
  handleApiError,
  formatValidationErrors
}; 