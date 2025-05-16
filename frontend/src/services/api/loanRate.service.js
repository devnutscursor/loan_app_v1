import api from '../api';

// Simple error handler function
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    return new Error(error.response.data?.message || 'Server error');
  } else if (error.request) {
    // The request was made but no response was received
    return new Error('No response from server');
  } else {
    // Something happened in setting up the request
    return new Error(error.message || 'Error occurred');
  }
};

/**
 * Loan Rate Service
 * API services for loan rate operations
 */
const loanRateService = {
  // Get all loan rates
  getAllRates: async (filters = {}) => {
    try {
      // This will automatically apply lender filtering on the backend based on the user's role
      return await api.get('/loan-rates', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get a rate by program type
  getRateByType: async (type, lenderId = null) => {
    try {
      const params = lenderId ? { lender: lenderId } : {};
      return await api.get(`/loan-rates/${type}`, { params });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update loan rates (batch update)
  updateRates: async (rates) => {
    try {
      return await api.put('/loan-rates', { rates });
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default loanRateService;
