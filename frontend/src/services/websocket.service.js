import AuthService from './auth.service';
import NotificationService from './notification.service';
import toast from 'react-hot-toast';

/**
 * WebSocket Service
 * 
 * Manages real-time communication with the backend server using WebSockets.
 * Handles connection, reconnection, authentication, and message processing.
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.messageHandlers = {};
    this.listeners = {};
    this.connectionPromise = null;
    this.reconnectInterval = 3000; // Initial reconnect delay in ms
  }

  /**
   * Initialize WebSocket connection
   * @returns {Promise<boolean>} Success status of the connection
   */
  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Get the API URL from environment or use default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = apiUrl.replace(/^https?:/, wsProtocol).replace(/\/api$/, '');
        
        // Create WebSocket connection
        this.socket = new WebSocket(`${wsUrl}/ws`);
        
        // Connection opened
        this.socket.addEventListener('open', (event) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connection established');
          
          // Authenticate the connection
          this.authenticate();
          
          // Resolve the promise
          resolve(true);
        });
        
        // Connection closed
        this.socket.addEventListener('close', (event) => {
          this.isConnected = false;
          console.log('WebSocket connection closed', event.code, event.reason);
          
          // Attempt to reconnect if not closed deliberately
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
          
          this.connectionPromise = null;
        });
        
        // Connection error
        this.socket.addEventListener('error', (event) => {
          console.error('WebSocket connection error:', event);
          if (!this.isConnected) {
            reject(new Error('Failed to establish WebSocket connection'));
            this.connectionPromise = null;
          }
        });
        
        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          this.handleMessage(event.data);
        });
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }

  /**
   * Authenticate the WebSocket connection with JWT
   */
  authenticate() {
    const token = AuthService.getToken();
    if (token && this.isConnected) {
      this.send({
        type: 'authenticate',
        token
      });
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting to WebSocket...');
      this.connect()
        .catch(error => {
          console.error('Reconnection failed:', error);
        });
    }, delay);
  }

  /**
   * Calculate reconnect delay with exponential backoff
   * @returns {number} Delay in milliseconds
   */
  calculateReconnectDelay() {
    // Exponential backoff with jitter
    const baseDelay = this.reconnectInterval;
    const maxDelay = 30000; // Maximum delay of 30 seconds
    
    // Calculate exponential backoff
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    // Add jitter (random value between 0 and 1000ms)
    const jitter = Math.random() * 1000;
    
    // Return the delay capped at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Close the WebSocket connection
   */
  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.close(1000, 'User disconnected');
      this.isConnected = false;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.connectionPromise = null;
  }

  /**
   * Send a message through the WebSocket
   * @param {Object} data - Data to send
   * @returns {boolean} Success status
   */
  send(data) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {string} data - Raw message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      // Log received message (except for heartbeats to reduce noise)
      if (message.type !== 'heartbeat') {
        console.log('WebSocket message received:', message);
      }
      
      // Handle different message types
      switch (message.type) {
        case 'notification':
          this.handleNotification(message.data);
          break;
          
        case 'auth_success':
          console.log('WebSocket authentication successful');
          break;
          
        case 'auth_error':
          console.error('WebSocket authentication failed:', message.error);
          // Attempt to refresh token and authenticate again
          AuthService.refreshToken()
            .then(() => this.authenticate())
            .catch(error => console.error('Token refresh failed:', error));
          break;
          
        case 'heartbeat':
          // Respond to heartbeat
          this.send({ type: 'heartbeat_ack' });
          break;
          
        default:
          // Handle custom event handlers
          if (this.messageHandlers[message.type]) {
            this.messageHandlers[message.type](message.data);
          }
          
          // Trigger event for any listeners
          this.triggerEvent(message.type, message.data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, data);
    }
  }

  /**
   * Handle notification message
   * @param {Object} notification - Notification data
   */
  handleNotification(notification) {
    // Mark message notifications as persistent
    if (notification.entityType === 'message' || 
        notification.type === 'message' ||
        notification.title?.toLowerCase().includes('message') ||
        notification.description?.toLowerCase().includes('message')) {
      notification.persistent = true;
      
      // Ensure it has the message entityType for consistent filtering
      if (!notification.entityType) {
        notification.entityType = 'message';
      }
      
      // Set icon to MessageSquare if not specified
      if (!notification.icon) {
        notification.icon = 'MessageSquare';
      }
      
      // Add timestamp if missing
      if (!notification.timestamp) {
        notification.timestamp = new Date().toISOString();
      }
      
      // Generate ID if missing
      if (!notification.id) {
        notification.id = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Save to message-specific storage
      try {
        const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
        
        // Generate a content key for more reliable deduplication
        const contentKey = `${notification.title}-${notification.message || notification.description || ''}`;
        
        // Check if this message already exists in storage based on content
        if (!storedMessages.some(msg => {
          const existingKey = `${msg.title}-${msg.message || msg.description || ''}`;
          return existingKey === contentKey;
        })) {
          // Add the message only if it's not a duplicate
          storedMessages.push(notification);
          localStorage.setItem('borrower_messages', JSON.stringify(storedMessages));
          console.log('WebSocketService: Saved message notification to localStorage:', notification.title);
        } else {
          console.log('WebSocketService: Skipped duplicate message notification:', notification.title);
        }
      } catch (error) {
        console.error('WebSocketService: Failed to save message to localStorage:', error);
      }
    }
    
    // Store the notification in the notification service
    NotificationService.addLocalNotification(notification);
    
    // Trigger notification event
    this.triggerEvent('notification', notification);
    
    // Show toast notification for important notifications
    if (notification.importance === 'high') {
      toast(notification.title, {
        description: notification.message || notification.description,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to notification center or related item
            if (notification.relatedItem) {
              const { type, id } = notification.relatedItem;
              switch (type) {
                case 'loan':
                  window.location.href = `/borrower/loans/${id}`;
                  break;
                case 'document':
                  window.location.href = `/borrower/documents?id=${id}`;
                  break;
                case 'message':
                  window.location.href = `/borrower/messages`;
                  break;
                default:
                  window.location.href = '/notifications';
              }
            } else if (notification.url) {
              window.location.href = notification.url;
            } else if (notification.entityType === 'message') {
              window.location.href = '/borrower/messages';
            } else {
              window.location.href = '/borrower/dashboard';
            }
          }
        }
      });
    }
  }

  /**
   * Register a handler for a specific message type
   * @param {string} type - Message type to handle
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    this.messageHandlers[type] = handler;
  }

  /**
   * Remove a message handler
   * @param {string} type - Message type to remove handler for
   */
  unregisterHandler(type) {
    delete this.messageHandlers[type];
  }

  /**
   * Add an event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function
   * @returns {string} Listener ID for removing
   */
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    const listenerId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners[event].push({
      id: listenerId,
      callback
    });
    
    return listenerId;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID to remove
   * @returns {boolean} Success status
   */
  removeEventListener(event, listenerId) {
    if (!this.listeners[event]) {
      return false;
    }
    
    const initialLength = this.listeners[event].length;
    this.listeners[event] = this.listeners[event].filter(listener => listener.id !== listenerId);
    
    return this.listeners[event].length < initialLength;
  }

  /**
   * Trigger an event for all listeners
   * @param {string} event - Event name to trigger
   * @param {any} data - Event data
   */
  triggerEvent(event, data) {
    if (!this.listeners[event]) {
      return;
    }
    
    this.listeners[event].forEach(listener => {
      try {
        listener.callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

export default new WebSocketService();
