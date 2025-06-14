import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    this.messageListeners = new Map();
  }

  // Initialize socket connection
  connect() {
    if (!this.socket) {
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
        console.log('New message received:', message);
        // Notify all registered listeners
        this.messageListeners.forEach((callback) => {
          callback(message);
        });
      });
    }
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
    this.messageListeners.set(id, callback);
  }

  // Remove a message listener
  removeMessageListener(id) {
    this.messageListeners.delete(id);
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