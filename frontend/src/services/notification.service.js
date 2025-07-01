import ApiService from './api.service';
import { toast } from 'react-hot-toast';

/**
 * Notification Service
 * 
 * Provides methods for managing notifications, including retrieving,
 * marking as read, creating new notifications, and handling real-time notifications.
 * Supports both API and WebSocket based notification delivery.
 */
class NotificationService {
  constructor() {
    this.localNotifications = [];
    this.notificationListeners = [];
    this.unreadCount = 0;
  }
  /**
   * Get all notifications for the current user
   * @param {Object} options - Options for pagination and filters
   * @returns {Promise<Object>} Response with notifications
   */
  async getUserNotifications(options = {}) {
    try {
      let url = '/notifications';
      
      // Add query parameters
      if (Object.keys(options).length > 0) {
        const queryParams = new URLSearchParams();
        
        if (options.page) queryParams.append('page', options.page);
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.read !== undefined) queryParams.append('read', options.read);
        if (options.type) queryParams.append('type', options.type);
        
        url += `?${queryParams.toString()}`;
      }
      
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get notifications'
      };
    }
  }
  
  /**
   * Get unread notification count
   * @returns {Promise<Object>} Response with count of unread notifications
   */
  async getUnreadCount() {
    try {
      const response = await ApiService.get('/notifications/unread/count');
      
      return {
        success: true,
        data: response.data.count
      };
    } catch (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get unread notification count'
      };
    }
  }
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Response with status
   */
  async markAsRead(notificationId) {
    try {
      const response = await ApiService.put(`/notifications/${notificationId}/read`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark notification as read'
      };
    }
  }
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response with status
   */
  async markAllAsRead() {
    try {
      const response = await ApiService.put('/notifications/read-all');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark all notifications as read'
      };
    }
  }
  
  /**
   * Create a notification for specific users
   * @param {Object} notificationData - Notification data including title, message, and recipients
   * @returns {Promise<Object>} Response with created notification
   */
  async createNotification(notificationData) {
    try {
      const response = await ApiService.post('/notifications', notificationData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Create notification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create notification'
      };
    }
  }
  
  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<Object>} Response with status
   */
  async deleteNotification(notificationId) {
    try {
      const response = await ApiService.delete(`/notifications/${notificationId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete notification'
      };
    }
  }
  
  /**
   * Get user notification preferences
   * @returns {Promise<Object>} Response with user notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await ApiService.get('/user/notification-preferences');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get notification preferences'
      };
    }
  }
  
  /**
   * Update user notification preferences
   * @param {Object} preferences - Updated notification preferences
   * @returns {Promise<Object>} Response with status
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await ApiService.put('/user/notification-preferences', preferences);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update notification preferences'
      };
    }
  }
  
  /**
   * Add a local notification received from WebSocket
   * @param {Object} notification - Notification data
   */
  addLocalNotification(notification) {
    // Add timestamp if not present
    if (!notification.createdAt) {
      notification.createdAt = new Date().toISOString();
    }
    
    // Generate a unique key for this notification based on content
    const notificationKey = `${notification.title}-${notification.message || notification.description || ''}`;
    
    // Check if we already have this notification in the cache (prevents duplicates)
    const isDuplicate = this.localNotifications.some(existingNotification => {
      const existingKey = `${existingNotification.title}-${existingNotification.message || existingNotification.description || ''}`;
      return existingKey === notificationKey;
    });
    
    // Only add if it's not a duplicate
    if (!isDuplicate) {
      // Add to local cache
      this.localNotifications.unshift(notification);
      
      // Limit cache size
      if (this.localNotifications.length > 50) {
        this.localNotifications = this.localNotifications.slice(0, 50);
      }
      
      console.log('Added new notification to local cache:', notification.title);
    } else {
      console.log('Skipped duplicate notification:', notification.title);
    }
    
    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
    }
    
    // Notify listeners
    this.notifyListeners(notification);
  }
  
  /**
   * Get cached local notifications
   * @returns {Array} Local notifications
   */
  getLocalNotifications() {
    return this.localNotifications;
  }
  
  /**
   * Get cached unread notification count
   * @returns {number} Unread count
   */
  getLocalUnreadCount() {
    return this.unreadCount;
  }
  
  /**
   * Reset local unread count
   */
  resetLocalUnreadCount() {
    this.unreadCount = 0;
  }
  
  /**
   * Register a notification listener
   * @param {Function} listener - Notification listener function
   * @returns {string} Listener ID
   */
  addNotificationListener(listener) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.notificationListeners.push({ id, listener });
    return id;
  }
  
  /**
   * Remove a notification listener
   * @param {string} id - Listener ID
   */
  removeNotificationListener(id) {
    this.notificationListeners = this.notificationListeners.filter(item => item.id !== id);
  }
  
  /**
   * Notify all listeners of a new notification
   * @param {Object} notification - Notification data
   */
  notifyListeners(notification) {
    this.notificationListeners.forEach(({ listener }) => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
  
  /**
   * Update email notification settings
   * @param {Object} emailSettings - Email notification settings
   * @returns {Promise<Object>} Response with status
   */
  async updateEmailSettings(emailSettings) {
    try {
      const response = await ApiService.put('/user/email-notifications', emailSettings);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update email notification settings error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update email notification settings'
      };
    }
  }
  
  /**
   * Get email notification settings
   * @returns {Promise<Object>} Response with email notification settings
   */
  async getEmailSettings() {
    try {
      const response = await ApiService.get('/user/email-notifications');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get email notification settings error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get email notification settings'
      };
    }
  }
  
  /**
   * Test email notifications by sending a test email
   * @returns {Promise<Object>} Response with status
   */
  async testEmailNotification() {
    try {
      const response = await ApiService.post('/user/email-notifications/test');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Test email notification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send test email notification'
      };
    }
  }
}

export default new NotificationService();
