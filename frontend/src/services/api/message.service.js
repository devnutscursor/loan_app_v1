import api from '../api';

// Message Service for API calls related to messaging between lenders and borrowers
const messageService = {
  // Get all conversations for the current user (lender or borrower)
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages between current user and a borrower
  getMessages: async (borrowerId) => {
    try {
      const response = await api.get(`/messages/${borrowerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message to a borrower/lender
  sendMessage: async (borrowerId, content, attachments = []) => {
    try {
      if (attachments.length === 0) {
        // Simple text message
        const response = await api.post('/messages/send', {
          borrowerId,
          content
        });
        return response.data;
      } else {
        // Message with attachments
        const formData = new FormData();
        formData.append('borrowerId', borrowerId);
        if (content) formData.append('content', content);
        
        // Append each attachment to the form data
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        const response = await api.post('/messages/send', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Upload attachment
  uploadAttachment: async (file) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      
      const response = await api.post('/messages/upload-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread/count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
};

export default messageService; 