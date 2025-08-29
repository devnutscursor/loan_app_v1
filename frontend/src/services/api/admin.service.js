import axios from 'axios';
import { API_URL } from '../config';
import { handleApiError } from '../utils/errorHandler';

const API = axios.create({
  baseURL: `${API_URL}/admin`,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin dashboard statistics
const getDashboardStats = async () => {
  try {
    return await API.get('/dashboard/stats');
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get recent loans
const getRecentLoans = async (limit = 5) => {
  try {
    return await API.get(`/loans/recent?limit=${limit}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get recent users
const getRecentUsers = async (limit = 5) => {
  try {
    return await API.get(`/users/recent?limit=${limit}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Document management
const getAllDocuments = async (filters = {}) => {
  try {
    return await API.get('/documents', { params: filters });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Verify document
const verifyDocument = async (documentId, data) => {
  try {
    return await API.patch(`/documents/${documentId}/verify`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get document templates
const getDocumentTemplates = async () => {
  try {
    return await API.get('/documents/templates');
  } catch (error) {
    throw handleApiError(error);
  }
};

// Create document template
const createDocumentTemplate = async (formData) => {
  try {
    return await API.post('/documents/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete document template
const deleteDocumentTemplate = async (templateId) => {
  try {
    return await API.delete(`/documents/templates/${templateId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all users
const getAllUsers = async (filters = {}) => {
  try {
    return await API.get('/users', { params: filters });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update user
const updateUser = async (userId, data) => {
  try {
    return await API.patch(`/users/${userId}`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

  // Update user status
const updateUserStatus = async (userId, isActive) => {
  try {
    return await API.patch(`/users/${userId}/status`, { isActive });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all loans
const getAllLoans = async (filters = {}) => {
  try {
    return await API.get('/loans', { params: filters });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update loan
const updateLoan = async (loanId, data) => {
  try {
    return await API.patch(`/loans/${loanId}`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update loan milestone
const updateLoanMilestone = async (loanId, milestoneId, data) => {
  try {
    return await API.patch(`/loans/${loanId}/milestones/${milestoneId}`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Create loan milestone
const createLoanMilestone = async (loanId, data) => {
  try {
    return await API.post(`/loans/${loanId}/milestones`, data);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete loan milestone
const deleteLoanMilestone = async (loanId, milestoneId) => {
  try {
    return await API.delete(`/loans/${loanId}/milestones/${milestoneId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get system settings
const getSystemSettings = async () => {
  try {
    return await API.get('/settings');
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update system settings
const updateSystemSettings = async (data) => {
  try {
    return await API.patch('/settings', data);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const adminService = {
  // Dashboard
  getDashboardStats,
  getRecentLoans,
  getRecentUsers,
  
  // Document management
  getAllDocuments,
  verifyDocument,
  getDocumentTemplates,
  createDocumentTemplate,
  deleteDocumentTemplate,
  
  // User management
  getAllUsers,
  updateUser,
  updateUserStatus,
  
  // Loan management
  getAllLoans,
  updateLoan,
  updateLoanMilestone,
  createLoanMilestone,
  deleteLoanMilestone,
  
  // System settings
  getSystemSettings,
  updateSystemSettings
};
