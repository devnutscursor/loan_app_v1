const mongoose = require('mongoose');

const lenderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  nmls: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  licenseState: {
    type: String,
    trim: true
  },
  biography: {
    type: String,
    trim: true
  },
  specialties: [{
    type: String,
    trim: true
  }],
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  activeLoans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }],
  completedLoans: {
    type: Number,
    default: 0
  },
  totalLoanVolume: {
    type: Number,
    default: 0
  },
  averageLoanAmount: {
    type: Number,
    default: 0
  },
  rateSettings: {
    programs: [{
      programName: {
        type: String,
        required: true,
        trim: true
      },
      programType: {
        type: String,
        enum: ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'DSCR', 'Construction'],
        required: true
      },
      baseRate: {
        type: Number,
        required: true,
        min: 0
      },
      adjustments: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        value: {
          type: Number,
          required: true
        },
        isPercentage: {
          type: Boolean,
          default: true
        }
      }],
      minFICO: {
        type: Number,
        min: 300,
        max: 850
      },
      maxLTV: {
        type: Number,
        min: 0,
        max: 100
      },
      isAvailableToBorrowers: {
        type: Boolean,
        default: true
      },
      isDefault: {
        type: Boolean,
        default: false
      },
      helpText: {
        type: String,
        trim: true
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  marketingProfile: {
    socialMediaLinks: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      instagram: { type: String, trim: true }
    },
    testimonials: [{
      content: { type: String, trim: true },
      author: { type: String, trim: true },
      date: { type: Date },
      rating: { type: Number, min: 1, max: 5 }
    }],
    videoUrls: [{
      type: String,
      trim: true
    }]
  },
  notificationPreferences: {
    emailNotifications: {
      newApplications: { type: Boolean, default: true },
      documentUploads: { type: Boolean, default: true },
      statusChanges: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    },
    smsNotifications: {
      newApplications: { type: Boolean, default: false },
      documentUploads: { type: Boolean, default: false },
      statusChanges: { type: Boolean, default: false },
      messages: { type: Boolean, default: false }
    },
    pushNotifications: {
      newApplications: { type: Boolean, default: false },
      documentUploads: { type: Boolean, default: false },
      statusChanges: { type: Boolean, default: false },
      messages: { type: Boolean, default: false }
    }
  },
  templateSettings: {
    emailTemplates: [{
      name: { type: String, required: true, trim: true },
      subject: { type: String, required: true, trim: true },
      content: { type: String, required: true },
      isDefault: { type: Boolean, default: false }
    }],
    documentTemplates: [{
      name: { type: String, required: true, trim: true },
      fileUrl: { type: String, required: true },
      category: { type: String, trim: true },
      isDefault: { type: Boolean, default: false }
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lender', lenderSchema);
