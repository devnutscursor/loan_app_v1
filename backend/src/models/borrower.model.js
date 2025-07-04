const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
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
  },
  ownershipStatus: {
    type: String,
    enum: ['Own', 'Rent', 'Other'],
    required: true
  },
  yearsAtAddress: {
    type: Number,
    required: true,
    min: 0
  },
  monthsAtAddress: {
    type: Number,
    required: true,
    min: 0,
    max: 11
  },
  isMailingAddress: {
    type: Boolean,
    default: true
  }
});

const employmentSchema = new mongoose.Schema({
  employerName: {
    type: String,
    required: true,
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  employmentStatus: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Self-employed', 'Retired', 'Unemployed'],
    required: true
  },
  isSelfEmployed: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isCurrentEmployer: {
    type: Boolean,
    default: true
  },
  yearsInProfession: {
    type: Number,
    min: 0
  },
  monthlyIncome: {
    type: Number,
    min: 0
  },
  employerAddress: addressSchema
});

const assetSchema = new mongoose.Schema({
  assetType: {
    type: String,
    enum: [
      'Checking Account', 
      'Savings Account', 
      'Money Market', 
      'Certificate of Deposit',
      'Stocks', 
      'Bonds', 
      'Mutual Funds', 
      'Retirement Account',
      'Cash Gift', 
      'Real Estate', 
      'Life Insurance',
      'Other'
    ],
    required: true
  },
  financialInstitution: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftSource: {
    type: String,
    enum: ['Family', 'Relative', 'Employer', 'Nonprofit', 'Other'],
    trim: true
  },
  isDeposited: {
    type: Boolean,
    default: false
  }
});

const debtSchema = new mongoose.Schema({
  creditorName: {
    type: String,
    required: true,
    trim: true
  },
  debtType: {
    type: String,
    enum: [
      'Credit Card', 
      'Student Loan', 
      'Auto Loan', 
      'Personal Loan',
      'Mortgage', 
      'Home Equity Loan', 
      'Loan Installment',
      'Other'
    ],
    required: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: 0
  },
  unpaidBalance: {
    type: Number,
    required: true,
    min: 0
  },
  monthsRemaining: {
    type: Number,
    min: 0
  },
  paymentFrequency: {
    type: String,
    enum: ['Monthly', 'Biweekly', 'Weekly'],
    default: 'Monthly'
  },
  isPaidBeforeClosing: {
    type: Boolean,
    default: false
  }
});

const incomeSourceSchema = new mongoose.Schema({
  incomeType: {
    type: String,
    enum: [
      'Base Income', 
      'Overtime', 
      'Bonus', 
      'Commission',
      'Military Entitlements', 
      'Rental Income', 
      'Self-Employment',
      'Social Security', 
      'Disability Income', 
      'Alimony',
      'Child Support', 
      'Other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Biweekly', 'Weekly', 'Annually'],
    default: 'Monthly'
  }
});

const militaryServiceSchema = new mongoose.Schema({
  isVeteran: {
    type: Boolean,
    default: false
  },
  isActiveService: {
    type: Boolean,
    default: false
  },
  branch: {
    type: String,
    enum: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force', 'National Guard'],
    trim: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  serviceStatus: {
    type: String,
    enum: ['Active Duty', 'Retired', 'Discharged', 'Reserve'],
    trim: true
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  disabilityRating: {
    type: Number,
    min: 0,
    max: 100
  },
  isSurvivingSpouse: {
    type: Boolean,
    default: false
  }
});

const borrowerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  loans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }],
  dateOfBirth: {
    type: Date
  },
  ssn: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Separated', 'Widowed']
  },
  citizenship: {
    type: String,
    enum: ['US Citizen', 'Permanent Resident', 'Non-Permanent Resident']
  },
  primaryAddress: addressSchema,
  previousAddresses: [addressSchema],
  mailingAddress: addressSchema,
  employment: {
    currentEmployment: employmentSchema,
    previousEmployment: [employmentSchema]
  },
  financialInfo: {
    assets: [assetSchema],
    debts: [debtSchema],
    incomeSources: [incomeSourceSchema],
    monthlyIncome: {
      type: Number,
      min: 0
    },
    totalAssets: {
      type: Number,
      min: 0
    },
    totalDebts: {
      type: Number,
      min: 0
    }
  },
  militaryService: militaryServiceSchema,
  demographicInfo: {
    ethnicity: {
      type: String,
      enum: ['Hispanic or Latino', 'Not Hispanic or Latino', 'I do not wish to provide this information']
    },
    race: {
      type: String,
      enum: [
        'American Indian or Alaska Native',
        'Asian',
        'Black or African American',
        'Native Hawaiian or Other Pacific Islander',
        'White',
        'I do not wish to provide this information'
      ]
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-Binary', 'I do not wish to provide this information']
    }
  },
  borrowerType: {
    type: String,
    enum: ['Primary', 'Co-Borrower'],
    default: 'Primary'
  },
  dependents: {
    type: Number,
    default: 0,
    min: 0
  },
  isFirstTimeHomeBuyer: {
    type: Boolean,
    default: false
  },
  declarations: {
    hasPendingBankruptcy: { type: Boolean, default: false },
    hasPropertyForeclosure: { type: Boolean, default: false },
    isPartyToLawsuit: { type: Boolean, default: false },
    hasChildSupportObligation: { type: Boolean, default: false },
    hasDeclaredBankruptcy: { type: Boolean, default: false },
    hadPropertyForeclosed: { type: Boolean, default: false },
    hasOutstandingJudgments: { type: Boolean, default: false },
    isDelinquentOnFederalDebt: { type: Boolean, default: false }
  },
  signature: {
    hasSigned: {
      type: Boolean,
      default: false
    },
    signatureDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Borrower', borrowerSchema);
