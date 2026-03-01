const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * MCRReport - Saved Report Snapshots
 * 
 * Stores the frozen results of a generated MCR report.
 * Once generated, the data is snapshotted so it won't change
 * even if underlying loan data changes later.
 * 
 * Supports:
 * - Per-state reporting (states[] array + perStateData map)
 * - LO-level or Company-level reports
 * - 5 NMLS tabs + Financial Condition
 * - Export to Excel/XML
 * - Generated Reports history table
 */
const MCRReportSchema = new Schema({
  // --- Report Identity ---
  lender: {
    type: Schema.Types.ObjectId,
    ref: 'Lender'
    // optional: admin platform-wide reports have no single lender
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // --- Report Scope ---
  year: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // --- State-Based Reporting ---
  states: [{
    type: String    // Array of state codes: ['CA', 'TX', 'FL']
  }],
  reportType: {
    type: String,
    enum: ['LO', 'Company'],  // "Generate as LO" toggle
    default: 'Company'
  },
  loanOfficer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null  // Only populated when reportType = 'LO'
  },

  // --- Frozen Report Data (snapshot at generation time) ---
  applicationData: {
    type: Schema.Types.Mixed,    // Tab 1: AC010–AC090 results
    default: {}
  },
  closedLoanData: {
    type: Schema.Types.Mixed,    // Tab 2: AC100–AC990 results
    default: {}
  },
  revenueData: {
    type: Schema.Types.Mixed,    // Tab 3: AC1010–AC1290 results
    default: {}
  },
  mloData: {
    type: Schema.Types.Mixed,    // Tab 4: Per-LO attribution
    default: {}
  },
  rmlaData: {
    type: Schema.Types.Mixed,    // Tab 5: I010–I460 results
    default: {}
  },
  financialCondition: {
    type: Schema.Types.Mixed,    // Schedules A, B, C, CF, D, O
    default: {}
  },

  // --- Per-State Results ---
  perStateData: {
    type: Map,                   // Key = state code, Value = { appData, closedData, ... }
    of: Schema.Types.Mixed,
    default: {}
  },

  // --- Metadata ---
  fileName: {
    type: String,               // Display name in the Generated Reports table
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'final', 'submitted'],
    default: 'draft'
  },
  exportFormat: {
    type: String,
    enum: ['excel', 'xml', null],
    default: null
  },
  validationErrors: [{
    code: String,
    message: String,
    severity: { type: String, enum: ['error', 'warning'] }
  }],
  notes: {
    type: String,
    trim: true
  },

  // --- Loan Count Summary ---
  totalLoansIncluded: { type: Number, default: 0 },
  totalLoansExcluded: { type: Number, default: 0 }  // Loans with excludeFromMCR = true
}, {
  timestamps: true
});

MCRReportSchema.index({ lender: 1, year: 1, period: 1 });
MCRReportSchema.index({ company: 1, year: 1, period: 1 });
MCRReportSchema.index({ generatedBy: 1, createdAt: -1 });

module.exports = mongoose.model('MCRReport', MCRReportSchema);
