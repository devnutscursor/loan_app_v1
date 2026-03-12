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
      // This will automatically apply company/lender filtering on the backend based on the user's role
      return await api.get('/loan-rates', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get a rate by program type
  getRateByType: async (type, lenderId = null) => {
    try {
      // Ensure lenderId is a string and not an object
      let lenderParam = null;
      if (lenderId) {
        // If lender is an object with _id, use that
        if (typeof lenderId === 'object' && lenderId._id) {
          lenderParam = lenderId._id;
        } 
        // If it's a string ID, use it directly
        else if (typeof lenderId === 'string') {
          lenderParam = lenderId;
        }
      }
      
      // Only add lender parameter if we have a valid ID
      const params = lenderParam ? { lender: lenderParam } : {};
      console.log(`Fetching rate for type ${type} with params:`, params);
      
      return await api.get(`/loan-rates/${type}`, { params });
    } catch (error) {
      const err = handleApiError(error);
      // Missing rate for a type is not fatal; allow caller to fall back
      console.warn('LoanRateService.getRateByType failed, falling back to defaults:', err.message);
      return null;
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
