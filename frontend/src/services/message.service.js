import api from './api.service';
import messageApi from './api/message.service';

/**
 * Message Service
 * 
 * Handles all message-related functionality, including sending messages,
 * retrieving conversations, and managing message state.
 */
class MessageService {
  /**
   * Get all conversations for the current user
   */
  static async getConversations() {
    try {
      const response = await messageApi.getConversations();
      return {
        success: true,
        data: response || []
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: false,
        error: error.message || 'Failed to load conversations'
      };
    }
  }

  /**
   * Get all messages for a specific conversation with a borrower
   */
  static async getMessages(borrowerId) {
    try {
      const response = await messageApi.getMessages(borrowerId);
      return {
        success: true,
        data: response || []
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return {
        success: false,
        error: error.message || 'Failed to load messages'
      };
    }
  }

  /**
   * Send a message to a specific borrower
   */
  static async sendMessage(borrowerId, content, attachments = []) {
    try {
      const response = await messageApi.sendMessage(borrowerId, content, attachments);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Upload an attachment
   */
  static async uploadAttachment(file) {
    try {
      const response = await messageApi.uploadAttachment(file);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload attachment'
      };
    }
  }

  /**
   * Get the unread message count for the current user
   */
  static async getUnreadCount() {
    try {
      const unreadCount = await messageApi.getUnreadCount();
      return {
        success: true,
        data: { unreadCount }
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        error: error.message || 'Failed to get unread count',
        data: { unreadCount: 0 }
      };
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  static async markAsRead(borrowerId) {
    try {
      // The backend handles marking messages as read when retrieving them
      // This function exists for API compatibility with the existing MessageCenter component
      await messageApi.getMessages(borrowerId);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark messages as read'
      };
    }
  }

  /**
   * Delete a message (placeholder for future functionality)
   */
  static async deleteMessage(messageId) {
    // This function is a placeholder for future functionality
    return {
      success: false,
      error: 'Message deletion is not supported'
    };
  }
}

export default MessageService;
