const mongoose = require('mongoose');

const privateMortgageInsuranceSchema = new mongoose.Schema({
  minLTV: {
    type: Number,
    required: true
  },
  maxLTV: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  }
});

const originationFeeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['none', 'points', 'flat', 'percentage'],
    default: 'none'
  },
  value: {
    type: Number,
    default: 0
  },
  frequency: {
    type: String,
    enum: ['once', 'mo', 'yr'],
    default: 'once'
  }
});

const closingCostSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['none', 'points', 'flat', 'percentage'],
    default: 'none'
  },
  value: {
    type: Number,
    default: 0
  },
  frequency: {
    type: String,
    enum: ['once', 'mo', 'yr'],
    default: 'once'
  }
});

const otherFeeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['none', 'points', 'flat', 'percentage'],
    default: 'none'
  },
  value: {
    type: Number,
    default: 0
  },
  frequency: {
    type: String,
    enum: ['once', 'mo', 'yr'],
    default: 'once'
  }
});

const loanProgramSchema = new mongoose.Schema({
  // Basic Program Info
  programName: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  programType: {
    type: String,
    enum: ['conventional', 'fha', 'va', 'usda', 'jumbo', 'other'],
    required: true
  },
  isAvailableToBorrower: {
    type: Boolean,
    default: true
  },
  isDefaultForIntegrations: {
    type: Boolean,
    default: false
  },
  
  // Loan Parameters
  loanHelpText: {
    type: String,
    trim: true
  },
  preApprovalLetterTemplate: {
    type: String,
    default: 'standard'
  },
  
  // Rate Information
  rateAdjustment: {
    type: Number,
    default: 0
  },
  
  // Loan Term
  loanTerm: {
    type: Number,
    enum: [10, 15, 20, 25, 30],
    default: 30
  },
  
  // Restrictions
  restrictions: {
    dtiRestriction: {
      max: {
        type: Number,
        default: 50
      }
    },
    downPaymentRestriction: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number
      }
    },
    loanAmountRestriction: {
      min: {
        type: Number
      },
      max: {
        type: Number
      }
    }
  },
  
  // Fees
  privateMortgageInsurance: [privateMortgageInsuranceSchema],
  upfrontMortgageInsurance: {
    type: Number,
    default: 0
  },
  mortgageInsurance: {
    type: Number,
    default: 0
  },
  fmi: {
    type: Number,
    default: 0
  },
  fundingFee: {
    type: Number,
    default: 0
  },
  
  // Finance Fees
  originationFees: originationFeeSchema,
  closingCosts: closingCostSchema,
  otherFees: otherFeeSchema,
  
  // Additional Options
  isAdjustableRateMortgage: {
    type: Boolean,
    default: false
  },
  allowSubjectPropertyAddress: {
    type: Boolean,
    default: true
  },
  lockLoanData: {
    type: Boolean,
    default: false
  },
  
  // Lender association - This makes loan programs unique per lender
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true,
    index: true
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('LoanProgram', loanProgramSchema);
