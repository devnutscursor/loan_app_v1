import axios from 'axios';

// Dynamically determine API URL based on environment
const getApiUrl = () => {
  // In browser
  if (typeof window !== 'undefined') {
    // If using Vercel deployment
    if (window.location.hostname.includes('vercel.app')) {
      return `https://loan-app-backend-1qkk.onrender.com/api/v1`;
    }
  }
  
  // Development or explicit setting
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    // Ensure no double slashes and proper /api/v1 ending
    const cleanUrl = envUrl.replace(/\/+$/, ''); // Remove trailing slashes
    return `${cleanUrl}/api/v1`;
  }
  
  // Fallback for development
  return 'http://localhost:5000/api/v1';
};

const API_URL = getApiUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.patch('/users/me', userData),
};

// Borrower Services
export const borrowerService = {
  // Dashboard
  getDashboard: () => api.get('/borrower/dashboard'),

  // Loans
  getLoans: (params) => api.get('/borrower/loans', { params }),
  getLoan: (id) => api.get(`/borrower/loans/${id}`),
  createLoan: (loanData) => api.post('/borrower/loans', loanData),
  updateLoan: (id, loanData) => api.patch(`/borrower/loans/${id}`, loanData),

  // Profile
  getProfile: () => api.get('/borrower/profile'),
  updateProfile: (profileData) => api.patch('/borrower/profile', profileData),

  // Documents
  uploadDocument: (formData) => api.post('/borrower/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getDocuments: () => api.get('/borrower/documents'),
  deleteDocument: (id) => api.delete(`/borrower/documents/${id}`),

  // Loan Conditions (Document Requests)
  getActiveLoanConditions: () => api.get('/borrower/loan-conditions'),

  // Remove a condition from a loan (used when a document is uploaded to fulfill a condition)
  removeCondition: (loanId, conditionId) => api.delete(`/loans/${loanId}/conditions/${conditionId}`),
};

// Lender Services
export const lenderService = {
  // Dashboard
  getDashboard: () => api.get('/lenders/dashboard'),

  // Applications
  getApplications: (params) => api.get('/loans', { params }),
  getApplication: (id) => api.get(`/loans/${id}`),
  updateApplicationStatus: (id, status, notes) => api.patch(`/loans/${id}/status`, { status, notes }),
  // In lenderService.js
  // In lenderService
  getLoanParameters: async (loanId) => {
    try {
      // Use the same endpoint as in the parameters page
      const response = await api.get(`/loans/${loanId}`);

      // Transform the response to match the format expected by your dashboard component
      if (response && response.data) {
        // Extract the qualification metrics from the loan data
        const loanData = response.data;

        return {
          data: {
            dtiRatio: loanData.qualificationMetrics?.dtiRatio || 'N/A',
            ltvRatio: loanData.qualificationMetrics?.ltvRatio || 'N/A',
            qualified: loanData.qualificationStatus === 'qualified',
            parameters: loanData.qualificationParameters?.map(param => ({
              name: param.name,
              value: param.value,
              status: param.status
            })) || []
          }
        };
      }
      return { data: null };
    } catch (error) {
      console.error('Error fetching loan parameters:', error);
      throw error;
    }
  },
  // Loan Conditions
  getLoanConditions: async (loanId) => {
    try {
      const response = await api.get(`/loans/${loanId}/conditions`);
      console.log('Fetched loan conditions:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan conditions:', error);
      return { success: false, message: error.message || 'Failed to fetch loan conditions' };
    }
  },
  // Loans
  getLoans: (params) => api.get('/loans', { params: { ...params, all: 'true' } }),
  getLoan: (id) => api.get(`/loans/${id}`),
  getLoanWithDetails: (id) => api.get(`/loans/${id}/with-details`),
  updateLoan: (id, loanData) => api.put(`/borrower/loans/by-number/${loanData.loanDetails?.loanNumber || loanData.loanNumber || id}`, loanData),
  getBorrowerLoans: async (borrowerId, params = {}) => {
    try {
      const response = await api.get(`/loans/borrower/${borrowerId}`, { params });
      console.log('response.data', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans:', error);
      throw error;
    }
  },
  // Profile
  getProfile: () => api.get('/lender/profile'),
  updateProfile: (profileData) => api.patch('/lender/profile', profileData),

  // Company
  getCompany: () => api.get('/lender/company'),
  updateCompany: (companyData) => api.patch('/lender/company', companyData),

  // Borrowers
  getBorrowers: (params) => api.get('/lender/borrowers', { params }),
  getBorrower: (id) => api.get(`/lender/borrowers/${id}`),
  // Get loan documents
  getLoanDocuments: (loanId) => api.get(`/documents/loan/${loanId}`),

  // Request borrower to re-upload a specific document
  requestDocument: (loanId, docData) => {
    console.log(`📡 Requesting document:`, { loanId, ...docData });
    // The correct endpoint is just '/request' without the loanId in the path
    // The loanId should be part of the request body
    return api.post(`/documents/request`, { ...docData, loanId });
  },

  // Request multiple documents from the borrower in a batch
  requestDocumentsBatch: (loanId, borrowerId, documents) => {
    console.log(`📡 Requesting documents in batch:`, { loanId, borrowerId, documents });
    return api.post(`/documents/request/batch`, { 
      loanId, 
      borrowerId, 
      documents 
    });
  },

  // Approve a document
  approveDocument: async (loanId, docId) => {
    console.log(`📡 Approving document:`, { loanId, docId });
    try {
      // Send only the essential data to avoid payload size issues
      const response = await api.put(`/documents/${docId}/approve`, {
        loanId
      });

      console.log(`📡 Raw backend response for approve:`, response);
      console.log(`📡 Response data:`, response.data);
      console.log(`📡 Response status:`, response.status);

      // Return a standardized success response
      return {
        success: true,
        message: 'Document approved successfully',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error approving document:', error);
      console.error('❌ Error response:', error.response);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve document',
        error
      };
    }
  },

  // Reject a document
  rejectDocument: async (loanId, docId, data = {}) => {
    console.log(`📡 Rejecting document:`, { loanId, docId, ...data });
    try {
      // Send only the essential data to avoid payload size issues
      const response = await api.put(`/documents/${docId}/reject`, {
        loanId,
        reason: data.reason || 'Document does not meet requirements'
      });

      console.log(`📡 Raw backend response for reject:`, response);
      console.log(`📡 Response data:`, response.data);
      console.log(`📡 Response status:`, response.status);

      // Return a standardized success response
      return {
        success: true,
        message: 'Document rejected successfully',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error rejecting document:', error);
      console.error('❌ Error response:', error.response);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject document',
        error
      };
    }
  },
};

// Company Services
export const companyService = {
  // Dashboard - combines stats and top lenders
  getDashboard: async (companyId) => {
    const [statsResponse, topLendersResponse] = await Promise.all([
      api.get(`/companies/${companyId}/stats`),
      api.get(`/companies/${companyId}/top-lenders`)
    ]);
    
    return {
      data: {
        stats: statsResponse.data.data,
        topLenders: topLendersResponse.data.data.topLenders || []
      }
    };
  },

  // Company Stats
  getStats: (companyId) => api.get(`/companies/${companyId}/stats`),
  
  // Top Lenders
  getTopLenders: (companyId, params) => api.get(`/companies/${companyId}/top-lenders`, { params }),
  
  // Company Lenders
  getLenders: (companyId) => api.get(`/companies/${companyId}/lenders`),
  getLender: (companyId, lenderId) => api.get(`/companies/${companyId}/lenders/${lenderId}`),
  createLender: (companyId, lenderData) => api.post(`/companies/${companyId}/lenders`, lenderData),
  
  // Lender Dashboard Data for Company Access
  getLenderDashboard: (companyId, lenderId) => api.get(`/companies/${companyId}/lenders/${lenderId}/dashboard`),
  getLenderBorrowers: (companyId, lenderId, params) => api.get(`/companies/${companyId}/lenders/${lenderId}/borrowers`, { params }),
  getLenderActivities: (companyId, lenderId, params) => api.get(`/companies/${companyId}/lenders/${lenderId}/activities`, { params }),
  getLender: (companyId, lenderId) => api.get(`/companies/${companyId}/lenders/${lenderId}`),
  getLenderPrograms: (companyId, lenderId, params) => api.get(`/companies/${companyId}/lenders/${lenderId}/programs`, { params }),
  
  // Lender Borrower Loans for Company Access
  getLenderBorrowerLoans: (companyId, lenderId, borrowerId, params) => api.get(`/companies/${companyId}/lenders/${lenderId}/borrowers/${borrowerId}/loans`, { params }),
  
  // Loan Details for Company Access
  getLoan: (loanId) => api.get(`/loans/${loanId}`),
  getLoanWithDetails: (loanId) => api.get(`/loans/${loanId}/with-details`),
  updateLoan: (loanId, loanData) => api.put(`/loans/${loanId}`, loanData),
  
  // Company Profile
  getProfile: (companyId) => api.get(`/companies/${companyId}`),
  updateProfile: (companyId, companyData) => api.patch(`/companies/${companyId}`, companyData),
  uploadLogo: (companyId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.patch(`/companies/${companyId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteLogo: (companyId) => api.delete(`/companies/${companyId}/logo`),
};

// Admin Services
export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  getBorrowerByUserId: (userId) => api.get(`/admin/users/${userId}/borrower`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),

  // Loans
  getLoans: (params) => api.get('/admin/loans', { params }),
  getLoan: (id) => api.get(`/admin/loans/${id}`),

  // Companies
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (id) => api.get(`/admin/companies/${id}`),
  createCompany: (companyData) => api.post('/admin/companies', companyData),
  updateCompanyStatus: (id, status) => api.patch(`/admin/companies/${id}/status`, { status }),
};

// Note Services
export const noteService = {
  // Get all notes for a loan
  getNotes: async (loanId) => {
    try {
      console.log(`Calling getNotes API for loan ID: ${loanId}`);
      const response = await api.get(`/notes/${loanId}`);
      console.log('Raw getNotes API response:', response);
      return response.data; // Axios wraps the actual response in a data property
    } catch (error) {
      console.error('Error in getNotes API call:', error);
      // Check if there's a specific error response from the server
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Authentication error: User is not logged in or token expired');
          // Return a standardized error format
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
            statusCode: 401
          };
        } else if (error.response.status === 403) {
          console.error('Authorization error: User does not have permission');
          return {
            success: false,
            message: 'You do not have permission to access these notes.',
            statusCode: 403
          };
        } else if (error.response.status === 404) {
          console.error('Resource not found:', error.response.data);
          return {
            success: false,
            message: 'Notes could not be found.',
            statusCode: 404
          };
        } else {
          // Other server errors
          console.error('Server error:', error.response.data);
          return {
            success: false,
            message: error.response.data?.message || 'An error occurred while fetching notes.',
            statusCode: error.response.status
          };
        }
      }
      // Network or other client-side errors
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    }
  },
  
  // Create a new note
  createNote: async (loanId, content) => {
    try {
      console.log(`Calling createNote API for loan ID: ${loanId}`);
      const response = await api.post(`/notes/${loanId}`, { content });
      console.log('Raw createNote API response:', response);
      return response.data; // Axios wraps the actual response in a data property
    } catch (error) {
      console.error('Error in createNote API call:', error);
      // Check if there's a specific error response from the server
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Authentication error: User is not logged in or token expired');
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
            statusCode: 401
          };
        } else if (error.response.status === 403) {
          console.error('Authorization error: User does not have permission');
          return {
            success: false,
            message: 'You do not have permission to add notes.',
            statusCode: 403
          };
        } else {
          // Other server errors
          console.error('Server error:', error.response.data);
          return {
            success: false,
            message: error.response.data?.message || 'An error occurred while creating the note.',
            statusCode: error.response.status
          };
        }
      }
      // Network or other client-side errors
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    }
  },
  
  // Update a note
  updateNote: async (noteId, content) => {
    try {
      console.log(`Calling updateNote API for note ID: ${noteId}`);
      const response = await api.put(`/notes/${noteId}`, { content });
      console.log('Raw updateNote API response:', response);
      return response.data; // Axios wraps the actual response in a data property
    } catch (error) {
      console.error('Error in updateNote API call:', error);
      // Check if there's a specific error response from the server
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Authentication error: User is not logged in or token expired');
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
            statusCode: 401
          };
        } else if (error.response.status === 403) {
          console.error('Authorization error: User does not have permission');
          return {
            success: false,
            message: 'You do not have permission to update this note.',
            statusCode: 403
          };
        } else if (error.response.status === 404) {
          console.error('Resource not found:', error.response.data);
          return {
            success: false,
            message: 'Note could not be found.',
            statusCode: 404
          };
        } else {
          // Other server errors
          console.error('Server error:', error.response.data);
          return {
            success: false,
            message: error.response.data?.message || 'An error occurred while updating the note.',
            statusCode: error.response.status
          };
        }
      }
      // Network or other client-side errors
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    }
  },
  
  // Delete a note
  deleteNote: async (noteId) => {
    try {
      console.log(`Calling deleteNote API for note ID: ${noteId}`);
      const response = await api.delete(`/notes/${noteId}`);
      console.log('Raw deleteNote API response:', response);
      return response.data; // Axios wraps the actual response in a data property
    } catch (error) {
      console.error('Error in deleteNote API call:', error);
      // Check if there's a specific error response from the server
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Authentication error: User is not logged in or token expired');
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
            statusCode: 401
          };
        } else if (error.response.status === 403) {
          console.error('Authorization error: User does not have permission');
          return {
            success: false,
            message: 'You do not have permission to delete this note.',
            statusCode: 403
          };
        } else if (error.response.status === 404) {
          console.error('Resource not found:', error.response.data);
          return {
            success: false,
            message: 'Note could not be found.',
            statusCode: 404
          };
        } else {
          // Other server errors
          console.error('Server error:', error.response.data);
          return {
            success: false,
            message: error.response.data?.message || 'An error occurred while deleting the note.',
            statusCode: error.response.status
          };
        }
      }
      // Network or other client-side errors
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    }
  },
};

export default api;

