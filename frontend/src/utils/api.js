import api from '../services/api';

/**
 * Utility function to simplify API calls with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Optional request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} options.data - Request payload for POST/PUT requests
 * @returns {Promise<Object>} Response data or error object
 */
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const method = options.method || 'GET';
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    let response;
    
    switch (method.toUpperCase()) {
      case 'POST':
        response = await api.post(url, options.data);
        break;
      case 'PUT':
        response = await api.put(url, options.data);
        break;
      case 'DELETE':
        response = await api.delete(url);
        break;
      default:
        response = await api.get(url, options.params ? { params: options.params } : undefined);
    }
    
    return {
      status: 'success',
      data: response.data.data || response.data,
      message: response.data.message || 'Request successful'
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Unknown error occurred',
      data: null
    };
  }
};

export default { fetchAPI };
