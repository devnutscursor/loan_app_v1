const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
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
  county: {
    type: String,
    trim: true
  },
  propertyType: {
    type: String,
    enum: [
      'Single Family Residence',
      'Condominium',
      'Townhouse',
      'Multi-Family (2-4 Units)',
      'Manufactured Home',
      'Cooperative',
      'Planned Unit Development (PUD)'
    ],
    required: true
  },
  occupancyType: {
    type: String,
    enum: ['Primary Residence', 'Secondary Home', 'Investment Property'],
    required: true
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
  loanPurpose: {
    type: String,
    enum: ['Purchase', 'Refinance'],
    required: true
  },
  loanType: {
    type: String,
    enum: [
      'Conventional',
      'FHA',
      'VA',
      'USDA',
      'Jumbo',
      'DSCR',
      'Construction'
    ],
    required: true
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  downPayment: {
    type: Number,
    min: 0
  },
  downPaymentPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  interestRate: {
    type: Number,
    min: 0
  },
  loanTerm: {
    type: Number,
    enum: [10, 15, 20, 25, 30, 40],
    default: 30
  },
  monthlyPayment: {
    type: Number,
    min: 0
  },
  isFixedRate: {
    type: Boolean,
    default: true
  },
  includeEscrow: {
    type: Boolean,
    default: true
  },
  includeMortgageInsurance: {
    type: Boolean,
    default: true
  },
  estimatedClosingCosts: {
    type: Number,
    min: 0
  },
  estimatedCashToClose: {
    type: Number,
    min: 0
  },
  fundingFeePercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  fundingFeeAmount: {
    type: Number,
    min: 0
  }
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
  debtType: {
    type: String,
    trim: true
  },
  creditorName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  monthlyPayment: {
    type: Number,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    min: 0
  },
  remainingMonths: {
    type: Number,
    min: 0
  }
});

const propertyOwnedSchema = new mongoose.Schema({
  propertyAddress: {
    streetAddress: String,
    city: String,
    state: String,
    zipCode: String
  },
  propertyType: String,
  marketValue: Number,
  mortgageBalance: Number,
  monthlyPayment: Number,
  rentalIncome: Number
});

const militaryServiceSchema = new mongoose.Schema({
  isMilitary: Boolean,
  serviceStatus: String,
  dateOfService: Date
});

const declarationsSchema = new mongoose.Schema({
  occupyAsPrimary: Boolean,
  firstTimeBuyer: Boolean,
  ownOtherProperties: Boolean,
  bankruptcyHistory: Boolean,
  foreclosureHistory: Boolean,
  lawsuitPending: Boolean,
  obligatedToPayAlimony: Boolean,
  downPaymentBorrowed: Boolean,
  coMakerOrEndorser: Boolean,
  usCitizen: Boolean,
  permanentResident: Boolean
});

const demographicsSchema = new mongoose.Schema({
  ethnicity: String,
  origin: String,
  gender: String,
  race: String,
  tribe: String
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
    monthlyIncome: Number
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
    bankAccounts: [assetSchema],
    otherAssets: [assetSchema]
  },
  income: incomeSchema,
  debts: [debtSchema],
  expenses: [{
    expenseType: String,
    amount: Number,
    description: String
  }],
  propertiesOwned: [propertyOwnedSchema],
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
