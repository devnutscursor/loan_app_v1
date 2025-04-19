import API from './api';
import { handleApiError } from '../../utils/errorHandler';

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
      return await API.patch(`/lender/documents/${documentId}/verify`, data);
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
  }
};

export default lenderService;
