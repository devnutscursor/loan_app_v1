const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower'
  },
  category: {
    type: String,
    enum: [
      'Identity',
      'Income',
      'Assets',
      'Credit',
      'Property',
      'Employment',
      'Insurance',
      'Disclosures',
      'Legal',
      'Other'
    ],
    default: 'Other'
  },
  documentType: {
    type: String,
    enum: [
      'Driver License',
      'Passport',
      'Social Security Card',
      'Pay Stub',
      'W2',
      'Tax Return',
      'Bank Statement',
      'Retirement Account Statement',
      'Investment Account Statement',
      'Gift Letter',
      'Credit Report',
      'Purchase Agreement',
      'Property Appraisal',
      'Title Report',
      'Insurance Declaration',
      'Loan Estimate',
      'Closing Disclosure',
      'Loan Application',
      'Other'
    ],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Rejected', 'Needs Correction'],
    default: 'Pending Review'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  metadata: {
    expirationDate: {
      type: Date
    },
    issuingAuthority: {
      type: String,
      trim: true
    },
    documentDate: {
      type: Date
    },
    periodCovered: {
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  versions: [{
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Adding a virtual property to get the complete file path
documentSchema.virtual('fullPath').get(function() {
  return `/uploads/${this.fileUrl}`;
});

module.exports = mongoose.model('Document', documentSchema);
