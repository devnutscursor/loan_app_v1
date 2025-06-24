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
        // Notify all registered listeners
        this.messageListeners.forEach((listener) => {
          listener.callback({...message, type: 'message'});
        });
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
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'document-request'});
        });
      });
      
      // Add direct listeners for document-request events
      this.socket.on('document-request', (data) => {
        console.log('SocketService: Document request event received:', data);
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'document-request'});
        });
      });
      
      this.socket.on('document_status_changed', (data) => {
        console.log('SocketService: Document status changed:', data);
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'document-status'});
        });
      });
      
      // Add direct listeners for document-status events
      this.socket.on('document-status', (data) => {
        console.log('SocketService: Document status event received:', data);
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'document-status'});
        });
      });
      
      this.socket.on('new_lender_message', (data) => {
        console.log('SocketService: New lender message:', data);
        // Notify registered listeners with type information
        this.messageListeners.forEach((listener) => {
          listener.callback({...data, type: 'message'});
        });
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
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;