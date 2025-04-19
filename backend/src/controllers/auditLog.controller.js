const AuditLog = require('../models/auditLog.model');
const APIError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Create an audit log entry
 * Can be used internally by other controllers or via API
 */
exports.createAuditLog = async (logData) => {
  try {
    const {
      eventType,
      description,
      userId,
      userRole,
      level = 'info',
      metadata = {},
      entityType,
      entityId,
      ipAddress,
      userAgent,
      url
    } = logData;
    
    // Create the audit log
    const auditLog = await AuditLog.create({
      eventType,
      description,
      userId,
      userRole,
      level,
      metadata,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      url
    });
    
    return auditLog;
  } catch (error) {
    // Log to console but don't throw - we don't want audit logging to break functionality
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * API endpoint to create an audit log
 */
exports.createAuditLogAPI = catchAsync(async (req, res) => {
  const {
    eventType,
    description,
    level,
    metadata,
    entityType,
    entityId
  } = req.body;
  
  // Extract user info from the request
  const userId = req.user.id;
  const userRole = req.user.role;
  
  // Extract request metadata
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  const url = req.originalUrl;
  
  if (!eventType || !description) {
    throw new APIError('Event type and description are required', 400);
  }
  
  // Create the audit log
  const auditLog = await exports.createAuditLog({
    eventType,
    description,
    userId,
    userRole,
    level,
    metadata,
    entityType,
    entityId,
    ipAddress,
    userAgent,
    url
  });
  
  if (!auditLog) {
    throw new APIError('Failed to create audit log', 500);
  }
  
  res.status(201).json({
    status: 'success',
    data: auditLog
  });
});

/**
 * Get audit logs with filtering options
 * Only accessible by admins and lenders
 */
exports.getAuditLogs = catchAsync(async (req, res) => {
  // Restrict access to admins and lenders
  if (!['admin', 'lender'].includes(req.user.role)) {
    throw new APIError('You do not have permission to access audit logs', 403);
  }
  
  // Extract filter parameters
  const {
    eventType,
    userId,
    userRole,
    level,
    entityType,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sort = '-timestamp'
  } = req.query;
  
  // Build query filters
  const filters = {};
  
  if (eventType) filters.eventType = eventType;
  if (userId) filters.userId = userId;
  if (userRole) filters.userRole = userRole;
  if (level) filters.level = level;
  if (entityType) filters.entityType = entityType;
  if (entityId) filters.entityId = entityId;
  
  // Date range filter
  if (startDate || endDate) {
    filters.timestamp = {};
    if (startDate) filters.timestamp.$gte = new Date(startDate);
    if (endDate) filters.timestamp.$lte = new Date(endDate);
  }
  
  // Additional restrictions for lenders
  if (req.user.role === 'lender') {
    // Lenders can only see logs related to their loans or users
    // This requires a more complex query - we might need to adjust based on your specific requirements
    
    // For now, let's restrict lenders to entity types they should have access to
    const allowedEntityTypes = ['loan', 'borrower', 'document', 'milestone', 'message'];
    
    if (entityType && !allowedEntityTypes.includes(entityType)) {
      throw new APIError('You do not have permission to view these audit logs', 403);
    }
    
    // If no entity type specified, restrict to allowed types
    if (!entityType) {
      filters.entityType = { $in: allowedEntityTypes };
    }
    
    // TODO: Add more specific filtering for lenders based on loan assignment
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Execute query with pagination
  const auditLogs = await AuditLog.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'userId',
      select: 'firstName lastName email role'
    });
  
  // Get total count for pagination info
  const totalLogs = await AuditLog.countDocuments(filters);
  
  res.status(200).json({
    status: 'success',
    results: auditLogs.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalLogs / parseInt(limit)),
      totalResults: totalLogs
    },
    data: auditLogs
  });
});

/**
 * Get audit logs for a specific entity
 */
exports.getEntityAuditLogs = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Access control
  if (req.user.role === 'borrower') {
    // Borrowers should only see logs for entities they own
    // This would require additional checks based on your data model
    // For now, we'll implement a basic check
    
    throw new APIError('Access denied. Contact your loan officer for information.', 403);
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get entity audit logs
  const auditLogs = await AuditLog.find({
    entityType,
    entityId
  })
    .sort('-timestamp')
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'userId',
      select: 'firstName lastName email role'
    });
  
  // Get total count for pagination
  const totalLogs = await AuditLog.countDocuments({ entityType, entityId });
  
  res.status(200).json({
    status: 'success',
    results: auditLogs.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalLogs / parseInt(limit)),
      totalResults: totalLogs
    },
    data: auditLogs
  });
});

/**
 * Get user activity logs
 * Only the user themselves, lenders for their borrowers, or admins can access this
 */
exports.getUserActivityLogs = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Access control
  if (
    req.user.role === 'borrower' && req.user.id !== userId ||
    req.user.role === 'lender'
    // TODO: Add check if lender is assigned to this borrower
  ) {
    throw new APIError('You do not have permission to view these logs', 403);
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get user activity logs
  const activityLogs = await AuditLog.find({ userId })
    .sort('-timestamp')
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count for pagination
  const totalLogs = await AuditLog.countDocuments({ userId });
  
  res.status(200).json({
    status: 'success',
    results: activityLogs.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalLogs / parseInt(limit)),
      totalResults: totalLogs
    },
    data: activityLogs
  });
});
