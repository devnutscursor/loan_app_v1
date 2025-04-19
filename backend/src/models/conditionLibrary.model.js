const mongoose = require('mongoose');

/**
 * Condition Library Schema
 * Stores templates for common conditions that can be reused across loans
 */
const conditionLibrarySchema = new mongoose.Schema(
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
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
conditionLibrarySchema.index({ organizationId: 1 });
conditionLibrarySchema.index({ category: 1 });
conditionLibrarySchema.index({ tags: 1 });
conditionLibrarySchema.index({ title: 'text', description: 'text' });

const ConditionLibrary = mongoose.model('ConditionLibrary', conditionLibrarySchema);

module.exports = ConditionLibrary;
