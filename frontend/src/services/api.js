import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1`;

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
  
  // Document services for the app
  uploadDocument: async (documentData, loanId, file) => {
    try {
      console.log('📤 Uploading document with data:', {
        name: documentData.name,
        documentType: documentData.documentType,
        category: documentData.category,
        requirementId: documentData.requirementId || 'not provided', 
        description: documentData.description,
        loanId
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentData.name);
      formData.append('documentType', documentData.documentType);
      formData.append('category', documentData.category);
      formData.append('description', documentData.description || '');
      
      // Include requirementId if available for better matching
      if (documentData.requirementId) {
        formData.append('requirementId', documentData.requirementId);
      }
      
      if (documentData.metadata) {
        formData.append('metadata', JSON.stringify(documentData.metadata));
      }
      
      // Add loan ID if available
      if (loanId) {
        formData.append('loan', loanId);
      }
      
      return api.post('/borrower/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },
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
  
  // Loans
  getLoans: (params) => api.get('/loans', { params }),
  getLoan: (id) => api.get(`/loans/${id}`),
  updateLoan: (id, loanData) => api.put(`/borrower/loans/by-number/${loanData.loanDetails?.loanNumber || loanData.loanNumber || id}`, loanData),
  
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
  
  // Approve a document - using mock function since backend endpoint is not implemented yet
  approveDocument: (loanId, docId) => {
    return api.put(`/documents/${docId}/approve`, { loanId });
  },
  
  // Reject a document - using mock function since backend endpoint is not implemented yet
  rejectDocument: (loanId, docId) => {
    return api.put(`/documents/${docId}/reject`, { loanId });
  },
};

// Admin Services
export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  
  // Loans
  getLoans: (params) => api.get('/admin/loans', { params }),
  getLoan: (id) => api.get(`/admin/loans/${id}`),
  
  // Companies
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (id) => api.get(`/admin/companies/${id}`),
  updateCompanyStatus: (id, status) => api.patch(`/admin/companies/${id}/status`, { status }),
};

export default api;
