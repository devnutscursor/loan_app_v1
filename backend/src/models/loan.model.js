const mongoose = require('mongoose');
const { isFsaRhsGuaranteed } = require('../utils/programType');

const propertySchema = new mongoose.Schema({
  
  streetAddress: {
    type: String,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  county: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  hasAcceptedOffer: {
    type: Boolean,
    default: false
  },
  contractPurchasePrice: {
    type: Number,
    min: 0
  },
  isMixedUse: {
    type: String,
    enum: ['Yes', 'No']
  },
  isManufactured: {
    type: String,
    enum: ['Yes', 'No']
  },
  proposedRentalIncome: {
    type: Number,
    min: 0
  },
  propertyType: {
    type: String,
    enum: [
      'Single Family Home',
      'Condominium',
      'Townhouse',
      'Multi-Family',
      'Manufactured Home',
      'Cooperative',
      'Planned Unit Development (PUD)',
      'Mixed-Use',
      'Commercial',
      'Office',
      'Retail',
      'Industrial',
      'Land Contract'
    ]
  },
  occupancyType: {
    type: String,
    enum: ['Primary Residence', 'Vacation Home', 'Investment', 'Other']
  },
  numberOfUnits: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  yearBuilt: {
    type: Number
  },
  propertyValue: {
    type: Number,
    required: true,
    min: 0
  },
  isNewConstruction: {
    type: Boolean,
    default: false
  },
});

const loanDetailSchema = new mongoose.Schema({
  loanType: {
    type: String,
    enum: [
      'Purchase',
      'Refinance',
      'Cash-Out Refinance',
      'Construction',
      'Home Improvement',
      'HELOC',
      'Reverse Mortgage',
      'Land Contract'
    ],
    required: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  downPayment: {
    type: Number,
    min: 0
  },
  yearAcquired: {
    type: Number,
    min: 0,
    max: 2100 // Increased to allow real year values
  },
  currentLoanBalance: {
    type: Number,
    min: 0
  },
  requestedLoanAmount: {
    type: Number,
    min: 0
  },
  refinanceType: {
    type: String,
    enum: ['Refinance', 'Cash Out Refinance', 'Home Equity Line of Credit'],
    default: 'Refinance'
  },
  loanAmount: {
    type: Number,
    min: 0
  },
  yearLotAcquired: {
    type: Number,
    min: 0
  },
  originalCost: {
    type: Number,
    min: 0
  },
  existingLoans: {
    type: Number,
    min: 0
  },
  presentValueOfLot: {
    type: Number,
    min: 0
  },
  costOfImprovements: {
    type: Number,
    min: 0
  },
  constructionType: {
    type: String,
    enum: ['Construction', 'Construction-Permanent'],
    default: 'Construction'
  },
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completedDate: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
});

const conditionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Identity',
      'Income',
      'Address',
      'Property',
      'Employment',
      'Financial',
      'Insurance',
      'Other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Waived', 'Declined'],
    default: 'Pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  }
});

const documentSchema = new mongoose.Schema({
  title: {
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
  fileType: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: [
      'Income Verification',
      'Asset Verification',
      'Identity Verification',
      'Property Documentation',
      'Insurance Documentation',
      'Signed Disclosures',
      'Other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Accepted', 'Rejected'],
    default: 'Pending Review'
  },
  associatedCondition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condition'
  }
});

// Loan Parameters Schema
const loanParametersSchema = new mongoose.Schema({
  loanAmount: {
    type: Number,
    default: 0
  },
  downPayment: {
    type: Number,
    default: 0
  },
  downPaymentPercent: {
    type: Number,
    default: 0
  },
  propertyTaxes: {
    type: Number,
    default: 0
  },
  propertyTaxesUnit: {
    type: String,
    enum: ['dollar', 'percent'],
    default: 'dollar'
  },
  propertyTaxesFrequency: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'yearly'
  },
  homeownersInsurance: {
    type: Number,
    default: 0
  },
  homeownersInsuranceUnit: {
    type: String,
    enum: ['dollar', 'percent'],
    default: 'dollar'
  },
  homeownersInsuranceFrequency: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'yearly'
  },
  hoaFees: {
    type: Number,
    default: 0
  },
  hoaFeesUnit: {
    type: String,
    enum: ['dollar', 'percent'],
    default: 'dollar'
  },
  hoaFeesFrequency: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  interestRate: {
    type: Number,
    default: 0
  },
  loanTerm: {
    type: Number,
    default: 30
  },
  selectedProgramId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanProgram'
  },
  
  // ProgramGuidelines as a nested field within loanParameters
  programGuidelines: {
    type: Map,
    of: {
      dtiMax: Number,
      downPaymentMin: Number,
      downPaymentMax: Number,
      loanAmountMin: Number,
      loanAmountMax: Number,
      upfrontMIP: Number,
      annualMIP: Number,
      // Fee fields with their values, unit types, and frequencies
      originationFees: Number,
      originationFeesUnit: {
        type: String,
        enum: ['dollar', 'percent'],
        default: 'dollar'
      },
      originationFeesFrequency: {
        type: String,
        enum: ['once', 'monthly', 'yearly'],
        default: 'once'
      },
      closingCosts: Number,
      closingCostsUnit: {
        type: String,
        enum: ['dollar', 'percent'],
        default: 'dollar'
      },
      closingCostsFrequency: {
        type: String,
        enum: ['once', 'monthly', 'yearly'],
        default: 'once'
      },
      otherFees: Number,
      otherFeesUnit: {
        type: String,
        enum: ['dollar', 'percent'],
        default: 'dollar'
      },
      otherFeesFrequency: {
        type: String,
        enum: ['once', 'monthly', 'yearly'],
        default: 'once'
      }
    },
    default: {}
  }
});

// Loan Calculations Schema
const loanCalculationsSchema = new mongoose.Schema({
  principalAndInterest: {
    type: Number,
    default: 0
  },
  taxes: {
    type: Number,
    default: 0
  },
  insurance: {
    type: Number,
    default: 0
  },
  mortgageInsurance: {
    type: Number,
    default: 0
  },
  hoa: {
    type: Number,
    default: 0
  },
  monthlyPayment: {
    type: Number,
    default: 0
  },
  dti: {
    type: Number,
    default: 0
  },
  isQualified: {
    type: Boolean,
    default: false
  }
});

// URLA Form 1003 Specific Schemas
const assetSchema = new mongoose.Schema({
  assetType: {
    type: String,
    trim: true
  },
  institutionName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
});

const incomeSchema = new mongoose.Schema({
  baseIncome: {
    type: Number,
    min: 0
  },
  overtime: {
    type: Number,
    min: 0
  },
  commissions: {
    type: Number,
    min: 0
  },
  bonuses: {
    type: Number,
    min: 0
  },
  militaryEntitlements: {
    type: Number,
    min: 0
  },
  otherIncome: [{
    incomeType: String,
    amount: Number,
    description: String
  }]
});

const debtSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true
  },
  paidAtClosing: {
    type: Boolean,
    default: false
  },
  creditor: {
    type: String,
    trim: true
  },
  monthlyPayment: {
    type: Number,
    min: 0
  },
  balance: {
    type: Number,
    min: 0
  },
  // Additional fields from credit report XML
  accountOpenDate: {
    type: Date
  },
  accountClosedDate: {
    type: Date
  },
  liabilityType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    trim: true
  },
  highBalance: {
    type: Number,
    min: 0
  },
  pastDueAmount: {
    type: Number,
    min: 0
  },
  creditLimit: {
    type: Number,
    min: 0
  },
  currentRating: {
    type: String,
    trim: true
  },
  highestAdverseRating: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  }
});

const propertyOwnedSchema = new mongoose.Schema({
  ownsProperty: {
    type: Boolean,
    default: false
  },
  propertyAddress: {
    streetAddress: String,
    apt: String,
    city: String,
    state: String,
    zipCode: String
  },
  propertyType: String,
  presentMarketValue: Number,
  unpaidBalance: Number,
  mortgageBalance: Number,
  monthlyPayment: Number,
  monthlyCosts: Number,
  grossRentalIncome: Number,
  netRentalIncome: Number,
  statusOfProperty: {
    type: String,
    enum: ['sold', 'retained', 'sellingHomeBeforeBuying']
  },
  intendedOccupancy: {
    type: String, 
    enum: ['primaryResidence', 'vacationHome', 'investment', 'other']
  },
  hasLoan: Boolean,
  // Current Primary Housing Expenses
  currentHousingExpenses: {
    rent: {
      type: Number,
      default: 0
    },
    firstMortgage: {
      type: Number,
      default: 0
    },
    otherFinancing: {
      type: Number,
      default: 0
    },
    hazardInsurance: {
      type: Number,
      default: 0
    },
    realEstateTaxes: {
      type: Number,
      default: 0
    },
    mortgageInsurance: {
      type: Number,
      default: 0
    },
    hoaDues: {
      type: Number,
      default: 0
    },
    otherHousingExpenses: {
      type: Number,
      default: 0
    }
  }
});

const militaryServiceSchema = new mongoose.Schema({
  hasServed: { type: Boolean, default: false },
  currentlyServing: { type: Boolean, default: false },
  isRetired: { type: Boolean, default: false },
  isNonActivated: { type: Boolean, default: false },
  isSurvivingSpouse: { type: Boolean, default: false },
  serviceBranch: { type: String, default: '' },
  serviceType: { type: String, default: '' },
  yearsOfService: { type: Number, default: 0 },
  dischargeType: { type: String, default: '' },
  dischargeDate: { type: Date },
  expirationDate: { type: String, default: '' }
});

const declarationsSchema = new mongoose.Schema({
  occupyAsPrimary: { type: Boolean, default: false },
  hadOwnershipInterest: { type: Boolean, default: false },
  ownedPropertyType: { type: String, default: '' },
  titleHoldingType: { type: String, default: '' },
  borrowingMoney: { type: Boolean, default: false },
  borrowingMoneyAmount: { type: Number, default: 0 },
  applyingForMortgage: { type: Boolean, default: false },
  applyingForNewCredit: { type: Boolean, default: false },
  propertySubjectToLien: { type: Boolean, default: false },
  coSigner: { type: Boolean, default: false },
  delinquent: { type: Boolean, default: false },
  partyToLawsuit: { type: Boolean, default: false },
  conveyedTitle: { type: Boolean, default: false },
  preForeclosureSale: { type: Boolean, default: false },
  propertyForeclosed: { type: Boolean, default: false },
  outstandingJudgements: { type: Boolean, default: false },
  declaredBankruptcy: { type: Boolean, default: false },
  bankruptcyType: { type: String, default: '' },
  familyRelationship: { type: Boolean, default: false },
  firstTimeBuyer: { type: Boolean, default: false }
});

const demographicsSchema = new mongoose.Schema({
  ethnicity: { type: String, default: '' },
  origin: { type: String, default: '' },
  otherOrigin: { type: String, default: '' },
  gender: { type: String, default: '' },
  race: { type: String, default: '' },
  tribe: { type: String, default: '' },
  asianOrigin: { type: String, default: '' },
  pacificIslanderOrigin: { type: String, default: '' }
});

const borrowerDetailsSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  suffix: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  ssn: {
    type: String,
    trim: true
  },
  citizenship: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  dependents: [{
    name: {
      type: String,
      trim: true
    },
    age: Number,
    relationship: String
  }],
  currentAddress: {
    streetAddress: String,
    aptSteNum: String,
    city: String,
    state: String,
    zipCode: String,
    housingStatus: String,
    yearsAtAddress: Number,
    monthsAtAddress: Number,
    monthlyPayment: Number
  },
  mailingAddress: {
    sameAsCurrentAddress: Boolean,
    streetAddress: String,
    aptSteNum: String,
    city: String,
    state: String,
    zipCode: String
  },
  previousAddresses: [{
    streetAddress: String,
    aptSteNum: String,
    city: String,
    state: String,
    zipCode: String,
    housingStatus: String,
    yearsAtAddress: Number,
    monthsAtAddress: Number
  }],
  employers: [{
    companyName: String,
    companyPhone: String,
    employmentStatus: String,
    jobTitle: String,
    startDate: Date,
    endDate: Date,
    yearsInProfession: Number,
    monthsInProfession: Number,
    streetAddress: String,
    aptSteNum: String,
    city: String,
    state: String,
    zipCode: String,
    monthlyIncome: Number,
    isSelfEmployed: String,
    ownsMoreThan25Percent: String
  }]
});

const loanSchema = new mongoose.Schema({
  loanNumber: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values during creation
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  borrowerDetails: borrowerDetailsSchema,
  coBorrowers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower'
  }],
  assignedLoanOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  property: propertySchema,
  loanDetails: loanDetailSchema,
  loanParameters: loanParametersSchema,
  loanCalculations: loanCalculationsSchema,
  status: {
    type: String,
    enum: [
      'Pre-Qualification',
      'Application Started',
      'Application Submitted',
      'Processing',
      'Underwriting',
      'Conditional Approval',
      'Approved-Not-Accepted',
      'Clear to Close',
      'Closed',
      'Funded',
      'Declined',
      'Withdrawn',
      'Closed-Incomplete'   // MCR AC060 — loan file closed without action
    ],
    default: 'Application Started'
  },
  processingStatus: {
    type: String,
    enum: ['Lead', 'Application', 'Processing', 'Approval', 'Closing'],
    default: 'Lead'
  },
  marketingStatus: {
    type: String,
    enum: ['New Prospect', 'Hot Lead', 'Follow Up', 'Nurture', 'Closed'],
    default: 'New Prospect'
  },
  approvalType: {
    type: String,
    enum: ['Pre-Qualification', 'Pre-Approval', 'Final Approval'],
    default: 'Pre-Qualification'
  },
  approvalExpirationDate: {
    type: Date
  },
  closeOfEscrowDate: {
    type: Date
  },
  milestones: [milestoneSchema],
  conditions: [conditionSchema],
  documents: [documentSchema],
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
  // URLA Form 1003 specific fields
  assets: {
    checkingAndSavings: [{
      bankName: {
        type: String,
        trim: true
      },
      accountType: {
        type: String,
        enum: ['Checking', 'Savings', 'Money Market', 'Certificate of Deposit']
      },
      value: {
        type: Number,
        min: 0
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      isLiquid: {
        type: Boolean,
        default: false
      }
    }],
    stocksAndBonds: [{
      description: {
        type: String,
        trim: true
      },
      value: {
        type: Number,
        min: 0
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      isLiquid: {
        type: Boolean,
        default: false
      }
    }],
    giftsAndGrants: [{
      assetType: {
        type: String,
        enum: ['Cash Gift', 'Grant', 'Down Payment Assistance', 'Other']
      },
      source: {
        type: String,
        enum: ['Relative', 'Friend', 'Employer', 'Municipality', 'Non-Profit', 'Other']
      },
      value: {
        type: Number,
        min: 0
      },
      deposited: {
        type: Boolean,
        default: false
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      isLiquid: {
        type: Boolean,
        default: false
      }
    }],
    miscellaneous: {
      earnestMoney: {
        type: Number,
        min: 0,
        default: 0
      },
      lifeInsurance: {
        type: Number,
        min: 0,
        default: 0
      },
      vestedInterestInRetirement: {
        type: Number,
        min: 0,
        default: 0
      },
      otherAssets: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },
  income: incomeSchema,
  debts: [debtSchema],
  expenses: [{
    expenseType: String,
    amount: Number,
  }],
  propertiesOwned: {
    ownsProperty: {
      type: Boolean,
      default: false
    },
    properties: [propertyOwnedSchema],
    rent: {
      type: Number,
      default: 0
    },
    firstMortgage: {
      type: Number,
      default: 0
    },
    otherFinancing: {
      type: Number,
      default: 0
    },
    hazardInsurance: {
      type: Number,
      default: 0
    },
    realEstateTaxes: {
      type: Number,
      default: 0
    },
    mortgageInsurance: {
      type: Number,
      default: 0
    },
    hoaDues: {
      type: Number,
      default: 0
    },
    otherHousingExpenses: {
      type: Number,
      default: 0
    }
  },
  militaryService: militaryServiceSchema,
  declarations: declarationsSchema,
  demographics: demographicsSchema,
  
  // Financial calculations
  financialCalculations: {
    dti: {
      type: Number, // Debt-to-Income ratio
      min: 0,
      max: 100
    },
    ltv: {
      type: Number, // Loan-to-Value ratio
      min: 0,
      max: 100
    },
    cltv: {
      type: Number, // Combined Loan-to-Value ratio
      min: 0,
      max: 100
    },
    piti: {
      type: Number, // Principal, Interest, Taxes, Insurance monthly payment
      min: 0
    },
    totalMonthlyPayment: {
      type: Number,
      min: 0
    },
    totalIncome: {
      type: Number,
      min: 0
    },
    totalDebts: {
      type: Number,
      min: 0
    },
    housingRatio: {
      type: Number, // Front-end ratio
      min: 0,
      max: 100
    }
  },
  // ===== MCR CLASSIFICATION FIELDS =====

  // Source of Business / Channel (RMLA Section II: I210–I240)
  leadSource: {
    type: String,
    enum: ['Retail', 'Wholesale-Brokered', 'Correspondent', 'Table-Funded', 'Other'],
    default: 'Retail'
  },

  // Funding Method / Warehouse Routing (drives Brokered vs Non-Delegated columns)
  // This is distinct from leadSource, which is a marketing channel.
  fundingMethod: {
    type: String,
    enum: ['Brokered', 'Retail', 'Non-Delegated', 'Delegated', 'Table-Funded', 'Unknown'],
    default: 'Brokered'
  },

  // Documentation Type (RMLA Section II: I270)
  docType: {
    type: String,
    enum: ['Full Doc', 'Alt/Reduced Doc', 'Bank Statement', 'DSCR', 'Stated'],
    default: 'Full Doc'
  },

  // Interest Only (RMLA Section II: I280)
  interestOnlyFlag: {
    type: Boolean,
    default: false
  },

  // HOEPA (AC400 — Home Ownership and Equity Protection Act)
  hoeparFlag: {
    type: Boolean,
    default: false
  },

  // QM Status (AC920–AC940 — Qualified Mortgage Classification)
  qmStatus: {
    type: String,
    enum: ['QM-Safe Harbor', 'QM-Rebuttable Presumption', 'Non-QM', 'Not Subject to QM', 'Exempt'],
    default: 'QM-Safe Harbor'
  },

  // Reverse Mortgage flag (AC700–AC890)
  isReverseMortgage: {
    type: Boolean,
    default: false
  },

  // Reverse Mortgage subtype (AC700/AC710/AC720)
  reverseMortgageType: {
    type: String,
    enum: ['HECM-Standard', 'HECM-Saver', 'Proprietary/Other'],
    default: null
  },

  // Prepayment Penalty flag (RMLA Section II: I300–I309)
  hasPrepaymentPenalty: {
    type: Boolean,
    default: false
  },

  // Piggyback Second flag (RMLA Section II: I340–I349)
  isPiggybackSecond: {
    type: Boolean,
    default: false
  },

  // Mortgage Insurance flag (RMLA Section II: I330–I339)
  hasMortgageInsurance: {
    type: Boolean,
    default: false
  },

  // Adverse Action / Denial reasons (Reg B)
  denialReasons: [{
    type: String,
    trim: true
  }],
  denialReasonOtherText: {
    type: String,
    trim: true
  },

  // Exclude from MCR — per ARIVE screenshot, allows excluding specific loans
  excludeFromMCR: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isSyncedToLOS: {
    type: Boolean,
    default: false
  },
  editingEnabled: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== MCR STATUS HISTORY TRACKING =====
// Track the original status for change detection
loanSchema.post('init', function(doc) {
  doc._original_status = doc.status;
});

// ===== MCR AUTO-FILL: Derive classification flags from existing loan data =====
loanSchema.pre('save', async function(next) {
  try {
    const loanType = this.loanDetails?.loanType;
    const ltv = this.financialCalculations?.ltv || 0;
    const mortgageInsCalc = this.loanCalculations?.mortgageInsurance || 0;

    // Auto-derive isReverseMortgage from loanDetails.loanType
    if (loanType === 'Reverse Mortgage' && !this.isReverseMortgage) {
      this.isReverseMortgage = true;
    }

    // Auto-derive hasMortgageInsurance from LTV > 80 or MI calc > 0
    // (FHA/VA always have MI, checked below via program lookup)
    if (!this.isModified('hasMortgageInsurance')) {
      if (mortgageInsCalc > 0 || ltv > 80) {
        this.hasMortgageInsurance = true;
      }
    }

    // Auto-derive qmStatus heuristics (only if still default and not manually changed)
    if (!this.isModified('qmStatus') && this.qmStatus === 'QM-Safe Harbor') {
      if (this.docType === 'Bank Statement' || this.docType === 'DSCR') {
        this.qmStatus = 'Non-QM';
      }
      // FHA/VA loans are QM-Exempt — check via program lookup
      if (this.loanParameters?.selectedProgramId) {
        try {
          const LoanProgram = mongoose.model('LoanProgram');
          const program = await LoanProgram.findById(this.loanParameters.selectedProgramId).lean();
          if (program) {
            const pType = (program.programType || '').toLowerCase();
            if (pType === 'fha' || pType === 'va' || isFsaRhsGuaranteed(program.programType)) {
              this.qmStatus = 'Exempt';
              // FHA always has MI
              if (pType === 'fha') this.hasMortgageInsurance = true;
            }
          }
        } catch (e) { /* program lookup failed — skip */ }
      }
    }
  } catch (err) {
    console.error('MCR auto-fill hook error:', err.message);
  }
  next();
});

// Pre-save hook: Record status changes in LoanStatusHistory & auto-populate audit dates
loanSchema.pre('save', async function(next) {
  if (this.isModified('status') && !this.isNew) {
    try {
      const LoanStatusHistory = mongoose.model('LoanStatusHistory');
      const historyEntry = {
        loan: this._id,
        previousStatus: this._original_status || null,
        newStatus: this.status,
        changedBy: this._changedBy || null,
        changeReason: this._changeReason || null
      };
      
      // Attach adverse action data if present (for Withdrawn/Declined status changes)
      if (this._adverseAction) {
        historyEntry.adverseAction = this._adverseAction;
      }
      
      await LoanStatusHistory.create(historyEntry);

      // Auto-populate audit dates on LoanCompensation
      const LoanCompensation = mongoose.model('LoanCompensation');
      const dateMap = {
        'Application Submitted': 'applicationDate',
        'Conditional Approval': 'approvalDate',
        'Clear to Close': 'clearToCloseDate',
        'Declined': 'denialDate',
        'Withdrawn': 'withdrawnDate',
        'Closed-Incomplete': 'closedIncompleteDate',
        'Closed': 'closingDate',
        'Funded': 'fundedDate'
      };
      const dateField = dateMap[this.status];
      if (dateField) {
        // Use save() instead of findOneAndUpdate so the pre-save auto-fill hook runs
        let comp = await LoanCompensation.findOne({ loan: this._id });
        if (!comp) {
          comp = new LoanCompensation({ loan: this._id });
        }
        if (!comp[dateField]) {
          comp[dateField] = new Date();
        }
        await comp.save(); // triggers auto-derive for noteDate, firstPaymentDate etc.
      }
    } catch (err) {
      console.error('MCR status history hook error:', err.message);
      // Don't block the save — log and continue
    }
  }
  next();
});

// Post-save hook: Auto-create LoanCompensation record for new loans
loanSchema.post('save', async function(doc) {
  if (doc._wasNew) {
    try {
      const LoanCompensation = mongoose.model('LoanCompensation');
      let comp = await LoanCompensation.findOne({ loan: doc._id });
      if (!comp) {
        comp = new LoanCompensation({ loan: doc._id });
        await comp.save(); // triggers LoanCompensation pre-save auto-fill
      }

      // Also create initial status history entry
      const LoanStatusHistory = mongoose.model('LoanStatusHistory');
      await LoanStatusHistory.create({
        loan: doc._id,
        previousStatus: null,
        newStatus: doc.status,
        changedBy: doc._changedBy || null,
        changeReason: 'Loan created'
      });
    } catch (err) {
      console.error('MCR post-save hook error:', err.message);
    }
  }
});

// Track isNew flag before save (post-save can't access isNew)
loanSchema.pre('save', function(next) {
  this._wasNew = this.isNew;
  next();
});

// Generate unique loan number with format yyyymmdd + 3-digit sequence
loanSchema.pre('save', async function(next) {
  if (!this.isNew || this.loanNumber) return next();
  
  try {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Create prefix with full date (resets sequence daily)
    const prefix = `${year}${month}${day}`;
    
    // Find the latest loan with today's date prefix
    const latestLoan = await this.constructor.findOne(
      { loanNumber: new RegExp(`^${prefix}`) },
      { loanNumber: 1 },
      { sort: { loanNumber: -1 } }
    );
    
    let sequenceNumber = 1;
    if (latestLoan && latestLoan.loanNumber) {
      // Extract the 3-digit sequence from the end of the loan number
      const currentSequence = parseInt(latestLoan.loanNumber.slice(-3), 10);
      if (!isNaN(currentSequence)) {
        sequenceNumber = currentSequence + 1;
      }
    }
    
    // Format as yyyymmdd + 3-digit sequence (e.g., 20250101001)
    this.loanNumber = `${prefix}${sequenceNumber.toString().padStart(3, '0')}`;
    return next();
  } catch (error) {
    return next(error);
  }
});

// Indexes for performance optimization
loanSchema.index({ lender: 1 });
loanSchema.index({ borrower: 1 });
loanSchema.index({ lender: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });
// MCR indexes
loanSchema.index({ excludeFromMCR: 1, status: 1 });
loanSchema.index({ 'property.state': 1, status: 1 });
loanSchema.index({ leadSource: 1 });

module.exports = mongoose.model('Loan', loanSchema);

