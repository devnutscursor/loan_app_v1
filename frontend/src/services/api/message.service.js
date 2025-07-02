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
      // Always use FormData for consistency, whether there are attachments or not
      const formData = new FormData();
      formData.append('borrowerId', borrowerId);
      
      // Add content if provided (could be empty for image-only messages)
      if (content) {
        formData.append('content', content);
      } else {
        // Ensure we always have some content, even if empty
        formData.append('content', '');
      }
      
      // Check if we have file objects or just file data
      if (attachments.length > 0) {
        // Check if attachments are File objects or just data objects
        const hasFileObjects = attachments.some(att => att instanceof File || att.file);
        
        if (hasFileObjects) {
        // Append each attachment to the form data
          attachments.forEach(attachment => {
            // If attachment is a File object, use it directly
            if (attachment instanceof File) {
              formData.append('attachments', attachment);
            } 
            // If attachment has a file property (from file input), use that
            else if (attachment.file) {
              formData.append('attachments', attachment.file);
            }
          });
        } else {
          // Just data objects, add as JSON
          formData.append('attachmentData', JSON.stringify(attachments));
        }
      }
      
      console.log('Sending message with FormData:', {
        borrowerId,
        hasContent: !!content,
        attachmentsCount: attachments.length
        });
        
        const response = await api.post('/messages/send', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
      
        return response.data;
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