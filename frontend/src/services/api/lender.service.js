import API from '../api';

/**
 * Lender Service
 * API services for lender-specific operations
 */
const lenderService = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      return await API.get('/lender/dashboard/stats');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Loan Applications
  getLoanApplications: async (filters = {}) => {
    try {
      return await API.get('/lender/applications', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getLoanApplication: async (id) => {
    try {
      return await API.get(`/lender/applications/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateLoanStatus: async (id, data) => {
    try {
      return await API.patch(`/lender/applications/${id}/status`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateLoanMilestone: async (loanId, milestoneId, data) => {
    try {
      return await API.patch(`/lender/applications/${loanId}/milestones/${milestoneId}`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // GHL Opportunities (Phase 4 - manual sync)
  getGhlOpportunityPipelines: async (companyId) => {
    try {
      return await API.get('/ghl/opportunity/pipelines', { params: companyId ? { companyId } : {} });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  syncLoanToGhlOpportunity: async ({ loanId, pipelineId, pipelineStageId, opportunityStatus }) => {
    try {
      return await API.post('/ghl/opportunity/sync-loan', {
        loanId,
        pipelineId,
        pipelineStageId,
        opportunityStatus
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Borrower Management
  getBorrowers: async (filters = {}) => {
    try {
      return await API.get('/lender/borrowers', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getBorrowerDetails: async (id) => {
    try {
      return await API.get(`/lender/borrowers/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getBorrowerDocuments: async (borrowerId, filters = {}) => {
    try {
      return await API.get(`/lender/borrowers/${borrowerId}/documents`, { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Document Management
  getDocuments: async (filters = {}) => {
    try {
      return await API.get('/lender/documents', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  verifyDocument: async (documentId, data) => {
    try {
      return await API.post(`/documents/verify/${documentId}`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  uploadDocumentTemplate: async (formData) => {
    try {
      return await API.post('/lender/documents/templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Condition Management
  getLoanConditions: async (loanId, filters = {}) => {
    try {
      return await API.get(`/lender/loans/${loanId}/conditions`, { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createCondition: async (loanId, data) => {
    try {
      return await API.post(`/lender/loans/${loanId}/conditions`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateConditionStatus: async (conditionId, data) => {
    try {
      return await API.patch(`/lender/conditions/${conditionId}/status`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  addConditionNote: async (conditionId, data) => {
    try {
      return await API.post(`/lender/conditions/${conditionId}/notes`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteCondition: async (conditionId) => {
    try {
      return await API.delete(`/lender/conditions/${conditionId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getConditionLibrary: async (filters = {}) => {
    try {
      return await API.get('/lender/conditions/library', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createLibraryItem: async (data) => {
    try {
      return await API.post('/lender/conditions/library', data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  addConditionsFromLibrary: async (loanId, data) => {
    try {
      return await API.post(`/lender/loans/${loanId}/conditions/fromLibrary`, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteLibraryItem: async (itemId) => {
    try {
      return await API.delete(`/lender/conditions/library/${itemId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getAllConditions: async (params = {}) => {
    try {
      return await API.get('/lender/conditions', { params });
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getConditionTags: async () => {
    try {
      return await API.get('/lender/conditions/tags');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Communication
  getMessages: async (filters = {}) => {
    try {
      return await API.get('/lender/messages', { params: filters });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getLoanMessages: async (loanId) => {
    try {
      return await API.get(`/lender/loans/${loanId}/messages`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  sendMessage: async (data) => {
    try {
      return await API.post('/lender/messages', data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Add this function to get lender activities

  /**
   * Get lender activities
   * @param {Number} limit - Optional limit for activities to fetch
   * @returns {Promise} Promise containing activities data
   */
  getLenderActivities: async (limit = 10) => {
    try {
      const response = await API.get(`/lenders/activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender activities:', error);
      throw error;
    }
  }
};

export default lenderService;
