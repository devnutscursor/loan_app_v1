const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Milestone Schema
 * Simplified to only include name and description
 */
const MilestoneSchema = new Schema(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    deadlineDate: {
      type: Date
    },
    notificationSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MilestoneSchema.index({ loan: 1, order: 1 });
MilestoneSchema.index({ loan: 1, status: 1 });

/**
 * Calculate milestone progress percentage - simplified version
 */
MilestoneSchema.methods.calculateProgress = function() {
  // With simplified model, milestone is either 0% or 100% based on status
  return this.status === 'completed' ? 100 : 0;
};

/**
 * Toggle milestone status between pending and completed
 */
MilestoneSchema.methods.toggleStatus = function() {
  this.status = this.status === 'completed' ? 'pending' : 'completed';
  return this.status;
};

module.exports = mongoose.model('Milestone', MilestoneSchema);
