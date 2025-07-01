import ApiService from './api.service';
import AuditLogService from './auditLog.service';
import { toast } from 'react-hot-toast';
import { createFileFormData } from '../utils/formDataHelper';

/**
 * Document Service
 * 
 * Provides methods for document management, including upload, download,
 * retrieval, status updates, and document verification workflows.
 * Handles both borrower and lender document operations.
 */
class DocumentService {
  /**
   * Upload a document to the server
   * @param {Object} documentData - Document data including file, type, description
   * @param {string} loanId - ID of the loan to associate the document with
   * @param {File} file - The file object to upload
   * @returns {Promise<Object>} Response with upload status and document details
   */
  async uploadDocument(documentData, loanId, file) {
    try {
      console.log('Document data:', documentData);
      
      // Use the helper to create FormData (safer approach)
      const metadata = {
        name: documentData.name || file.name,
        category: documentData.category,
        documentType: documentData.type || documentData.documentType,
        description: documentData.description || '',
      };
      
      // Add loan ID if provided
      if (loanId) {
        metadata.loanId = loanId;
      }
      
      // Add tags if available
      if (documentData.tags && documentData.tags.length > 0) {
        metadata.tags = documentData.tags;
      }
      
      // Create FormData using our helper
      const formData = createFileFormData(file, metadata);
      
      // Log what we're sending for debugging
      console.log('Document upload data:', {
        ...metadata,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Make API request with proper error handling and timeout
      const response = await ApiService.post('/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000  // 60 seconds timeout for large uploads
      });
      
      // Try to create an audit log (don't let it affect the main functionality)
      try {
        await AuditLogService.createAuditLog({
          action: 'UPLOAD',
          resourceType: 'DOCUMENT',
          resourceId: response.data._id || 'unknown',
          details: `Uploaded document: ${documentData.name || file.name}`
        });
      } catch (logError) {
        console.warn('Failed to create audit log:', logError);
      }

      return {
        success: true,
        data: response.data,
        message: 'Document uploaded successfully'
      };
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload document'
      };
    }
  }
  
  /**
   * Get documents for a specific loan
   * @param {string} loanId - ID of the loan to get documents for
   * @param {Object} filters - Optional filters for document type, status, etc.
   * @returns {Promise<Object>} Response with documents list
   */
  async getLoanDocuments(loanId, filters = {}) {
    try {
      let url = `/api/v1/documents/loan/${loanId}`;
      
      // Add query parameters for filters
      if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        url += `?${queryParams.toString()}`;
      }
      
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get loan documents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get documents'
      };
    }
  }
  
  /**
   * Get all documents for the current user
   * @param {Object} filters - Optional filters for document type, status, etc.
   * @returns {Promise<Object>} Response with documents list
   */
  async getUserDocuments(filters = {}) {
    try {
      let url = '/api/v1/documents/user';
      
      // Add query parameters for filters
      if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        url += `?${queryParams.toString()}`;
      }
      
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get user documents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get documents'
      };
    }
  }
  
  /**
   * Download a document
   * @param {string} documentId - ID of the document to download
   * @returns {Promise<Object>} Response with download URL or file data
   */
  async downloadDocument(documentId) {
    try {
      const response = await ApiService.get(`/api/v1/documents/download/${documentId}`, {
        responseType: 'blob'
      });
      
      // Log the document download action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Downloaded document: ${response.data.name || documentId}`,
          { documentId }
        );
      } catch (logError) {
        console.warn('Failed to log document download:', logError);
      }
      */
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const filename = response.headers['content-disposition']
        ? response.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
        : `document-${documentId}`;
      
      return {
        success: true,
        data: {
          url,
          filename
        }
      };
    } catch (error) {
      console.error('Document download error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download document'
      };
    }
  }
  
  /**
   * Delete a document
   * @param {string} documentId - ID of the document to delete
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteDocument(documentId) {
    try {
      const response = await ApiService.delete(`/api/v1/documents/${documentId}`);
      
      // Log the document deletion action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Deleted document: ${documentId}`,
          { documentId }
        );
      } catch (logError) {
        console.warn('Failed to log document deletion:', logError);
      }
      */
      
      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error('Document deletion error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete document'
      };
    }
  }
  
  /**
   * Update document status by lender (approve, reject, request changes)
   * @param {string} documentId - ID of the document to update
   * @param {string} status - New status (approved, rejected, needs_changes)
   * @param {string} feedback - Optional feedback message for the borrower
   * @returns {Promise<Object>} Response with update status
   */
  async updateDocumentStatus(documentId, status, feedback = '') {
    try {
      const response = await ApiService.put(`/api/v1/documents/${documentId}/status`, {
        status,
        feedback
      });
      
      // Log the document status update action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Updated document status to ${status}: ${documentId}`,
          { documentId, status }
        );
      } catch (logError) {
        console.warn('Failed to log document status update:', logError);
      }
      */
      
      return {
        success: true,
        data: response.data,
        message: `Document ${status.replace('_', ' ')} successfully`
      };
    } catch (error) {
      console.error('Document status update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update document status'
      };
    }
  }
  
  /**
   * Request additional documents from borrower
   * @param {string} loanId - ID of the loan application
   * @param {Array<Object>} requestedDocuments - Array of document types and descriptions to request
   * @param {string} message - Optional message explaining the request
   * @returns {Promise<Object>} Response with request status
   */
  async requestAdditionalDocuments(loanId, requestedDocuments, message = '') {
    try {
      const response = await ApiService.post(`/api/v1/documents/request/${loanId}`, {
        requestedDocuments,
        message
      });
      
      // Log the document request action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Requested additional documents for loan ${loanId}`,
          { loanId }
        );
      } catch (logError) {
        console.warn('Failed to log document request:', logError);
      }
      */
      
      return {
        success: true,
        data: response.data,
        message: 'Document request sent successfully'
      };
    } catch (error) {
      console.error('Request documents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send document request'
      };
    }
  }
  
  /**
   * Get document verification queue for lenders
   * @param {Object} filters - Optional filters (priority, date range, document type)
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Response with documents pending verification
   */
  async getVerificationQueue(filters = {}, page = 1, limit = 10) {
    try {
      let url = '/api/v1/documents/verification-queue';
      
      // Add query parameters for pagination and filters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      if (Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      
      url += `?${queryParams.toString()}`;
      
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get verification queue error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get verification queue'
      };
    }
  }
  
  /**
   * Update document metadata or status
   * @param {string} documentId - ID of the document to update
   * @param {Object} updateData - New document metadata or status
   * @returns {Promise<Object>} Response with updated document data
   */
  async updateDocument(documentId, updateData) {
    try {
      // Update document details
      const response = await ApiService.put(`/api/v1/documents/${documentId}`, updateData);
      
      // Log the document update action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Updated document: ${updateData.type || ''}`,
          { documentId }
        );
      } catch (logError) {
        console.warn('Failed to log document update:', logError);
      }
      */
      
      return {
        success: true,
        data: response.data,
        message: `Document updated successfully`
      };
    } catch (error) {
      console.error('Document update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update document'
      };
    }
  }

  async requestDocument(borrowerId, loanId, requestData) {
    try {
      const response = await ApiService.post(`/api/v1/documents/request`, {
        borrowerId,
        loanId,
        requestData
      });
      
      // Log the document request action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Requested additional documents for loan ${loanId}`,
          { loanId }
        );
      } catch (logError) {
        console.warn('Failed to log document request:', logError);
      }
      */
      
      return {
        success: true,
        data: response.data,
        message: 'Document request sent successfully'
      };
    } catch (error) {
      console.error('Request documents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send document request'
      };
    }
  }

  async getDocumentRequirements(loanId) {
    try {
      const response = await ApiService.get(`/api/v1/documents/requirements/${loanId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get document requirements error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get document requirements'
      };
    }
  }

  async verifyDocument(documentId, verificationData) {
    try {
      const response = await ApiService.post(`/api/v1/documents/verify/${documentId}`, verificationData);
      
      // Log the document verification action
      // Audit logging temporarily disabled
      /*
      try {
        await AuditLogService.createAuditLog(
          'document',
          `Verified document: ${documentId}`,
          { documentId }
        );
      } catch (logError) {
        console.warn('Failed to log document verification:', logError);
      }
      */
      
      return {
        success: true,
        data: response.data,
        message: 'Document verification completed successfully'
      };
    } catch (error) {
      console.error('Document verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify document'
      };
    }
  }
}

export default new DocumentService();