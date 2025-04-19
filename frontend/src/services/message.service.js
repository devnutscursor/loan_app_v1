import api, { handleResponse } from './api.service';
import { createAuditLog } from '../utils/auditLogger';

/**
 * Message Service
 * 
 * Handles all API calls related to messaging functionality between borrowers and lenders
 */
const MessageService = {
  /**
   * Get all conversations for the current user
   * 
   * @returns {Promise} Promise object containing conversations list
   */
  getConversations: () => {
    return handleResponse(api.get('/messages/conversations'));
  },

  /**
   * Get or create a conversation with a specific user
   * 
   * @param {string} participantId - ID of the conversation participant (user to chat with)
   * @param {string} loanId - Optional loan ID to associate with conversation
   * @returns {Promise} Promise object containing conversation data
   */
  getOrCreateConversation: (participantId, loanId = null) => {
    return handleResponse(
      api.post('/messages/conversations', {
        participantId,
        loanId
      })
    );
  },

  /**
   * Get messages for a specific conversation
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of messages per page
   * @returns {Promise} Promise object containing messages and pagination data
   */
  getMessages: (conversationId, page = 1, limit = 50) => {
    return handleResponse(
      api.get(`/messages/conversations/${conversationId}/messages`, {
        params: { page, limit }
      })
    ).then(response => {
      // Log message view for auditing if successful
      if (response.success) {
        createAuditLog(
          'message:view',
          `Viewed conversation messages`,
          { conversationId, page, limit }
        );
      }
      return response;
    });
  },

  /**
   * Send a message in a conversation
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {string} content - Message content
   * @param {Array} attachments - Optional array of file attachments
   * @returns {Promise} Promise object containing the created message
   */
  sendMessage: (conversationId, content, attachments = []) => {
    return handleResponse(
      api.post('/messages', {
        conversationId,
        content,
        attachments
      })
    ).then(response => {
      // Log message sent for auditing if successful
      if (response.success) {
        createAuditLog(
          'message:send',
          `Sent message in conversation`,
          { conversationId, hasAttachments: attachments.length > 0 }
        );
      }
      return response;
    });
  },

  /**
   * Mark all messages in a conversation as read
   * 
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise} Promise object containing result
   */
  markAsRead: (conversationId) => {
    return handleResponse(
      api.patch(`/messages/conversations/${conversationId}/read`)
    );
  },

  /**
   * Delete a conversation (soft delete)
   * 
   * @param {string} conversationId - ID of the conversation to delete
   * @returns {Promise} Promise object containing result
   */
  deleteConversation: (conversationId) => {
    return handleResponse(
      api.delete(`/messages/conversations/${conversationId}`)
    ).then(response => {
      // Log conversation deletion for auditing if successful
      if (response.success) {
        createAuditLog(
          'message:delete_conversation',
          `Deleted conversation`,
          { conversationId }
        );
      }
      return response;
    });
  },

  /**
   * Upload file attachment for message
   * 
   * @param {File} file - File object to upload
   * @returns {Promise} Promise containing file metadata
   */
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return handleResponse(
      api.post('/documents/uploads/message-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    );
  }
};

export default MessageService;
