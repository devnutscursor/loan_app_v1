const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Conversation Schema
 * Manages conversation threads between borrowers and lenders
 */
const ConversationSchema = new Schema(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    loan: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
    },
    title: {
      type: String,
      trim: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCountByUser: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ loan: 1 });
ConversationSchema.index({ lastMessage: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
