import axios from 'axios';

// Create a custom axios instance with default configs
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor to attach auth token if available
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage if we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally (e.g., logout on 401)
    if (error.response && error.response.status === 401) {
      // Clear auth data on unauthorized
      if (typeof window !== 'undefined') {
        const isLogoutInProgress = localStorage.getItem('logoutInProgress');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there and not during logout
        if (window.location.pathname !== '/login' && !isLogoutInProgress) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
