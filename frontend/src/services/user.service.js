import ApiService from './api.service';
import { AuditLogService } from './index';

/**
 * User Service
 * 
 * Provides methods for user profile management, settings updates,
 * password changes, and preference management.
 */
class UserService {
  /**
   * Get the current user's profile
   * @returns {Promise<Object>} Response with user profile data
   */
  async getUserProfile() {
    try {
      const response = await ApiService.get('/api/v1/users/profile');
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load user profile'
      };
    }
  }
  
  /**
   * Update user profile information
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Response with update status and updated profile
   */
  async updateProfile(profileData) {
    try {
      const response = await ApiService.put('/api/v1/users/profile', profileData);
      
      // Log the profile update if audit log service is available
      if (AuditLogService?.createLog) {
        AuditLogService.createLog({
          eventType: 'user',
          action: 'update_profile',
          details: 'User profile updated'
        });
      }
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }
  
  /**
   * Update user settings
   * @param {Object} settings - User settings to update
   * @returns {Promise<Object>} Response with update status
   */
  async updateSettings(settings) {
    try {
      const response = await ApiService.put('/user/settings', settings);
      
      // Log the settings update
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'update_settings',
        details: 'User settings updated'
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Update settings error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings'
      };
    }
  }
  
  /**
   * Change user password
   * @param {Object} passwordData - Object containing current and new password
   * @returns {Promise<Object>} Response with password change status
   */
  async changePassword(passwordData) {
    try {
      const response = await ApiService.put('/user/password', passwordData);
      
      // Log the password change
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'change_password',
        details: 'User password changed'
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  }
  
  /**
   * Upload profile picture
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Response with upload status and profile picture URL
   */
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await ApiService.post('/api/v1/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Log the profile picture upload
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'upload_profile_picture',
        details: 'User profile picture uploaded'
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  }
  
  /**
   * Upload profile picture
   * @param {File} imageFile - The image file to upload
   * @returns {Promise<Object>} Response with upload status and image URL
   */
  async uploadProfilePicture(imageFile) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', imageFile);
      
      const response = await ApiService.post('/api/v1/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Log the profile picture update
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'update_profile_picture',
        details: 'User profile picture updated'
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload profile picture'
      };
    }
  }
  
  /**
   * Get user notification preferences
   * @returns {Promise<Object>} Response with notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await ApiService.get('/user/notifications/preferences');
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load notification preferences'
      };
    }
  }
  
  /**
   * Update user notification preferences
   * @param {Object} preferences - Updated notification preferences
   * @returns {Promise<Object>} Response with update status
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await ApiService.put('/user/notifications/preferences', preferences);
      
      // Log the notification preferences update
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'update_notification_preferences',
        details: 'User notification preferences updated'
      });
      
      return {
        success: true,
        data: response.data?.data
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
   * Request email verification
   * @returns {Promise<Object>} Response with request status
   */
  async requestEmailVerification() {
    try {
      const response = await ApiService.post('/user/verify-email/request');
      
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Email verification request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification email'
      };
    }
  }
  
  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Response with verification status
   */
  async verifyEmail(token) {
    try {
      const response = await ApiService.post('/user/verify-email', { token });
      
      // Log the email verification
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'verify_email',
        details: 'User email verified'
      });
      
      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify email'
      };
    }
  }
  
  /**
   * Get user activity log
   * @param {Object} filters - Optional filters for the activity log
   * @returns {Promise<Object>} Response with activity log data
   */
  async getActivityLog(filters = {}) {
    try {
      let url = '/user/activity';
      
      // Add query parameters for filters
      if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        url += `?${queryParams.toString()}`;
      }
      
      const response = await ApiService.get(url);
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Get activity log error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load activity log'
      };
    }
  }
  
  /**
   * Request a password reset
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Response with request status
   */
  async requestPasswordReset(email) {
    try {
      const response = await ApiService.post('/auth/password-reset/request', { email });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to request password reset'
      };
    }
  }
  
  /**
   * Verify password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object>} Response with token verification status
   */
  async verifyPasswordResetToken(token) {
    try {
      const response = await ApiService.get(`/auth/password-reset/verify/${token}`);
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Password reset token verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid or expired password reset token'
      };
    }
  }
  
  /**
   * Reset password with token
   * @param {Object} resetData - Object containing token and new password
   * @returns {Promise<Object>} Response with reset status
   */
  async resetPassword(resetData) {
    try {
      const response = await ApiService.post('/auth/password-reset', resetData);
      
      // Log the password reset
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'reset_password',
        details: 'User password was reset'
      });
      
      return {
        success: true,
        message: response.data?.message || 'Password reset successful'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password'
      };
    }
  }
  
  /**
   * Update security questions and answers
   * @param {Array} securityQuestions - Array of security question objects
   * @returns {Promise<Object>} Response with update status
   */
  async updateSecurityQuestions(securityQuestions) {
    try {
      const response = await ApiService.put('/user/security-questions', { securityQuestions });
      
      // Log the security questions update
      await AuditLogService.createLog({
        eventType: 'user',
        action: 'update_security_questions',
        details: 'User security questions updated'
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Update security questions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update security questions'
      };
    }
  }
  
  /**
   * Verify security questions answers during password recovery
   * @param {string} email - User's email address
   * @param {Array} answers - Array of answer objects
   * @returns {Promise<Object>} Response with verification status
   */
  async verifySecurityQuestions(email, answers) {
    try {
      const response = await ApiService.post('/auth/verify-security-questions', {
        email,
        answers
      });
      
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('Security questions verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify security questions'
      };
    }
  }
}

export default new UserService();
