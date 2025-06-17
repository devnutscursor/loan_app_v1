const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
    required: true
    },
    content: {
    type: String,
    trim: true
  },
  attachments: [{
    url: {
      type: String,
      required: true
        },
        fileName: {
      type: String
        },
        fileType: {
      type: String
        },
        fileSize: {
      type: Number
    }
  }],
  isRead: {
      type: Boolean,
    default: false
    },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
