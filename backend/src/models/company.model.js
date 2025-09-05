const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  maxLenders: {
    type: Number,
    required: true
  },
  logo: {
    type: String
  },
  nmls: {
    type: String,
    trim: true
  },
  address: {
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
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
    },
    country: {
      type: String,
      default: 'United States',
      trim: true
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  primaryContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  branding: {
    primaryColor: {
      type: String,
      default: '#2B3990'
    },
    secondaryColor: {
      type: String,
      default: '#E8F0F8'
    },
    accentColor: {
      type: String,
      default: '#FF6B00'
    },
    fontFamily: {
      type: String,
      default: 'Roboto, sans-serif'
    }
  },
  companySettings: {
    enabledLoanTypes: [{
      type: String,
      enum: ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'DSCR', 'Construction']
    }],
    defaultLoanOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    defaultMilestones: [{
      title: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      order: {
        type: Number,
        required: false
      },
      isInternal: {
        type: Boolean,
        default: false
      }
    }],
    defaultConditions: [{
      title: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      category: {
        type: String,
        enum: [
          'Income',
          'Assets',
          'Credit',
          'Property',
          'Employment',
          'Insurance',
          'Other'
        ]
      }
    }],
    complianceSettings: {
      showBasePrivacyPolicy: {
        type: Boolean,
        default: true
      },
      showElectronicDeliveryDisclosure: {
        type: Boolean,
        default: true
      },
      showFCRALogo: {
        type: Boolean,
        default: true
      },
      showWebsiteTerms: {
        type: Boolean,
        default: true
      },
      showESignDisclosure: {
        type: Boolean,
        default: true
      },
      showPowerOfAttorney: {
        type: Boolean,
        default: false
      }
    },
    shareSettings: {
      enableMobileApp: {
        type: Boolean,
        default: true
      },
      enable1003Share: {
        type: Boolean,
        default: true
      },
      enableCustomLinks: {
        type: Boolean,
        default: true
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['Free', 'Basic', 'Professional', 'Enterprise'],
      default: 'Free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    features: {
      maxUsers: {
        type: Number,
        default: 1
      },
      maxActiveLoans: {
        type: Number,
        default: 10
      },
      allowCustomBranding: {
        type: Boolean,
        default: false
      },
      allowCustomDomain: {
        type: Boolean,
        default: false
      },
      allowAdvancedReporting: {
        type: Boolean,
        default: false
      },
      allowAPIAccess: {
        type: Boolean,
        default: false
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Company', companySchema);
