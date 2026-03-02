const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * LoanStatusHistory - The Snapshot Engine
 * 
 * Tracks every status transition for every loan with timestamps.
 * This enables "time travel" queries — determining what a loan's status was
 * at any historical point in time, which is critical for MCR quarterly reporting.
 * 
 * Query Pattern — "What was Loan X's status on March 31?"
 *   const statusOnDate = await LoanStatusHistory.findOne({
 *     loan: loanId,
 *     createdAt: { $lte: new Date('2026-03-31T23:59:59.999Z') }
 *   }).sort({ createdAt: -1 });
 *   // statusOnDate.newStatus = the status as of that date
 */
const LoanStatusHistorySchema = new Schema({
  loan: {
    type: Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: null  // null for initial creation
  },
  newStatus: {
    type: String,
    required: true
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  changeReason: {
    type: String,
    trim: true
  },
  // Adverse action data — populated when status → Withdrawn or Declined
  adverseAction: {
    adverseDate: { type: Date },
    adverseReason: {
      type: String,
      enum: [
        'App Withdrawn By Borrower',
        'App Denied',
        'Preapproval Request Denied',
        'Preapproval Accepted - Not Converted',
        null
      ]
    },
    withdrawnReason: {
      type: String,
      enum: [
        'Competitor Offered Lower Rate Or Better Terms',
        'Home For Sale',
        'No Reason Provided',
        'Other',
        'Purchased Agreement Cancelled',
        'Service Unsatisfactory',
        'Unexpected Life Event',
        null
      ]
    },
    creditDecision: {
      basedOnCreditReport: { type: Boolean, default: false },
      basedOnOutsideSource: { type: Boolean, default: false },
      basedOnOther: { type: Boolean, default: false },
      basedOnOtherText: { type: String, trim: true }
    },
    deliveryType: { type: String, trim: true },
    deliveryDate: { type: Date },
    sendNotification: { type: Boolean, default: true }
  }
}, {
  timestamps: true  // createdAt = the exact moment of the status change
});

// Critical index for "time travel" queries — find latest status before a date
LoanStatusHistorySchema.index({ loan: 1, createdAt: -1 });
// Index for period-range queries — find all loans that entered a status in a date range
LoanStatusHistorySchema.index({ newStatus: 1, createdAt: 1 });
// Index for finding status transitions within a period
LoanStatusHistorySchema.index({ loan: 1, newStatus: 1, createdAt: -1 });

module.exports = mongoose.model('LoanStatusHistory', LoanStatusHistorySchema);
