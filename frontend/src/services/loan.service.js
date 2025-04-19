import ApiService from './api.service';
import { AuditLogService } from './index';

/**
 * Loan Service
 * 
 * Provides methods for loan application management, including submission,
 * retrieval, updates, and progress tracking. Handles loan application lifecycle.
 */
class LoanService {
  /**
   * Submit a new loan application
   * @param {Object} loanData - Loan application data
   * @param {Array} documents - Optional documents to upload with application
   * @returns {Promise<Object>} Response with submission status and loan details
   */
  async submitApplication(loanData, documents = []) {
    try {
      console.log('LOAN SERVICE - Start submission, data keys:', Object.keys(loanData));
      console.log('LOAN SERVICE - BorrowerDetails before processing:', loanData.borrowerDetails);
      
      // Debug the structure of borrower details
      if (loanData.borrowerDetails) {
        console.log('LOAN SERVICE - Borrower dependents:', loanData.borrowerDetails.dependents);
        console.log('LOAN SERVICE - Borrower employers:', loanData.borrowerDetails.employers);
        console.log('LOAN SERVICE - Borrower previousAddresses:', loanData.borrowerDetails.previousAddresses);
      }
      
      // Create a new object with all properties stringified
      const formattedData = {};
      
      // Process each field to ensure proper formatting
      for (const [key, value] of Object.entries(loanData)) {
        if (key === 'documents') continue; // Skip documents
        
        // Convert objects to JSON strings
        if (value !== null && typeof value === 'object') {
          formattedData[key] = JSON.stringify(value);
          console.log(`LOAN SERVICE - Field ${key} converted to JSON string, length: ${formattedData[key].length}`);
          
          // Log sample of stringified data for debugging
          if (key === 'borrowerDetails') {
            console.log('LOAN SERVICE - BorrowerDetails sample (first 100 chars):', 
              formattedData[key].substring(0, 100) + '...');
          }
        } else {
          formattedData[key] = value;
        }
      }
      
      // Debug: log keys and values in formattedData
      console.log('LOAN SERVICE - formattedData keys:', Object.keys(formattedData));
      console.log('LOAN SERVICE - formattedData values sample:', 
        Object.entries(formattedData).slice(0, 3).map(([k, v]) => 
          `${k}: ${typeof v === 'string' && v.length > 30 ? v.substring(0, 30) + '...' : v}`
        )
      );
      
      console.log('formattedData', formattedData);
      // Create form data for file upload
      const formData = new FormData();
      
      // Add all formatted fields to formData
      for (const [key, value] of Object.entries(formattedData)) {
        if (value !== null && value !== undefined) {
          try {
            // Make sure we're adding a string value to FormData
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            formData.append(key, stringValue);
            console.log(`LOAN SERVICE - Successfully appended ${key} to FormData, length: ${stringValue.length}`);
          } catch (err) {
            console.error(`LOAN SERVICE - Error appending ${key} to FormData:`, err);
          }
        }
      }
      
      // Add documents if any
      if (documents && documents.length > 0) {
        console.log(`LOAN SERVICE - Adding ${documents.length} documents to FormData`);
        documents.forEach((doc, index) => {
          formData.append('documents', doc);
          console.log(`LOAN SERVICE - Added document ${index + 1}: ${doc.name}, size: ${doc.size}, type: ${doc.type}`);
        });
      } 
      
      console.log('Sending formatted loan data to backend');
      // Debug FormData contents
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (key === 'documents') {
          console.log(`${key}: [File object], size: ${value.size || 'unknown'}`);
        } else {
          console.log(`${key}: ${typeof value === 'string' ? `${value.substring(0, 30)}... (length: ${value.length})` : value}`);
        }
      }

      console.log('formData', formData);
      // Don't set Content-Type header manually - let the browser set it with the correct boundary
      const response = await ApiService.post('/api/v1/borrower/loans', formData);
      
      // Log the loan application submission
      try {
        await AuditLogService.createAuditLog(
          'loan_submission',
          `Loan application submitted for ${loanData.purpose || 'unspecified purpose'}`,
          {
            loanId: response.data._id,
            purpose: loanData.purpose
          }
        );
      } catch (logError) {
        // Continue even if logging fails
        console.warn('Failed to create audit log, but loan submission succeeded', logError);
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Loan application submission error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit loan application'
      };
    }
  }
  
  /**
   * Save loan application as draft
   * @param {Object} draftData - Loan application draft data
   * @returns {Promise<Object>} Response with save status and draft details
   */
  async saveDraft(draftData) {
    try {
      const response = await ApiService.post('/api/v1/borrower/loans/draft', draftData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Loan draft save error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save loan application draft'
      };
    }
  }
  
  /**
   * Get loan application draft
   * @param {string} draftId - Draft ID to retrieve, if undefined returns most recent draft
   * @returns {Promise<Object>} Response with draft data
   */
  async getDraft(draftId) {
    try {
      // If this is a loan ID being used as a draft (for continuing an application)
      if (draftId && draftId.startsWith('LN')) {
        // Get the loan data first
        const loanResponse = await this.getLoan(draftId);
        if (!loanResponse.success) {
          throw new Error(loanResponse.message || 'Failed to retrieve loan data');
        }
        
        // Convert loan to draft format
        const draftData = await this.convertLoanToDraft(loanResponse.data);
        return {
          success: true,
          data: draftData
        };
      }
      
      // Regular draft retrieval
      const url = draftId 
        ? `/api/v1/borrower/loans/draft/${draftId}` 
        : '/api/v1/borrower/loans/draft/recent';
        
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Loan draft retrieval error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve loan application draft'
      };
    }
  }
  
  /**
   * Convert a loan to draft format for editing
   * @param {Object} loanData - The loan data to convert to draft format
   * @returns {Object} Draft format of the loan data
   */
  async convertLoanToDraft(loanData) {
    console.log('Converting loan to draft format:', loanData);
    
    // Create a draft structure that matches the form's expected structure
    const draftData = {
      borrowers: [
        {
          // Primary borrower personal details
          firstName: loanData.borrowerDetails?.firstName || '',
          middleName: loanData.borrowerDetails?.middleName || '',
          lastName: loanData.borrowerDetails?.lastName || '',
          suffix: loanData.borrowerDetails?.suffix || '',
          maritalStatus: loanData.borrowerDetails?.maritalStatus || '',
          dateOfBirth: loanData.borrowerDetails?.dateOfBirth || '',
          ssn: loanData.borrowerDetails?.ssn || '',
          citizenship: loanData.borrowerDetails?.citizenship || '',
          phone: loanData.borrowerDetails?.phone || '',
          email: loanData.borrowerDetails?.email || '',
          
          // Dependents
          dependents: loanData.borrowerDetails?.dependents || [],
          
          // Address information
          currentAddress: loanData.borrowerDetails?.currentAddress || {},
          mailingAddress: loanData.borrowerDetails?.mailingAddress || {
            sameAsCurrentAddress: true
          },
          previousAddresses: loanData.borrowerDetails?.previousAddresses || [],
          
          // Employment history
          employers: loanData.borrowerDetails?.employers || []
        }
      ],
      
      // Property & Loan Details
      propertyInfo: {
        address: {
          streetAddress: loanData.property?.addressLine1 || '',
          aptSteNum: loanData.property?.addressLine2 || '',
          city: loanData.property?.city || '',
          state: loanData.property?.state || '',
          zipCode: loanData.property?.zipCode || ''
        },
        propertyValue: loanData.property?.propertyValue || '',
        propertyType: loanData.property?.propertyType || '',
        occupancyType: loanData.property?.occupancyType || '',
        numberOfUnits: loanData.property?.numberOfUnits || 1,
        yearBuilt: loanData.property?.yearBuilt || ''
      },
      
      loanInfo: {
        loanType: loanData.loanDetails?.loanType || '',
        loanPurpose: loanData.loanDetails?.loanPurpose || '',
        loanAmount: loanData.loanDetails?.loanAmount || '',
        loanTerm: loanData.loanDetails?.loanTerm || '',
        interestRate: loanData.loanDetails?.interestRate || ''
      },
      
      // Assets & Debts
      assets: loanData.assets || {
        bankAccounts: [],
        otherAssets: []
      },
      income: loanData.income || {
        baseIncome: '',
        overtime: '',
        commissions: '',
        bonuses: '',
        militaryEntitlements: '',
        otherIncome: []
      },
      debts: loanData.debts || [],
      expenses: loanData.expenses || [],
      
      // Additional Information
      propertiesOwned: loanData.propertiesOwned || [],
      militaryService: loanData.militaryService || {
        isMilitary: false,
        serviceStatus: '',
        dateOfService: ''
      },
      
      // Declarations & Demographics
      declarations: loanData.declarations || {},
      demographics: loanData.demographics || {},
      
      // Metadata
      _id: loanData._id,
      loanId: loanData._id, // Reference to the original loan
      isExistingLoan: true
    };
    
    return draftData;
  }
  
  /**
   * Delete a loan application draft
   * @param {string} draftId - Draft ID to delete
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteDraft(draftId) {
    try {
      const response = await ApiService.delete(`/api/v1/borrower/loans/draft/${draftId}`);
      
      return {
        success: true,
        message: response.data.message || 'Draft deleted successfully'
      };
    } catch (error) {
      console.error('Loan draft deletion error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete loan application draft'
      };
    }
  }
  
  /**
   * Get all loan applications for the current borrower
   * @param {Object} filters - Optional filters for the loans list
   * @returns {Promise<Object>} Response with loans list
   */
  async getLoans(filters = {}) {
    try {
      const response = await ApiService.get('/api/v1/borrower/loans', { params: filters });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get loans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve loan applications'
      };
    }
  }
  
  /**
   * Get a single loan application details
   * @param {string} loanId - ID of the loan to retrieve
   * @returns {Promise<Object>} Response with loan details
   */
  async getLoan(loanId) {
    try {
      const response = await ApiService.get(`/api/v1/borrower/loans/${loanId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get loan details error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve loan application details'
      };
    }
  }
  
  /**
   * Update a loan application (pre-submission)
   * @param {string} loanId - ID of the loan to update
   * @param {Object} updateData - Updated loan data
   * @returns {Promise<Object>} Response with update status and updated loan details
   */
  async updateLoan(loanId, updateData) {
    try {
      const response = await ApiService.put(`/borrower/loans/${loanId}`, updateData);
      
      // Log the loan application update
      await AuditLogService.createLog({
        eventType: 'loan',
        action: 'update',
        details: `Loan application updated`,
        resourceId: loanId
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update loan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update loan application'
      };
    }
  }
  
  /**
   * Submit a new loan application (alias for submitApplication)
   * @param {Object} loanData - Loan application data
   * @param {Array} documents - Optional documents to upload with application
   * @returns {Promise<Object>} Response with submission status and loan details
   */
  async submitLoan(loanData, documents = []) {
    return this.submitApplication(loanData, documents);
  }
}

export default new LoanService();
