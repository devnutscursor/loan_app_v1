const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  
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
      'Planned Unit Development (PUD)'
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
    max: 4
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
  }
});

const loanDetailSchema = new mongoose.Schema({
  loanType: {
    type: String,
    enum: [
      'Purchase',
      'Refinance',
      'Construction'
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
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  primaryBorrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
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
      'Clear to Close',
      'Closed',
      'Funded',
      'Declined',
      'Withdrawn'
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
  isActive: {
    type: Boolean,
    default: true
  },
  isSyncedToLOS: {
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

// Generate unique loan number
loanSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the latest loan with the same year/month prefix
    const prefix = `LN${year}${month}`;
    const latestLoan = await this.constructor.findOne(
      { loanNumber: new RegExp(`^${prefix}`) },
      { loanNumber: 1 },
      { sort: { loanNumber: -1 } }
    );
    
    let sequenceNumber = 1;
    if (latestLoan && latestLoan.loanNumber) {
      const currentSequence = parseInt(latestLoan.loanNumber.slice(-4), 10);
      if (!isNaN(currentSequence)) {
        sequenceNumber = currentSequence + 1;
      }
    }
    
    this.loanNumber = `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model('Loan', loanSchema);
