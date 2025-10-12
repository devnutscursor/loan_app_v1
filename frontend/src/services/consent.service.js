import api from './api';

/**
 * Consent Service
 * Handles credit report consent operations
 */
const ConsentService = {
  /**
   * Check credit report consent status
   * @param {String} borrowerId - Optional: borrower ID (required for lender/company roles)
   * @returns {Promise<Object>} Consent status data
   */
  async checkCreditReportConsentStatus(borrowerId = null) {
    try {
      const url = borrowerId 
        ? `/consent/credit-report/status?borrowerId=${borrowerId}`
        : '/consent/credit-report/status';
      
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error checking consent status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: {
          hasConsent: false
        }
      };
    }
  },

  /**
   * Grant credit report consent
   * @param {Object} params - Consent parameters
   * @param {String} params.borrowerId - Optional: borrower ID (for lender recording consent)
   * @param {String} params.consentMethod - Method of consent
   * @param {String} params.notes - Optional: additional notes
   * @returns {Promise<Object>} Grant consent result
   */
  async grantCreditReportConsent({ borrowerId = null, consentMethod = 'application_submission', notes = null } = {}) {
    try {
      const payload = {
        consentMethod,
        ...(borrowerId && { borrowerId }),
        ...(notes && { notes })
      };
      
      const response = await api.post('/consent/credit-report', payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error granting consent:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Revoke credit report consent
   * @param {String} borrowerId - Optional: borrower ID (for admin revoking consent)
   * @returns {Promise<Object>} Revoke consent result
   */
  async revokeCreditReportConsent(borrowerId = null) {
    try {
      const payload = borrowerId ? { borrowerId } : {};
      const response = await api.post('/consent/credit-report/revoke', payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error revoking consent:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Send consent request email to borrower
   * @param {Object} params - Request parameters
   * @param {String} params.borrowerId - Borrower ID
   * @param {String} params.loanId - Optional: loan ID
   * @returns {Promise<Object>} Email send result
   */
  async sendConsentRequestEmail({ borrowerId, loanId = null }) {
    try {
      const payload = {
        borrowerId,
        ...(loanId && { loanId })
      };
      
      const response = await api.post('/consent-email/send-email', payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error sending consent email:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Check token status
   * @param {String} tokenId - Token ID
   * @returns {Promise<Object>} Token status
   */
  async checkTokenStatus(tokenId) {
    try {
      const response = await api.get(`/consent-email/token-status/${tokenId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error checking token status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};

export default ConsentService;

