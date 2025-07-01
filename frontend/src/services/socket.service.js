import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    this.messageListeners = [];
  }

  // Initialize socket connection
  connect() {
    if (!this.socket) {
      console.log('SocketService: Connecting to', this.baseURL);
      this.socket = io(this.baseURL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
      });

      // Set up event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('receive_message', (message) => {
        console.log('SocketService: New message received:', message);
        // Deduplicate before notifying listeners
        this.deduplicateAndNotify({...message, type: 'message'});
      });
      
      // Add event listeners for other notification types
      this.socket.on('milestone_updated', (data) => {
        console.log('SocketService: Milestone updated:', data);
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'milestone'});
        });
      });
      
      this.socket.on('document_requested', (data) => {
        console.log('SocketService: Document requested:', data);
        // Deduplicate document requests before notifying listeners
        this.deduplicateAndNotifyDocumentRequest({...data, type: 'document-request'});
      });
      
      // Add direct listeners for document-request events
      this.socket.on('document-request', (data) => {
        console.log('SocketService: Document request event received:', data);
        // Deduplicate document requests before notifying listeners
        this.deduplicateAndNotifyDocumentRequest({...data, type: 'document-request'});
      });
      
      this.socket.on('document_status_changed', (data) => {
        console.log('SocketService: Document status changed:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status'});
      });
      
      // Add direct listeners for document-status events
      this.socket.on('document-status', (data) => {
        console.log('SocketService: Document status event received:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status'});
      });
      
      // Add listeners for document approval events
      this.socket.on('document-approved', (data) => {
        console.log('SocketService: Document approved event received:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status', status: 'Approved'});
      });
      
      this.socket.on('document_approved', (data) => {
        console.log('SocketService: Document approved event received:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status', status: 'Approved'});
      });
      
      // Add listeners for document rejection events
      this.socket.on('document-rejected', (data) => {
        console.log('SocketService: Document rejected event received:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status', status: 'Rejected'});
      });
      
      this.socket.on('document_rejected', (data) => {
        console.log('SocketService: Document rejected event received:', data);
        // Deduplicate document status updates before notifying listeners
        this.deduplicateAndNotifyDocumentStatus({...data, type: 'document-status', status: 'Rejected'});
      });
      
      this.socket.on('new_lender_message', (data) => {
        console.log('SocketService: New lender message:', data);
        // Deduplicate before notifying listeners
        this.deduplicateAndNotify({...data, type: 'message'});
      });
    }
    return this.socket;
  }

  // Get the current socket instance
  getSocket() {
    return this.socket;
  }

  // Join a room (typically user ID)
  joinRoom(userId) {
    if (this.socket && userId) {
      this.socket.emit('join', userId);
    }
  }

  // Add a message listener
  addMessageListener(id, callback) {
    // Store the callback with its ID
    this.messageListeners.push({
      id,
      callback
    });
  }

  // Remove a message listener
  removeMessageListener(id) {
    // Filter out the listener with the matching ID
    this.messageListeners = this.messageListeners.filter(listener => listener.id !== id);
  }

  // Send a new message
  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('new_message', message);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Helper method to deduplicate messages by content
  deduplicateAndNotify(message) {
    // Only deduplicate messages
    if (message.type !== 'message') {
      this.messageListeners.forEach((listener) => {
        listener.callback(message);
      });
      return;
    }
    
    try {
      // Check if this message is already in localStorage
      const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
      
      // Generate a content signature
      const content = message.content || message.message || '';
      const sender = message.senderName || 
                    (message.sender?.firstName ? `${message.sender.firstName} ${message.sender.lastName || ''}` : 'Lender');
      const newSignature = `New message from ${sender}-${content.substring(0, 40)}`.toLowerCase().trim();
      
      // Check if a similar message already exists
      const isDuplicate = storedMessages.some(msg => {
        const msgContent = msg.description || '';
        const msgTitle = msg.title || '';
        const existingSignature = `${msgTitle}-${msgContent}`.toLowerCase().trim();
        return newSignature === existingSignature;
      });
      
      if (isDuplicate) {
        console.log('SocketService: Skipping duplicate message notification');
        return;
      }
    } catch (e) {
      console.error('SocketService: Error checking for duplicates:', e);
    }
    
    // Notify all registered listeners
    this.messageListeners.forEach((listener) => {
      listener.callback(message);
    });
  }
  
  // Helper method to deduplicate document requests
  deduplicateAndNotifyDocumentRequest(data) {
    // Debug the incoming data
    console.log('SocketService: Processing document request:', data);
    
    try {
      // Check if this document request is already in localStorage
      const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
      
      // Generate a unique ID for this request
      const documentId = data.documentId || data._id || '';
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      
      // If we have a document ID, use that for deduplication
      if (documentId) {
        const isDuplicateById = storedDocuments.some(doc => 
          doc.documentId === documentId || doc.entityId === documentId
        );
        
        if (isDuplicateById) {
          console.log('SocketService: Skipping duplicate document request notification (ID match)');
          return;
        }
      }
      
      // Otherwise, use content-based deduplication
      const timestamp = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
      const newSignature = `Document requested-${documentName}`.toLowerCase().trim();
      
      // Check if a similar document request already exists within the last 5 minutes
      const isDuplicate = storedDocuments.some(doc => {
        // Skip if more than 5 minutes old
        const docTime = doc.timestamp ? new Date(doc.timestamp).getTime() : 0;
        const timeDiff = Math.abs(timestamp - docTime);
        if (timeDiff > 5 * 60 * 1000) return false;
        
        const docTitle = doc.title || '';
        const docDescription = doc.description || '';
        const existingSignature = `${docTitle}-${docDescription}`.toLowerCase().trim();
        
        // Use exact matching for document name
        return existingSignature.includes(documentName.toLowerCase());
      });
      
      if (isDuplicate) {
        console.log('SocketService: Skipping duplicate document request notification (content match)');
        return;
      }
    } catch (e) {
      console.error('SocketService: Error checking for document request duplicates:', e);
    }
    
    // Notify all registered listeners
    this.messageListeners.forEach((listener) => {
      listener.callback(data);
    });
  }
  
  // Helper method to deduplicate document status updates
  deduplicateAndNotifyDocumentStatus(data) {
    // Debug the incoming data
    console.log('SocketService: Processing document status update:', data);
    
    // Always process document approval/rejection events without deduplication
    if (data.type === 'document-approved' || 
        data.type === 'document_approved' || 
        data.eventType === 'document-approved' || 
        data.eventType === 'document_approved' ||
        data.type === 'document-rejected' || 
        data.type === 'document_rejected' ||
        data.eventType === 'document-rejected' || 
        data.eventType === 'document_rejected' ||
        data.status === 'Approved' ||
        data.status === 'approved' ||
        data.status === 'Rejected' ||
        data.status === 'rejected') {
      
      console.log('SocketService: Document approval/rejection event - bypassing deduplication');
      
      // For approval/rejection events, always notify listeners
      this.messageListeners.forEach((listener) => {
        listener.callback(data);
      });
      return;
    }
    
    try {
      // Check if this document status update is already in localStorage
      const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
      
      // Generate a content signature
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const status = data.status || 'updated';
      const newSignature = `Document ${status}-${documentName}`.toLowerCase().trim();
      
      // Check if a similar document status update already exists
      const isDuplicate = storedDocuments.some(doc => {
        const docTitle = doc.title || '';
        const docDescription = doc.description || '';
        const existingSignature = `${docTitle}-${docDescription}`.toLowerCase().trim();
        
        // Use exact matching instead of includes() to avoid false positives
        return existingSignature === newSignature;
      });
      
      if (isDuplicate) {
        console.log('SocketService: Skipping duplicate document status notification');
        return;
      }
    } catch (e) {
      console.error('SocketService: Error checking for document status duplicates:', e);
    }
    
    // Notify all registered listeners
    this.messageListeners.forEach((listener) => {
      listener.callback(data);
    });
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;