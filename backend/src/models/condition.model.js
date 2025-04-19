const mongoose = require('mongoose');

/**
 * Loan Condition Schema
 * Used to track requirements that borrowers must fulfill during the loan process
 */
const conditionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Condition title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['income', 'assets', 'credit', 'property', 'legal', 'insurance', 'other'],
      default: 'other'
    },
    tags: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'cleared', 'waived', 'expired'],
      default: 'pending'
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    notes: [{
      content: {
        type: String,
        required: true
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    statusHistory: [{
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'submitted', 'cleared', 'waived', 'expired'],
        required: true
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String
      }
    }],
    isFromLibrary: {
      type: Boolean,
      default: false
    },
    libraryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConditionLibrary'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
conditionSchema.index({ loanId: 1, status: 1 });
conditionSchema.index({ borrowerId: 1 });
conditionSchema.index({ category: 1 });
conditionSchema.index({ tags: 1 });

const Condition = mongoose.model('Condition', conditionSchema);

module.exports = Condition;
