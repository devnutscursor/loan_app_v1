const mongoose = require('mongoose');

const creditReportSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Provider configuration
  providers: {
    equifax: {
      type: Boolean,
      default: true
    },
    experian: {
      type: Boolean,
      default: true
    },
    transunion: {
      type: Boolean,
      default: true
    }
  },
  
  // Borrower information (snapshot at time of report generation)
  borrowerData: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    suffix: {
      type: String,
      trim: true
    },
    ssn: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zipCode: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  
  // Report status and metadata
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Expired'],
    default: 'Pending'
  },
  
  // SmartAPI specific data
  smartApiData: {
    vendorOrderId: {
      type: String,
      trim: true
    },
    requestTimestamp: {
      type: Date
    },
    completionTimestamp: {
      type: Date
    },
    rawResponse: {
      type: String // Store the full XML response for debugging
    }
  },
  
  // Credit scores extracted from report
  creditScores: [{
    bureau: {
      type: String,
      enum: ['Equifax', 'Experian', 'TransUnion'],
      required: true
    },
    score: {
      type: Number,
      min: 300,
      max: 850
    },
    model: {
      type: String,
      trim: true
    },
    dateGenerated: {
      type: Date
    }
  }],
  
  // File storage information
  reportFile: {
    s3Url: {
      type: String,
      trim: true
    },
    s3Key: {
      type: String,
      trim: true
    },
    fileName: {
      type: String,
      trim: true
    },
    fileSize: {
      type: Number
    },
    contentType: {
      type: String,
      default: 'text/html'
    }
  },
  
  // Error information
  errors: [{
    code: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Additional metadata
  metadata: {
    reportType: {
      type: String,
      default: 'Standard Credit Report',
      trim: true
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Credit reports typically expire after 90 days
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      }
    },
    isTestData: {
      type: Boolean,
      default: true // Default to true for safety
    },
    dataSource: {
      type: String,
      enum: ['test', 'real'],
      default: 'test'
    }
  },
  
  // Audit fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessed: {
    type: Date
  },
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
creditReportSchema.index({ loan: 1 });
creditReportSchema.index({ lender: 1 });
creditReportSchema.index({ status: 1 });
creditReportSchema.index({ createdAt: -1 });
creditReportSchema.index({ 'metadata.expiresAt': 1 });

// Virtual for checking if report is expired
creditReportSchema.virtual('isExpired').get(function() {
  return this.metadata.expiresAt && this.metadata.expiresAt < new Date();
});

// Virtual for getting the average credit score
creditReportSchema.virtual('avgCreditScore').get(function() {
  if (this.creditScores.length === 0) return null;
  
  // Calculate the average score among all bureaus
  const validScores = this.creditScores
    .map(score => score.score)
    .filter(score => !isNaN(score) && score >= 300 && score <= 850);
  
  if (validScores.length === 0) return null;
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / validScores.length);
});

// Method to update access tracking
creditReportSchema.methods.trackAccess = function() {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  return this.save();
};

// Static method to find active reports for a loan
creditReportSchema.statics.findActiveByLoan = function(loanId) {
  return this.findOne({
    loan: loanId,
    isActive: true,
    status: 'Completed',
    'metadata.expiresAt': { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to find all reports for a loan (including expired)
creditReportSchema.statics.findAllByLoan = function(loanId) {
  return this.find({
    loan: loanId,
    isActive: true
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('CreditReport', creditReportSchema);
