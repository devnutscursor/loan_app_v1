import ApiService from './api.service';
import AuditLogService from './auditLog.service';

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
      // First, submit the loan data without documents
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      console.log('Submitting loan application data:', loanData);
      
      // Submit loan data as JSON directly without stringifying individual properties
      const response = await fetch(`${baseURL}/api/v1/borrower/loans/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Loan submission error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      const loanId = data.data._id;
      
      // If there are documents, upload them separately
      if (documents && documents.length > 0) {
        const formData = new FormData();
        
        // Add the loan ID to the form data
        formData.append('loanId', loanId);
        
        // Add documents
        documents.forEach((doc) => {
          formData.append('documents', doc);
        });
        
        // Upload documents
        const uploadResponse = await fetch(`${baseURL}/api/v1/borrower/loans/${loanId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          console.warn('Document upload failed, but loan was created');
        }
      }
      
      // Log the loan application submission
      try {
        await AuditLogService.createAuditLog(
          'loan_submission',
          `Loan application submitted for ${loanData.purpose || 'unspecified purpose'}`,
          {
            loanId: loanId,
            purpose: loanData.purpose
          }
        );
      } catch (logError) {
        console.warn('Failed to create audit log, but loan submission succeeded', logError);
      }
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Loan application submission error:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit loan application'
      };
    }
  }
  
  /**
   * Send a pre-approval letter to the borrower
   * @param {string} loanId - The ID of the loan
   * @returns {Promise<Object>} Response with status of sending the pre-approval letter
   */
  async sendPreApprovalLetter(loanId) {
    try {
      const response = await ApiService.post(`/api/v1/loans/${loanId}/send-pre-approval`);
      
      return {
        success: true,
        data: response.data,
        message: 'Pre-approval letter sent successfully'
      };
    } catch (error) {
      console.error('Error sending pre-approval letter:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send pre-approval letter'
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
      // If this is a loan ID (starts with LN or is a numeric loan number) being used as a draft (for continuing an application)
      // New loan number format is YYYYMMDDXXX (where XXX is a 3-digit sequence)
      const isLoanNumber = draftId && (draftId.startsWith('LN') || /^\d{8,11}$/.test(draftId));
      console.log(`Draft ID: ${draftId}, Is loan number: ${isLoanNumber}`);
      if (isLoanNumber) {
        console.log('Getting loan for draft using loan number:', draftId);
        // Get the loan data first
        const loanResponse = await this.getLoan(draftId);
        if (!loanResponse.success) {
          throw new Error(loanResponse.message || 'Failed to retrieve loan data');
        }
        
        console.log('Loan data retrieved successfully:', loanResponse.data);
        // Convert loan to draft format
        const draftData = await this.convertLoanToDraft(loanResponse.data);

        console.log('Loan converted to draft format:', draftData);
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
          firstName: loanData.data.borrowerDetails?.firstName || '',
          middleName: loanData.data.borrowerDetails?.middleName || '',
          lastName: loanData.data.borrowerDetails?.lastName || '',
          suffix: loanData.data.borrowerDetails?.suffix || '',
          maritalStatus: loanData.data.borrowerDetails?.maritalStatus || '',
          dateOfBirth: loanData.data.borrowerDetails?.dateOfBirth || '',
          ssn: loanData.data.borrowerDetails?.ssn || '',
          citizenship: loanData.data.borrowerDetails?.citizenship || '',
          phone: loanData.data.borrowerDetails?.phone || '',
          email: loanData.data.borrowerDetails?.email || '',
          
          // Dependents
          dependents: loanData.data.borrowerDetails?.dependents || [],
          
          // Address information
          currentAddress: loanData.data.borrowerDetails?.currentAddress || {},
          mailingAddress: loanData.data.borrowerDetails?.mailingAddress || {
            sameAsCurrentAddress: true
          },
          previousAddresses: loanData.data.borrowerDetails?.previousAddresses || [],
          
          // Employment history
          employers: loanData.data.borrowerDetails?.employers || []
        }
      ],
      
      // Property & Loan Details
      propertyInfo: {
        zipCode: loanData.data.property?.zipCode || '',
        
        propertyValue: loanData.data.property?.propertyValue || '',
        propertyType: loanData.data.property?.propertyType || '',
        occupancyType: loanData.data.property?.occupancyType || '',
        numberOfUnits: loanData.data.property?.numberOfUnits || 1,
        yearBuilt: loanData.data.property?.yearBuilt || '',
        // Add fields for property with accepted offer
        hasAcceptedOffer: loanData.data.property?.hasAcceptedOffer || false,
        contractPurchasePrice: loanData.data.property?.contractPurchasePrice || '',
        isMixedUse: loanData.data.property?.isMixedUse || '',
        isManufactured: loanData.data.property?.isManufactured || '',
        proposedRentalIncome: loanData.data.property?.proposedRentalIncome || ''
      },
      
      loanInfo: {
        loanType: loanData.data.loanDetails?.loanType || '',
        loanPurpose: loanData.data.loanDetails?.loanPurpose || '',
        loanAmount: loanData.data.loanDetails?.loanAmount || '',
        loanTerm: loanData.data.loanDetails?.loanTerm || '',
        interestRate: loanData.data.loanDetails?.interestRate || '',
        // Purchase-specific fields
        purchasePrice: loanData.data.loanDetails?.purchasePrice || '',
        downPayment: loanData.data.loanDetails?.downPayment || '',
        // Refinance-specific fields
        yearAcquired: loanData.data.loanDetails?.yearAcquired || '',
        currentLoanBalance: loanData.data.loanDetails?.currentLoanBalance || '',
        requestedLoanAmount: loanData.data.loanDetails?.requestedLoanAmount || '',
        refinanceType: loanData.data.loanDetails?.refinanceType || '',
        // Construction-specific fields
        yearLotAcquired: loanData.data.loanDetails?.yearLotAcquired || '',
        originalCost: loanData.data.loanDetails?.originalCost || '',
        existingLoans: loanData.data.loanDetails?.existingLoans || '',
        presentValueOfLot: loanData.data.loanDetails?.presentValueOfLot || '',
        costOfImprovements: loanData.data.loanDetails?.costOfImprovements || '',
        constructionType: loanData.data.loanDetails?.constructionType || ''
      },
      
      // Assets - Ensure proper structure for the Assets form component
      assets: loanData.data.assets || {
        checkingAndSavings: [],
        stocksAndBonds: [],
        giftsAndGrants: [],
        miscellaneous: {
          earnestMoney: 0,
          lifeInsurance: 0,
          vestedInterestInRetirement: 0,
          otherAssets: 0
        }
      },
      
      // Income - Ensure proper structure for the Income form component
      income: loanData.data.income || {
        baseIncome: '',
        overtime: '',
        commissions: '',
        bonuses: '',
        militaryEntitlements: '',
        otherIncome: []
      },
      
      // Debts and Expenses - Ensure proper array structure for the Debts component
      debts: Array.isArray(loanData.data.debts) ? loanData.data.debts : [],
      expenses: Array.isArray(loanData.data.expenses) ? loanData.data.expenses : [],
      
      // Additional Information
      propertiesOwned: loanData.data.propertiesOwned || {},
      militaryService: {
        hasServed: loanData.data.militaryService?.hasServed || false,
        currentlyServing: loanData.data.militaryService?.currentlyServing || false,
        isRetired: loanData.data.militaryService?.isRetired || false,
        isNonActivated: loanData.data.militaryService?.isNonActivated || false,
        isSurvivingSpouse: loanData.data.militaryService?.isSurvivingSpouse || false,
        serviceBranch: loanData.data.militaryService?.serviceBranch || '',
        serviceType: loanData.data.militaryService?.serviceType || '',
        yearsOfService: loanData.data.militaryService?.yearsOfService || 0,
        dischargeType: loanData.data.militaryService?.dischargeType || '',
        dischargeDate: loanData.data.militaryService?.dischargeDate
          ? new Date(loanData.data.militaryService.dischargeDate).toISOString().split('T')[0]
          : '',
        expirationDate: loanData.data.militaryService?.expirationDate
          ? (typeof loanData.data.militaryService.expirationDate === 'string'
              ? loanData.data.militaryService.expirationDate
              : new Date(loanData.data.militaryService.expirationDate).toISOString().split('T')[0])
          : ''
      },
      
      // Declarations & Demographics
      declarations: loanData.data.declarations || {},
      demographics: loanData.data.demographics || {},
      
      // Metadata
      _id: loanData.data._id,
      loanId: loanData.data._id, // Reference to the original loan
      isExistingLoan: true
    };
    
    console.log('Structured draft data for financial forms:', {
      assets: draftData.assets,
      income: draftData.income,
      debts: draftData.debts,
      expenses: draftData.expenses
    });
    
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
      // Request a large number of loans to effectively get all of them
      const params = { ...filters, limit: 1000 };
      const response = await ApiService.get('/api/v1/borrower/loans', { params });
      
      console.log('Get loans response: from service ', response.data);
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
      // For loan numbers (purely numeric, new pattern is YYYYMMDDNNN), use the by-number endpoint
      const isLoanNumber = /^\d{8,11}$/.test(loanId) || loanId.startsWith('DRAFT-') || loanId.startsWith('LN');
      console.log(`getLoan: loanId=${loanId}, isLoanNumber=${isLoanNumber}`);
      const endpoint = isLoanNumber
        ? `/api/v1/borrower/loans/by-number/${loanId}`
        : `/api/v1/borrower/loans/${loanId}`;
      
      const response = await ApiService.get(endpoint);
      
      // console.log('response.data from getLoan is ', response.data);
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
   * Get milestones for a loan (used for borrower loan details progress)
   * @param {string} loanId - ID of the loan
   * @returns {Promise<Object>} Response with milestones and overall progress
   */
  async getLoanMilestones(loanId) {
    try {
      const response = await ApiService.get(`/api/v1/milestones/loans/${loanId}/milestones`);
      // Backend returns { status, data: { milestones, overallProgress, currentMilestone } }
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error fetching loan milestones:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch loan milestones'
      };
    }
  }

  /**
   * Calculate milestone-based progress on the client side when backend
   * doesn't provide overallProgress explicitly.
   * @param {Array} milestones
   * @returns {number} percentage (0–100)
   */
  calculateMilestoneProgress(milestones) {
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return 0;
    }
    const completedCount = milestones.filter(
      (m) => m.status === 'completed' || m.isCompleted
    ).length;
    const progress = Math.round((completedCount / milestones.length) * 100);
    return Number.isFinite(progress) ? progress : 0;
  }

  /**
   * Remove a document from a borrower's loan
   * @param {string} loanId
   * @param {string} documentId
   * @returns {Promise<Object>}
   */
  async removeDocument(loanId, documentId) {
    try {
      const response = await ApiService.delete(
        `/api/v1/borrower/loans/${loanId}/documents/${documentId}`
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error removing loan document:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove document'
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
      // Create appropriate endpoint based on whether we're using a loan number or MongoDB ID
      const isLoanNumber = /^\d{11}$/.test(loanId) || loanId.startsWith('DRAFT-') || loanId.startsWith('LN');
      const endpoint = isLoanNumber
        ? `/api/v1/borrower/loans/by-number/${loanId}`  // For loan numbers
        : `/api/v1/borrower/loans/${loanId}`;         // For MongoDB IDs
        
      console.log('Loan update endpoint:', endpoint);
      console.log('Loan update data:', updateData);
      const response = await ApiService.put(endpoint, updateData);
      
      // Log information to console instead of using AuditLogService
      console.log(`Loan application ${loanId} updated successfully`);
      
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

  /**
   * Submit a loan application for lender manual creation
   * This method handles the lender-specific flow of creating a borrower first, then the loan
   * @param {Object} loanData - Loan application data
   * @param {Array} documents - Optional documents to upload with application
   * @returns {Promise<Object>} Response with submission status and loan details
   */
  async submitLoanForLender(loanData, documents = []) {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      console.log('Lender loan creation: Starting borrower and loan creation process');
      console.log('Lender loan data:', loanData);

      // Step 1: Create a borrower record first
      // Handle both borrowers array format (from lender page) and borrowerDetails format (from borrower page)
      const borrowerSource = loanData.borrowers?.[0] || loanData.borrowerDetails || {};
      const borrowerData = {
        // Extract borrower information from the form data
        firstName: borrowerSource.firstName || '',
        lastName: borrowerSource.lastName || '',
        email: borrowerSource.email || '',
        phone: borrowerSource.phone || '',
        dateOfBirth: borrowerSource.dateOfBirth || '',
        ssn: borrowerSource.ssn || '',
        maritalStatus: borrowerSource.maritalStatus || '',
        citizenship: borrowerSource.citizenship || '',
        currentAddress: borrowerSource.currentAddress || {},
        employment: borrowerSource.employers?.[0] || {}
      };

      console.log('Creating borrower with data:', borrowerData);

      // Create the borrower record
      const borrowerResponse = await fetch(`${baseURL}/api/v1/lenders/borrowers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(borrowerData)
      });

      if (!borrowerResponse.ok) {
        const errorText = await borrowerResponse.text();
        console.error('Borrower creation error:', borrowerResponse.status, errorText);
        throw new Error(`Failed to create borrower: ${errorText}`);
      }

      const borrowerResult = await borrowerResponse.json();
      const borrowerId = borrowerResult.data._id;
      
      console.log('Borrower created successfully with ID:', borrowerId);

      // Step 2: Now create the loan with the borrower ID
      // Fix data types and add missing fields for loan validation
      // Handle both property formats (property from borrower page, propertyInfo from lender page)
      const propertyData = loanData.property || loanData.propertyInfo || {};
      // Handle both loan formats (loanDetails from borrower page, loanInfo from lender page)
      const loanInfoData = loanData.loanDetails || loanData.loanInfo || {};

      const processedLoanData = {
        ...loanData,
        // Keep string values for enum fields - backend expects "Yes"/"No" strings
        propertyInfo: {
          ...propertyData,
          hasAcceptedOffer: propertyData.hasAcceptedOffer === "Yes" || propertyData.hasAcceptedOffer === true,
          isMixedUse: propertyData.isMixedUse || "No", // Keep as string, default to "No"
          isManufactured: propertyData.isManufactured || "No" // Keep as string, default to "No"
        },
        // Ensure loanInfo is available for backend processing
        loanInfo: loanInfoData,
        // Fix debts array - add required id field to each debt
        debts: Array.isArray(loanData.debts) ? loanData.debts.map((debt, index) => ({
          ...debt,
          id: debt.id || `debt-${Date.now()}-${index}` // Add required id field
        })) : [],
        // Fix expenses array - add id field if needed
        expenses: Array.isArray(loanData.expenses) ? loanData.expenses.map((expense, index) => ({
          ...expense,
          id: expense.id || `expense-${Date.now()}-${index}`
        })) : []
      };

      const loanSubmissionData = {
        ...processedLoanData,
        borrower: borrowerId, // Add the required borrower ID
        submittedByLender: true,
        submissionSource: "manual",
        lenderSubmission: {
          createdAt: new Date().toISOString(),
          source: "lender_manual_creation",
          validationPassed: true,
          borrowerCreated: true,
          borrowerId: borrowerId
        }
      };

      console.log('Creating loan with borrower ID:', borrowerId);
      console.log('Loan submission data:', loanSubmissionData);

      // Submit the loan data
      const loanResponse = await fetch(`${baseURL}/api/v1/borrower/loans/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loanSubmissionData)
      });

      if (!loanResponse.ok) {
        const errorText = await loanResponse.text();
        console.error('Loan creation error:', loanResponse.status, errorText);
        throw new Error(`Failed to create loan: ${errorText}`);
      }

      const loanResult = await loanResponse.json();
      const loanId = loanResult.data._id;

      console.log('Loan created successfully with ID:', loanId);

      // Step 3: Handle document uploads if any
      if (documents && documents.length > 0) {
        const formData = new FormData();
        formData.append('loanId', loanId);
        
        documents.forEach((doc) => {
          formData.append('documents', doc);
        });
        
        const uploadResponse = await fetch(`${baseURL}/api/v1/borrower/loans/${loanId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          console.warn('Document upload failed, but loan was created');
        }
      }

      // Step 4: Log the successful creation
      try {
        await AuditLogService.createAuditLog(
          'lender_loan_creation',
          `Lender manually created loan application for borrower ${borrowerResult.data.firstName} ${borrowerResult.data.lastName}`,
          {
            loanId: loanId,
            borrowerId: borrowerId,
            source: 'lender_manual_creation'
          }
        );
      } catch (logError) {
        console.warn('Failed to create audit log, but loan creation succeeded', logError);
      }

      return {
        success: true,
        data: loanResult.data,
        borrower: borrowerResult.data
      };

    } catch (error) {
      console.error('Lender loan creation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create loan application for lender'
      };
    }
  }

  /**
   * Get available loan types
   * @returns {Promise<Object>} Response with available loan types
   */
  async getLoanTypes() {
    try {
      const response = await ApiService.get('/api/v1/borrower/loan-types');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching loan types:', error);
      
      // Return default loan types as fallback
      return {
        success: true,
        data: [
          { id: 'conventional', name: 'Conventional', description: 'Traditional mortgage loan' },
          { id: 'fha', name: 'FHA', description: 'Federal Housing Administration loan' },
          { id: 'va', name: 'VA', description: 'Veterans Affairs loan' },
          { id: 'fsa_rhs', name: 'FSA/RHS-Guaranteed', description: 'FSA/RHS-Guaranteed (USDA SFH Guaranteed / RHS)' },
          { id: 'jumbo', name: 'Jumbo', description: 'Loan exceeding conforming loan limits' }
        ]
      };
    }
  }
}

export default new LoanService();
