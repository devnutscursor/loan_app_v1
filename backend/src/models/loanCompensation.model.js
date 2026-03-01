const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * LoanCompensation - Per-Loan Revenue, Audit Dates & Classification
 * 
 * Stores all per-loan financial, classification, and audit date data
 * that the MCR requires. One-to-one relationship with Loan.
 * 
 * Serves as the data source for:
 * - "Funding / Revenue" tab (in-loan)
 * - "Audit & Dates" tab (in-loan)
 * - "MCR Data Audit" tab (in-loan)
 * - MCR Tab 3: Revenue Data (AC1010–AC1290)
 * - MCR Tab 2: Closed Loan Data (fees)
 */
const LoanCompensationSchema = new Schema({
  loan: {
    type: Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
    unique: true,  // 1-to-1 with Loan
    index: true
  },

  // ===== REVENUE INFO (MCR Tab 3: Revenue Data) =====
  // Maps to AC1010–AC1290 fields
  brokerCompensation: {
    type: Number,       // Total broker compensation received
    default: 0,
    min: 0
  },
  brokerCompPaidBy: {
    type: String,       // Who pays broker comp
    enum: ['Borrower', 'Lender', 'Split', 'N/A'],
    default: 'Lender'
  },
  originationFee: {
    type: Number,       // Borrower-paid service charge (AC1010 / C210)
    default: 0,
    min: 0
  },
  processingFee: {
    type: Number,       // Admin/junk fees
    default: 0,
    min: 0
  },
  discountPoints: {
    type: Number,       // Fee to buy down rate (AC1040 / FS040)
    default: 0,
    min: 0
  },
  srpAmount: {
    type: Number,       // Service Release Premium (AC1020 / FS020)
    default: 0,
    min: 0
  },
  yspAmount: {
    type: Number,       // Yield Spread Premium (AC1030 / FS030)
    default: 0,
    min: 0
  },
  passThruFees: {
    type: Number,       // Pass-through fees from borrower to third parties
    default: 0,
    min: 0
  },
  toleranceCure: {
    type: Number,       // TRID tolerance cure amount
    default: 0,
    min: 0
  },
  brokerFlatFees: {
    type: Number,       // Flat fee charged by broker
    default: 0,
    min: 0
  },
  loanRevenue: {
    type: Number,       // Total loan revenue (calculated or manual)
    default: 0
  },
  lenderFeesCollected: {
    type: Number,       // AC610 — Lender fees collected at closing
    default: 0,
    min: 0
  },

  // ===== PRODUCT INFO =====
  finalRate: {
    type: Number,       // Final interest rate at closing (may differ from lock rate)
    default: null
  },
  rateLockPeriod: {
    type: Number,       // Lock period in days (e.g., 30, 45, 60)
    default: null
  },
  rateLockDate: {
    type: Date,
    default: null
  },
  rateLockExpiry: {
    type: Date,         // Rate lock expiration date
    default: null
  },

  // ===== LOAN CLASSIFICATION (MCR Tab 2 & Section II) =====
  lienPosition: {
    type: String,
    enum: ['1st', '2nd', 'Not Secured by Lien'],  // AC500, AC510, AC520
    default: '1st'
  },
  amortizationType: {
    type: String,
    enum: ['Fixed', 'ARM', 'Option ARM'],
    default: 'Fixed'
  },

  // ===== CRITICAL AUDIT DATES =====
  // These dates are essential for MCR "time travel" and audit trail
  applicationDate: {
    type: Date,         // When borrower formally applied
    default: null
  },
  approvalDate: {
    type: Date,         // When loan was approved / conditional approval
    default: null
  },
  denialDate: {
    type: Date,         // When loan was denied
    default: null
  },
  withdrawnDate: {
    type: Date,         // When borrower withdrew
    default: null
  },
  closedIncompleteDate: {
    type: Date,         // When loan was closed as incomplete
    default: null
  },
  clearToCloseDate: {
    type: Date,         // CTC date
    default: null
  },
  closingDate: {
    type: Date,         // Actual closing/signing date
    default: null
  },
  fundedDate: {
    type: Date,         // When funds were disbursed
    default: null       // Auto-fill when status → "Funded", but allow manual edits
  },
  disbursementDate: {
    type: Date,         // When check/wire was sent
    default: null
  },
  firstPaymentDate: {
    type: Date,         // Borrower's first payment date
    default: null
  },
  noteDate: {
    type: Date,         // Promissory note date
    default: null
  },
  recordingDate: {
    type: Date,         // When deed/mortgage was recorded
    default: null
  },

  // ===== ADDITIONAL MCR FIELDS =====
  cashOutAmount: {
    type: Number,       // Cash-out amount for refi
    default: 0,
    min: 0
  },
  investorSoldTo: {
    type: String,       // Who the loan was sold to
    enum: ['Fannie Mae', 'Freddie Mac', 'Ginnie Mae', 'Private Investor',
           'FHLBank', 'Life Insurance', 'Commercial Bank', 'Other', 'Not Sold'],
    default: 'Not Sold'
  },
  warehousePeriodDays: {
    type: Number,       // Days loan was on warehouse line (I440–I460)
    default: null
  },

  // ===== SERVICING DISPOSITION =====
  // AC1200–AC1290: What happened to servicing rights
  servicingDisposition: {
    type: String,
    enum: ['Released', 'Retained', 'N/A'],
    default: 'Released'   // Most brokers release servicing
  }
}, {
  timestamps: true
});

// ===== AUTO-FILL HOOKS =====

/**
 * Pre-save: Auto-derive fields from related Loan data and compute calculated fields.
 * Runs on every save — only fills fields that are null/0/default (won't overwrite manual edits).
 */
LoanCompensationSchema.pre('save', async function(next) {
  try {
    const Loan = mongoose.model('Loan');
    const loan = await Loan.findById(this.loan)
      .populate('loanParameters.selectedProgramId')
      .lean();

    if (!loan) return next();

    const loanType = loan.loanDetails?.loanType;
    const program = loan.loanParameters?.selectedProgramId; // populated object or null

    // --- Auto-derive finalRate from loanParameters.interestRate ---
    if (this.finalRate == null && loan.loanParameters?.interestRate) {
      this.finalRate = loan.loanParameters.interestRate;
    }

    // --- Auto-derive amortizationType from program ---
    if (this.amortizationType === 'Fixed' && !this.isModified('amortizationType') && program) {
      if (program.isAdjustableRateMortgage === true) {
        this.amortizationType = 'ARM';
      }
    }

    // --- Auto-derive lienPosition ---
    if (this.lienPosition === '1st' && !this.isModified('lienPosition')) {
      if (loan.isPiggybackSecond) {
        this.lienPosition = '2nd';
      } else if (loanType === 'HELOC') {
        this.lienPosition = '2nd';
      }
    }

    // --- Auto-derive cashOutAmount for Cash-Out Refi ---
    if (this.cashOutAmount === 0 && !this.isModified('cashOutAmount')) {
      if (loanType === 'Cash-Out Refinance') {
        const loanAmt = loan.loanDetails?.loanAmount || loan.loanParameters?.loanAmount || 0;
        const currentBalance = loan.loanDetails?.currentLoanBalance || 0;
        if (loanAmt > currentBalance && currentBalance > 0) {
          this.cashOutAmount = loanAmt - currentBalance;
        }
      }
    }

    // --- Auto-derive rateLockExpiry from rateLockDate + rateLockPeriod ---
    if (!this.rateLockExpiry && this.rateLockDate && this.rateLockPeriod) {
      const expiry = new Date(this.rateLockDate);
      expiry.setDate(expiry.getDate() + this.rateLockPeriod);
      this.rateLockExpiry = expiry;
    }

    // --- Auto-derive noteDate (defaults to closingDate if not set) ---
    if (!this.noteDate && this.closingDate) {
      this.noteDate = this.closingDate;
    }

    // --- Auto-derive firstPaymentDate (first of month, >= closingDate + 45 days) ---
    if (!this.firstPaymentDate && this.closingDate) {
      const fpd = new Date(this.closingDate);
      fpd.setDate(fpd.getDate() + 45);
      // Move to first day of next month
      fpd.setMonth(fpd.getMonth() + 1, 1);
      fpd.setHours(0, 0, 0, 0);
      this.firstPaymentDate = fpd;
    }

    // --- Auto-derive originationFee from program fees (seed if still 0) ---
    if (this.originationFee === 0 && !this.isModified('originationFee') && program) {
      if (program.originationFees) {
        if (program.originationFees.type === 'flat' && program.originationFees.value > 0) {
          this.originationFee = program.originationFees.value;
        } else if (program.originationFees.type === 'percentage' && program.originationFees.value > 0) {
          const amt = loan.loanParameters?.loanAmount || loan.loanDetails?.loanAmount || 0;
          this.originationFee = Math.round((program.originationFees.value / 100) * amt);
        }
      }
    }

    // --- Auto-calculate loanRevenue as sum of components (if not manually set) ---
    if (!this.isModified('loanRevenue') || this.loanRevenue === 0) {
      const computed = (this.originationFee || 0) +
        (this.processingFee || 0) +
        (this.srpAmount || 0) +
        (this.yspAmount || 0) +
        (this.brokerFlatFees || 0) +
        (this.lenderFeesCollected || 0) -
        (this.toleranceCure || 0);
      if (computed > 0) {
        this.loanRevenue = computed;
      }
    }

  } catch (err) {
    console.error('LoanCompensation auto-fill error:', err.message);
  }
  next();
});

module.exports = mongoose.model('LoanCompensation', LoanCompensationSchema);
