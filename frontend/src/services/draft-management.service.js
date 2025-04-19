import { LoanService } from './index';

/**
 * Draft Management Service
 * 
 * Provides functionality for managing loan application drafts,
 * including saving, retrieving, listing, and deleting drafts.
 */
class DraftManagementService {
  constructor() {
    this.cachedDrafts = null;
    this.currentDraft = null;
  }

  /**
   * Get all drafts for the current user
   * @param {boolean} forceRefresh - Whether to force a refresh from the server
   * @returns {Promise<Object>} Response with drafts
   */
  async getAllDrafts(forceRefresh = false) {
    try {
      // Return cached drafts if available and refresh not forced
      if (this.cachedDrafts && !forceRefresh) {
        return {
          success: true,
          data: this.cachedDrafts
        };
      }
      
      const response = await LoanService.getDrafts();
      
      if (response.success) {
        this.cachedDrafts = response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Get all drafts error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve drafts'
      };
    }
  }

  /**
   * Get a specific draft
   * @param {string} draftId - ID of the draft to retrieve
   * @returns {Promise<Object>} Response with draft data
   */
  async getDraft(draftId) {
    try {
      const response = await LoanService.getDraft(draftId);
      
      if (response.success) {
        this.currentDraft = response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Get draft error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve draft'
      };
    }
  }

  /**
   * Get the most recent draft
   * @returns {Promise<Object>} Response with most recent draft data
   */
  async getMostRecentDraft() {
    try {
      const response = await LoanService.getDraft(); // No ID gets most recent
      
      if (response.success) {
        this.currentDraft = response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Get most recent draft error:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve most recent draft'
      };
    }
  }

  /**
   * Save a draft
   * @param {Object} draftData - Draft data to save
   * @param {string} draftId - Optional draft ID for updating existing draft
   * @returns {Promise<Object>} Response with saved draft
   */
  async saveDraft(draftData, draftId = null) {
    try {
      // Merge with draft ID if provided
      const dataToSave = draftId ? { ...draftData, draftId } : draftData;
      
      const response = await LoanService.saveDraft(dataToSave);
      
      if (response.success) {
        // Update current draft
        this.currentDraft = response.data;
        
        // Invalidate cached drafts list
        this.cachedDrafts = null;
      }
      
      return response;
    } catch (error) {
      console.error('Save draft error:', error);
      return {
        success: false,
        message: error.message || 'Failed to save draft'
      };
    }
  }

  /**
   * Delete a draft
   * @param {string} draftId - ID of the draft to delete
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteDraft(draftId) {
    try {
      const response = await LoanService.deleteDraft(draftId);
      
      if (response.success) {
        // Clear current draft if it was the deleted one
        if (this.currentDraft && this.currentDraft._id === draftId) {
          this.currentDraft = null;
        }
        
        // Invalidate cached drafts list
        this.cachedDrafts = null;
      }
      
      return response;
    } catch (error) {
      console.error('Delete draft error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete draft'
      };
    }
  }

  /**
   * Get the current draft in memory
   * @returns {Object|null} Current draft or null
   */
  getCurrentDraft() {
    return this.currentDraft;
  }

  /**
   * Clear the current draft from memory
   */
  clearCurrentDraft() {
    this.currentDraft = null;
  }

  /**
   * Convert a draft to a submitted application
   * @param {string} draftId - ID of the draft to convert
   * @param {Array} documents - Optional documents to upload with application
   * @returns {Promise<Object>} Response with submission status
   */
  async submitDraftAsApplication(draftId, documents = []) {
    try {
      // First, get the draft
      const draftResponse = await this.getDraft(draftId);
      
      if (!draftResponse.success) {
        return draftResponse;
      }
      
      // Submit as an application
      const submitResponse = await LoanService.submitApplication(draftResponse.data, documents);
      
      if (submitResponse.success) {
        // Delete the draft after successful submission
        await this.deleteDraft(draftId);
      }
      
      return submitResponse;
    } catch (error) {
      console.error('Submit draft as application error:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit draft as application'
      };
    }
  }

  /**
   * Check if there are any unsaved changes
   * @param {Object} currentFormData - Current form data
   * @returns {boolean} Whether there are unsaved changes
   */
  hasUnsavedChanges(currentFormData) {
    if (!this.currentDraft || !currentFormData) {
      return false;
    }
    
    // Compare relevant fields, ignoring metadata
    const draftData = this.currentDraft;
    
    // Helper function to compare objects recursively
    const isEqual = (obj1, obj2) => {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) {
        return false;
      }
      
      for (const key of keys1) {
        // Skip metadata fields
        if (['_id', 'createdAt', 'updatedAt', 'userId', '__v'].includes(key)) {
          continue;
        }
        
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
          if (!isEqual(val1, val2)) {
            return false;
          }
        } else if (val1 !== val2) {
          return false;
        }
      }
      
      return true;
    };
    
    return !isEqual(draftData, currentFormData);
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cachedDrafts = null;
    this.currentDraft = null;
  }
}

export default new DraftManagementService();
