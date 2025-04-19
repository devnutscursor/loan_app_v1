import api, { handleResponse } from './api.service';

/**
 * Audit Log Service
 * 
 * Handles all API calls related to audit logging and security event tracking
 */
const AuditLogService = {
  /**
   * Create a new audit log entry
   * 
   * @param {string} eventType - Type of event
   * @param {string} description - Description of the event
   * @param {object} metadata - Additional metadata about the event
   * @param {string} level - Log level (info, warning, error, critical)
   * @returns {Promise} Promise object containing created audit log
   */
  createAuditLog: (eventType, description, metadata = {}, level = 'info') => {
    return handleResponse(
      api.post('/api/v1/audit-logs', {
        eventType,
        description,
        level,
        metadata
      })
    );
  },

  /**
   * Get audit logs with filtering options
   * 
   * @param {object} filters - Filter parameters
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of logs per page
   * @returns {Promise} Promise object containing audit logs
   */
  getAuditLogs: (filters = {}, page = 1, limit = 50) => {
    return handleResponse(
      api.get('/api/v1/audit-logs', {
        params: {
          ...filters,
          page,
          limit
        }
      })
    );
  },

  /**
   * Get audit logs for a specific entity
   * 
   * @param {string} entityType - Type of entity (loan, user, etc.)
   * @param {string} entityId - ID of the entity
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of logs per page
   * @returns {Promise} Promise object containing entity audit logs
   */
  getEntityAuditLogs: (entityType, entityId, page = 1, limit = 20) => {
    return handleResponse(
      api.get(`/api/v1/audit-logs/entity/${entityType}/${entityId}`, {
        params: { page, limit }
      })
    );
  },

  /**
   * Get activity logs for a specific user
   * 
   * @param {string} userId - ID of the user
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of logs per page
   * @returns {Promise} Promise object containing user activity logs
   */
  getUserActivityLogs: (userId, page = 1, limit = 20) => {
    return handleResponse(
      api.get(`/api/v1/audit-logs/user/${userId}`, {
        params: { page, limit }
      })
    );
  }
};

export default AuditLogService;
