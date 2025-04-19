const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Milestone Schema
 * Represents loan application milestones and their statuses
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
      enum: ['pending', 'current', 'completed', 'overdue', 'waiting'],
      default: 'pending',
    },
    startDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    requirements: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedDate: {
          type: Date,
        },
        completedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    requiredDocuments: [
      {
        documentType: {
          type: String,
          required: true,
        },
        isReceived: {
          type: Boolean,
          default: false,
        },
        document: {
          type: Schema.Types.ObjectId,
          ref: 'Document',
        },
      },
    ],
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    responsibleParty: {
      type: String,
      enum: ['borrower', 'lender', 'third_party'],
      default: 'lender',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MilestoneSchema.index({ loan: 1, order: 1 });
MilestoneSchema.index({ loan: 1, status: 1 });

/**
 * Calculate milestone progress percentage
 */
MilestoneSchema.methods.calculateProgress = function() {
  let totalItems = 0;
  let completedItems = 0;
  
  // Count requirements
  if (this.requirements && this.requirements.length > 0) {
    totalItems += this.requirements.length;
    completedItems += this.requirements.filter(req => req.isCompleted).length;
  }
  
  // Count documents
  if (this.requiredDocuments && this.requiredDocuments.length > 0) {
    totalItems += this.requiredDocuments.length;
    completedItems += this.requiredDocuments.filter(doc => doc.isReceived).length;
  }
  
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
};

/**
 * Update milestone status based on progress and dates
 */
MilestoneSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.completionDate) {
    this.status = 'completed';
  } else if (this.startDate && this.startDate <= now) {
    if (this.dueDate && this.dueDate < now) {
      this.status = 'overdue';
    } else {
      this.status = 'current';
    }
  } else if (this.startDate && this.startDate > now) {
    this.status = 'pending';
  }
  
  return this.status;
};

module.exports = mongoose.model('Milestone', MilestoneSchema);
