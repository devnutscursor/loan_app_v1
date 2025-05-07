import api from '../services/api';
import { logApiRequest, logApiResponse } from './debug';

/**
 * Utility function to simplify API calls with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Optional request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object|string} options.body - Request payload for POST/PUT requests
 * @returns {Promise<Object>} Response data or error object
 */
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const method = options.method || 'GET';
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Convert body string to object if needed
    let bodyData = options.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        console.warn('Could not parse body string to JSON:', e);
      }
    }
    
    // Log detailed API request for debugging
    console.log('------- API REQUEST -------');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Body:', bodyData);
    
    let response;
    
    switch (method.toUpperCase()) {
      case 'POST':
        response = await api.post(url, bodyData);
        break;
      case 'PUT':
        response = await api.put(url, bodyData);
        break;
      case 'DELETE':
        response = await api.delete(url);
        break;
      default:
        response = await api.get(url, options.params ? { params: options.params } : undefined);
    }
    
    // Log detailed API response for debugging
    console.log('------- API RESPONSE -------');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    return {
      status: 'success',
      data: response.data.data || response.data,
      message: response.data.message || 'Request successful'
    };
  } catch (error) {
    console.error('------- API ERROR -------');
    console.error('Request failed:', error);
    console.error('Response:', error.response?.data);
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Unknown error occurred',
      data: null
    };
  }
};

export default { fetchAPI };
