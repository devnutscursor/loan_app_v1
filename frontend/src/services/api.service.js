import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create an API instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  timeout: 30000 // 30 seconds timeout
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, let axios set the content type automatically
    // to include the correct boundary parameter
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors based on status codes
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only show toast if not already on login page
          if (window.location.pathname !== '/login') {
            toast.error('Your session has expired. Please log in again.');
            window.location.href = `/login?returnUrl=${window.location.pathname}`;
          }
          break;
        
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action');
          break;
        
        case 404:
          // Not found
          toast.error('The requested resource was not found');
          break;
        
        case 429:
          // Rate limiting
          toast.error('Too many requests. Please try again later');
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          toast.error('A server error occurred. Please try again later');
          break;
        
        default:
          // Other errors
          const errorMessage = response.data?.message || 'An error occurred';
          toast.error(errorMessage);
      }
    } else {
      // Network error
      toast.error('Network error. Please check your connection and try again');
    }
    
    return Promise.reject(error);
  }
);

// Helper method for handling API responses consistently
const handleResponse = (promise) => {
  return promise
    .then((response) => {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        status: response.status,
      };
    })
    .catch((error) => {
      return {
        success: false,
        error: error.response?.data || { message: 'Network error' },
        status: error.response?.status || 0,
      };
    });
};

// Export the API instance
export default api;

// Export the response handler
export { handleResponse };
