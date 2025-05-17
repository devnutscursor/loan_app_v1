import api from '../api';

// Error handler
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
 * Milestone Service
 * API services for milestone operations
 */
const milestoneService = {
  // Get all milestones for a loan
  getLoanMilestones: async (loanId) => {
    try {
      const response = await api.get(`/loans/${loanId}/milestones`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan milestones:', error);
      throw handleApiError(error);
    }
  },

  // Get a specific milestone details
  getMilestone: async (milestoneId) => {
    try {
      const response = await api.get(`/loans/milestones/${milestoneId}`);
      return response.data;
      } catch (error) {
      console.error('Error fetching milestone details:', error);
      throw handleApiError(error);
    }
  },

  // Create a new milestone
  createMilestone: async (milestoneData) => {
    try {
      console.log("milestoneData", milestoneData);
      const response = await api.post('/loans/milestones', milestoneData);
      console.log("response create", response);
      return response.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw handleApiError(error);
    }
  },

  // Update a milestone
  updateMilestone: async (milestoneId, updateData) => {
    try {
      const response = await api.patch(`/loans/milestones/${milestoneId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw handleApiError(error);
    }
  },

  // Update milestone order (for reordering)
  updateMilestoneOrder: async (loanId, milestoneOrders) => {
    try {
      // milestoneOrders should be an array of {id, order} objects
      const response = await api.patch(`/loans/${loanId}/milestones/reorder`, { milestoneOrders });
      return response.data;
    } catch (error) {
      console.error('Error reordering milestones:', error);
      throw handleApiError(error);
    }
  },

  // Delete a milestone
  deleteMilestone: async (milestoneId) => {
    try {
      const response = await api.delete(`/loans/milestones/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw handleApiError(error);
    }
  },

  // Update milestone status
  updateMilestoneStatus: async (milestoneId, status) => {
    try {
      const response = await api.patch(`/loans/milestones/${milestoneId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating milestone status:', error);
      throw handleApiError(error);
    }
  }
};

export default milestoneService;
