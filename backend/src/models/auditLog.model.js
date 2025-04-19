const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Audit Log Schema
 * Records system events for security and compliance purposes
 */
const AuditLogSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userRole: {
      type: String,
      enum: ['borrower', 'lender', 'admin', 'system'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    url: {
      type: String,
    },
    entityType: {
      type: String,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common query patterns
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
