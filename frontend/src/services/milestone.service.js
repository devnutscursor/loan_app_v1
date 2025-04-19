import api, { handleResponse } from './api.service';
import { createAuditLog } from '../utils/auditLogger';

/**
 * Milestone Service
 * 
 * Handles all API calls related to milestone tracking for loan applications
 */
const MilestoneService = {
  /**
   * Get all milestones for a specific loan
   * 
   * @param {string} loanId - ID of the loan
   * @returns {Promise} Promise object containing milestones and progress data
   */
  getLoanMilestones: (loanId) => {
    return handleResponse(
      api.get(`/milestones/loans/${loanId}/milestones`)
    ).then(response => {
      // Log milestone view for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:view',
          `Viewed milestones for loan`,
          { loanId }
        );
      }
      return response;
    });
  },

  /**
   * Get detailed information about a specific milestone
   * 
   * @param {string} milestoneId - ID of the milestone
   * @returns {Promise} Promise object containing milestone details
   */
  getMilestone: (milestoneId) => {
    return handleResponse(
      api.get(`/milestones/${milestoneId}`)
    ).then(response => {
      // Log milestone detail view for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:detail_view',
          `Viewed milestone details`,
          { milestoneId }
        );
      }
      return response;
    });
  },

  /**
   * Create a new milestone (lender/admin only)
   * 
   * @param {object} milestoneData - Milestone data
   * @returns {Promise} Promise object containing created milestone
   */
  createMilestone: (milestoneData) => {
    return handleResponse(
      api.post('/milestones', milestoneData)
    ).then(response => {
      // Log milestone creation for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:create',
          `Created new milestone for loan`,
          { 
            loanId: milestoneData.loan,
            milestoneName: milestoneData.name 
          }
        );
      }
      return response;
    });
  },

  /**
   * Update a milestone
   * 
   * @param {string} milestoneId - ID of the milestone
   * @param {object} updateData - Data to update
   * @returns {Promise} Promise object containing updated milestone
   */
  updateMilestone: (milestoneId, updateData) => {
    return handleResponse(
      api.patch(`/milestones/${milestoneId}`, updateData)
    ).then(response => {
      // Log milestone update for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:update',
          `Updated milestone`,
          { 
            milestoneId,
            updatedFields: Object.keys(updateData)
          }
        );
      }
      return response;
    });
  },

  /**
   * Update milestone status (lender/admin only)
   * 
   * @param {string} milestoneId - ID of the milestone
   * @param {string} status - New status (pending, current, completed, overdue, waiting)
   * @returns {Promise} Promise object containing result
   */
  updateMilestoneStatus: (milestoneId, status) => {
    return handleResponse(
      api.patch(`/milestones/${milestoneId}`, { status })
    ).then(response => {
      // Log milestone status update for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:status_update',
          `Updated milestone status to ${status}`,
          { milestoneId, status }
        );
      }
      return response;
    });
  },

  /**
   * Add a note to a milestone
   * 
   * @param {string} milestoneId - ID of the milestone
   * @param {string} noteContent - Content of the note
   * @returns {Promise} Promise object containing result
   */
  addMilestoneNote: (milestoneId, noteContent) => {
    return handleResponse(
      api.patch(`/milestones/${milestoneId}`, {
        notes: { content: noteContent }
      })
    ).then(response => {
      // Log note addition for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:add_note',
          `Added note to milestone`,
          { milestoneId }
        );
      }
      return response;
    });
  },

  /**
   * Complete a requirement within a milestone
   * 
   * @param {string} milestoneId - ID of the milestone
   * @param {string} requirementId - ID of the requirement
   * @param {boolean} isCompleted - Whether the requirement is completed
   * @returns {Promise} Promise object containing result
   */
  updateRequirement: (milestoneId, requirementId, isCompleted) => {
    return handleResponse(
      api.patch(`/milestones/${milestoneId}`, {
        requirementId,
        requirements: { isCompleted }
      })
    ).then(response => {
      // Log requirement update for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:update_requirement',
          `${isCompleted ? 'Completed' : 'Reopened'} milestone requirement`,
          { milestoneId, requirementId }
        );
      }
      return response;
    });
  },

  /**
   * Update document status within a milestone
   * 
   * @param {string} milestoneId - ID of the milestone
   * @param {string} documentId - ID of the document
   * @param {boolean} isReceived - Whether the document is received
   * @param {string} documentFileId - ID of the uploaded document file (if received)
   * @returns {Promise} Promise object containing result
   */
  updateDocumentStatus: (milestoneId, documentId, isReceived, documentFileId = null) => {
    return handleResponse(
      api.patch(`/milestones/${milestoneId}`, {
        documentId,
        requiredDocuments: { 
          isReceived, 
          document: documentFileId 
        }
      })
    ).then(response => {
      // Log document status update for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:update_document',
          `${isReceived ? 'Marked document as received' : 'Marked document as pending'} in milestone`,
          { milestoneId, documentId, documentFileId }
        );
      }
      return response;
    });
  },

  /**
   * Delete a milestone (admin only)
   * 
   * @param {string} milestoneId - ID of the milestone to delete
   * @returns {Promise} Promise object containing result
   */
  deleteMilestone: (milestoneId) => {
    return handleResponse(
      api.delete(`/milestones/${milestoneId}`)
    ).then(response => {
      // Log milestone deletion for auditing if successful
      if (response.success) {
        createAuditLog(
          'milestone:delete',
          `Deleted milestone`,
          { milestoneId }
        );
      }
      return response;
    });
  }
};

export default MilestoneService;
