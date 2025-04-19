/**
 * Audit Logging Utility
 * 
 * Provides comprehensive audit logging capabilities for tracking
 * user actions, system events, and security-related activities.
 */

import axios from 'axios';
import { getUserData } from './auth';

// Event types for audit logging
export const EVENT_TYPES = {
  // Authentication events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_FAILED: 'auth:failed_attempt',
  
  // Application events
  APP_CREATE: 'application:create',
  APP_UPDATE: 'application:update',
  APP_SUBMIT: 'application:submit',
  APP_APPROVE: 'application:approve',
  APP_REJECT: 'application:reject',
  
  // Document events
  DOC_UPLOAD: 'document:upload',
  DOC_DELETE: 'document:delete',
  DOC_VIEW: 'document:view',
  
  // Milestone events
  MILESTONE_CREATE: 'milestone:create',
  MILESTONE_UPDATE: 'milestone:update',
  
  // Message events
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELETE: 'message:delete',
  
  // Admin events
  ADMIN_USER_CREATE: 'admin:user_create',
  ADMIN_USER_UPDATE: 'admin:user_update',
  ADMIN_SETTINGS_CHANGE: 'admin:settings_change',
  
  // System events
  SYSTEM_ERROR: 'system:error',
  SYSTEM_WARNING: 'system:warning'
};

// Log levels
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Create an audit log entry
 * 
 * @param {string} eventType - Type of event from EVENT_TYPES
 * @param {string} description - Description of the action
 * @param {object} metadata - Additional metadata about the event
 * @param {string} level - Log level from LOG_LEVELS
 * @returns {Promise<object>} Created log entry
 */
export const createAuditLog = async (
  eventType, 
  description, 
  metadata = {}, 
  level = LOG_LEVELS.INFO
) => {
  try {
    const userData = getUserData();
    
    // Prepare log data
    const logData = {
      eventType,
      description,
      level,
      timestamp: new Date().toISOString(),
      userId: userData?.id || null,
      userRole: userData?.role || null,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
    
    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT LOG]', logData);
    }
    
    // Send log to server
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/audit-logs`,
      logData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    // Even if logging fails, don't disrupt the user experience
    console.error('Failed to create audit log:', error);
    
    // In development, log the error details
    if (process.env.NODE_ENV !== 'production') {
      console.error('Log data that failed to send:', {
        eventType,
        description,
        metadata,
        level
      });
    }
    
    return null;
  }
};

/**
 * Log authentication events
 * 
 * @param {string} action - Authentication action (login, logout, etc.)
 * @param {object} metadata - Additional metadata
 * @param {boolean} success - Whether the authentication was successful
 */
export const logAuthEvent = (action, metadata = {}, success = true) => {
  const eventType = success 
    ? (action === 'login' ? EVENT_TYPES.AUTH_LOGIN : EVENT_TYPES.AUTH_LOGOUT)
    : EVENT_TYPES.AUTH_FAILED;
  
  const description = success
    ? `User ${action} successful`
    : `User ${action} failed`;
  
  const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING;
  
  return createAuditLog(eventType, description, metadata, level);
};

/**
 * Log application events
 * 
 * @param {string} action - Application action (create, update, etc.)
 * @param {string} applicationId - ID of the application
 * @param {object} metadata - Additional metadata
 */
export const logApplicationEvent = (action, applicationId, metadata = {}) => {
  let eventType;
  
  switch (action) {
    case 'create':
      eventType = EVENT_TYPES.APP_CREATE;
      break;
    case 'update':
      eventType = EVENT_TYPES.APP_UPDATE;
      break;
    case 'submit':
      eventType = EVENT_TYPES.APP_SUBMIT;
      break;
    case 'approve':
      eventType = EVENT_TYPES.APP_APPROVE;
      break;
    case 'reject':
      eventType = EVENT_TYPES.APP_REJECT;
      break;
    default:
      eventType = `application:${action}`;
  }
  
  const description = `Application ${action} - ID: ${applicationId}`;
  
  return createAuditLog(eventType, description, {
    applicationId,
    ...metadata
  });
};

/**
 * Log document events
 * 
 * @param {string} action - Document action (upload, delete, view)
 * @param {string} documentId - ID of the document
 * @param {string} documentType - Type of document
 * @param {object} metadata - Additional metadata
 */
export const logDocumentEvent = (action, documentId, documentType, metadata = {}) => {
  let eventType;
  
  switch (action) {
    case 'upload':
      eventType = EVENT_TYPES.DOC_UPLOAD;
      break;
    case 'delete':
      eventType = EVENT_TYPES.DOC_DELETE;
      break;
    case 'view':
      eventType = EVENT_TYPES.DOC_VIEW;
      break;
    default:
      eventType = `document:${action}`;
  }
  
  const description = `Document ${action} - Type: ${documentType}, ID: ${documentId}`;
  
  return createAuditLog(eventType, description, {
    documentId,
    documentType,
    ...metadata
  });
};

/**
 * Log system errors
 * 
 * @param {Error} error - Error object
 * @param {string} context - Context where the error occurred
 * @param {object} metadata - Additional metadata
 */
export const logSystemError = (error, context, metadata = {}) => {
  const description = `System error in ${context}: ${error.message}`;
  
  return createAuditLog(EVENT_TYPES.SYSTEM_ERROR, description, {
    errorName: error.name,
    errorStack: error.stack,
    context,
    ...metadata
  }, LOG_LEVELS.ERROR);
};

/**
 * Get audit logs for an entity
 * 
 * @param {string} entityType - Type of entity (application, user, etc.)
 * @param {string} entityId - ID of the entity
 * @param {object} options - Additional options (limit, offset, etc.)
 * @returns {Promise<object[]>} List of audit logs
 */
export const getAuditLogs = async (entityType, entityId, options = {}) => {
  try {
    const params = new URLSearchParams({
      entityType,
      entityId,
      ...options
    });
    
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/audit-logs?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
};

export default {
  createAuditLog,
  logAuthEvent,
  logApplicationEvent,
  logDocumentEvent,
  logSystemError,
  getAuditLogs,
  EVENT_TYPES,
  LOG_LEVELS
};
