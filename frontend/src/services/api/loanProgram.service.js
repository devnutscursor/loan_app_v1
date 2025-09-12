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
 * Loan Program Service
 * API services for loan program operations
 */
const loanProgramService = {
  // Get all loan programs
  getAllPrograms: async (filters = {}) => {
    try {
      console.log('LoanProgramService: Calling API with filters:', filters);
      // This will automatically apply company/lender filtering on the backend based on the user's role
      const response = await api.get('/loan-programs', { params: filters });
      console.log('LoanProgramService: Received response:', response);
      return response;
    } catch (error) {
      console.error('LoanProgramService: API call failed:', error);
      throw handleApiError(error);
    }
  },

  // Get a specific loan program
  getProgram: async (id) => {
    try {
      return await api.get(`/loan-programs/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create a new loan program
  createProgram: async (data) => {
    try {
      // The backend will automatically associate with the current company or lender based on user role
      return await api.post('/loan-programs', data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update a loan program
  updateProgram: async (id, data) => {
    try {
      return await api.put(`/loan-programs/${id}`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete a loan program
  deleteProgram: async (id) => {
    try {
      return await api.delete(`/loan-programs/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Calculate qualification for a loan program
  calculateQualification: async (loanId, programId) => {
    try {
      return await api.get(`/loans/${loanId}/programs/${programId}/qualification`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default loanProgramService;
