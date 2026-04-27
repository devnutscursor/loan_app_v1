# MCR (Mortgage Call Report) — Full Implementation Plan v2

**Product:** LoanApp360 (Syncly360 CRM)  
**Module:** NMLS Mortgage Call Report (MCR) — Form Version 6  
**Date:** February 25, 2026 (Updated)  
**Target Users:** Mortgage Brokers (Primary) & Non-Delegated Correspondents  
**Reference:** Official NMLS MCR Definitions Document + ARIVE System UI Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Codebase Analysis](#2-current-codebase-analysis)
3. [Gap Analysis — What Exists vs. What's Needed](#3-gap-analysis)
4. [Database Schema Changes](#4-database-schema-changes)
5. [Backend Implementation Plan](#5-backend-implementation-plan)
6. [Frontend Implementation Plan](#6-frontend-implementation-plan)
7. [In-Loan MCR Tabs (Loan Center, Audit & Dates, Funding/Revenue, MCR Data Audit)](#7-in-loan-mcr-tabs)
8. [MCR Report Generation Workflow (2-Step Flow)](#8-mcr-report-generation-workflow)
9. [MCR Report Calculation Engine (Full Logic)](#9-mcr-report-calculation-engine)
10. [Financial Condition Section (Schedules A–O)](#10-financial-condition-section)
11. [State-Based Reporting](#11-state-based-reporting)
12. [Export Functionality (Excel & XML)](#12-export-functionality)
13. [Validation & QA Checklist](#13-validation--qa-checklist)
14. [File-by-File Task Breakdown](#14-file-by-file-task-breakdown)
15. [Implementation Phases & Timeline](#15-implementation-phases--timeline)
16. [Risk & Edge Cases](#16-risk--edge-cases)
17. [NMLS Row ID Quick Reference](#appendix-a-nmls-row-id-quick-reference)
18. [Status Mapping for MCR](#appendix-b-status-mapping-for-mcr)
19. [MCR Definitions Glossary](#appendix-c-mcr-definitions-glossary)

---

## 1. Executive Summary

The MCR module enables users to generate a quarterly or annual NMLS Mortgage Call Report that is legally accurate to a **specific historical point in time** (the "Snapshot Problem"). The report is **state-based** — each report is generated per-state (based on the loan's property state), and users select which states to include.

### Report Structure (5 NMLS Tabs + Financial Condition)

| Tab | NMLS Section | Purpose |
|-----|-------------|---------|
| **Tab 1: Application Data** | RMLA Section I (AC010–AC090) | Pipeline flow — apps received, denied, withdrawn, funded, ending pipeline |
| **Tab 2: Closed Loan Data** | RMLA Section I (AC100–AC990) | Breakdown of funded loans by type, property, purpose, lien, QM status |
| **Tab 3: Revenue Data** | RMLA Section I (AC1010–AC1290) | Gross revenue from fees, broker compensation, lender fees |
| **Tab 4: MLO Data** | RMLA Section I (AC1300+) | Loan volume attribution per LO with NMLS ID |
| **Tab 5: RMLA Section II** | Schedule I (I010–I460) | Risk characteristics — product type, channel, LTV, doc type, rate type |
| **Financial Condition** | Schedules A, B, C, CF, D, O | Balance sheet, income statement, reserves (company-level, quarterly) |

### Key Workflow (from ARIVE Reference)

The report generation follows a **2-step flow:**
1. **Step 1 — Select Specifications:** Choose Year, Quarter, States (checkboxes), and "Generate as LO" toggle
2. **Step 2 — Analyze and Export:** View the 5-tab report data with state sidebar, then export as Excel or XML

### In-Loan Tabs Required by Client

Per client instructions, the following **in-loan tabs** must be built:

| Tab | Purpose |
|-----|---------|
| **Loan Center** | Consolidated loan processing hub — similar to ARIVE "Loan Center" but renamed. Central location for loan status tracking, key actions, quick-view of all critical data points |
| **Audit & Dates** | All critical audit dates the MCR needs — application date, approval date, denial date, funded date, withdrawn date, closing date, rate lock date/expiry, etc. |
| **Funding / Revenue** | Per-loan financial data — broker compensation, pass-through fees, tolerance cure, broker flat fees, loan revenue, discount points, SRP/YSP |
| **MCR Data Audit** | Read-only audit view showing Revenue Info, Product Info, Loan Info with "Exclude from MCR" toggle |

### Three Critical Architectural Requirements

1. **Snapshot Engine** — A `LoanStatusHistory` collection that tracks every status transition with timestamps, enabling "time travel" queries.
2. **Compensation / Revenue Model** — A `LoanCompensation` model storing per-loan financial data (fees, dates, classification details).
3. **State-Based Report Generation** — Reports filtered by property state, with per-state MCR settings and multi-state selection.

---

## 2. Current Codebase Analysis

### 2.1 Tech Stack
- **Backend:** Node.js + Express + Mongoose (MongoDB)
- **Frontend:** Next.js + React + Tailwind CSS
- **Auth:** JWT-based, role-based (`borrower`, `lender`, `company`, `admin`)
- **API Base:** `/api/v1/`

### 2.2 Existing Loan Model (`backend/src/models/loan.model.js`)

The Loan schema (1070 lines) contains:
- **`status`** field with enum: `Pre-Qualification`, `Application Started`, `Application Submitted`, `Processing`, `Underwriting`, `Conditional Approval`, `Clear to Close`, `Closed`, `Funded`, `Declined`, `Withdrawn`
- **`property.propertyType`**: `Single Family Home`, `Condominium`, `Townhouse`, `Multi-Family`, `Manufactured Home`, `Cooperative`, `Planned Unit Development (PUD)`
- **`property.occupancyType`**: `Primary Residence`, `Vacation Home`, `Investment`, `Other`
- **`loanDetails.loanType`**: `Purchase`, `Refinance`, `Construction`
- **`loanDetails.requestedLoanAmount`** and **`loanDetails.loanAmount`**
- **`loanParameters.selectedProgramId`** → refs `LoanProgram`
- **`loanParameters.interestRate`**
- **`financialCalculations.ltv`** — LTV ratio
- **`assignedLoanOfficer`** → refs `User`
- **`milestones[]`** — embedded array with `title`, `isCompleted`, `completedDate`
- **`createdAt`** (auto-generated via `timestamps: true`)

### 2.3 Existing Loan Program Model (`backend/src/models/loanProgram.model.js`)
- **`programType`**: `conventional`, `fha`, `va`, `usda`, `jumbo`, `other`
- **`isAdjustableRateMortgage`**: Boolean (can derive Fixed vs ARM)

### 2.4 Existing Status Update Logic (`backend/src/controllers/loan.controller.js`)
- `updateLoanStatus()` — updates `loan.status` directly with **NO history logging**.
- Auto-updates milestones based on a `milestoneMap` but does **NOT** write to any status history collection.

### 2.5 Existing Frontend In-Loan View (`frontend/src/pages/lender/loans/[id].js`)
- **Main tabs:** Loan Dashboard, Documents, Milestones, Application (expandable)
- **Application sub-tabs:** Borrower Information, Loan Details, Property Information, Financial Information, Additional Information
- **No "Loan Center", "Audit & Dates", "Funding/Revenue", or "MCR Data Audit" tabs exist.**

### 2.6 Existing Sidebar Navigation (`frontend/src/components/layout/Sidebar.js`)
- Lender nav items: Dashboard, Active Loans, Loan Programs, Loan Rates, Borrowers, Messages, Referral Links, Profile
- **No "MCR Reports" entry exists.**

### 2.7 Existing Reports Page (`frontend/src/pages/lender/reports.js`)
- Simple analytics dashboard with summary metrics. **NOT MCR-related.**

---

## 3. Gap Analysis

| Requirement | Current State | Action |
|---|---|---|
| **Loan Status History tracking** | ❌ Not tracked. Status is overwritten in-place. | **CREATE** `LoanStatusHistory` model + pre-save hook |
| **Compensation / Revenue data per loan** | ❌ Does not exist. | **CREATE** `LoanCompensation` model + UI tab |
| **Funded Date (per-loan)** | ❌ Not stored. | **ADD** to `LoanCompensation` (auto-fill on `Funded` status + editable) |
| **Lien Position** | ❌ Not stored. | **ADD** to `LoanCompensation`: `1st`, `2nd`, `Not Secured by Lien` |
| **Amortization Type** | ⚠️ Partially exists on `LoanProgram.isAdjustableRateMortgage`. | **ADD** to `LoanCompensation`: `Fixed`, `ARM`, `Option ARM` |
| **Lead Source / Channel** | ❌ Not stored. | **ADD** to Loan model: `Retail`, `Wholesale-Brokered`, `Correspondent`, `Table-Funded`, `Other` |
| **Doc Type** | ❌ Not stored. | **ADD** to Loan model: `Full Doc`, `Alt/Reduced Doc`, `Bank Statement`, `DSCR`, `Stated` |
| **Interest Only Flag** | ❌ Not stored. | **ADD** to Loan model: Boolean |
| **HOEPA Flag** | ❌ Not stored. | **ADD** to Loan model: Boolean |
| **QM Status** | ❌ Not stored. | **ADD** to Loan model: `QM-Safe Harbor`, `QM-Rebuttable Presumption`, `Non-QM`, `Not Subject to QM`, `Exempt` |
| **Loan Purpose: Home Improvement** | ❌ Missing from `loanType` enum | **ADD** `Home Improvement` to enum |
| **Loan Purpose: Cash-Out Refinance** | ❌ Missing from `loanType` enum | **ADD** `Cash-Out Refinance` to enum |
| **Closed-Incomplete status** | ❌ Missing from `status` enum | **ADD** to status enum |
| **Property State** | ⚠️ May exist in address fields | **VERIFY/ADD** `property.state` for state-based reporting |
| **Exclude from MCR flag** | ❌ Does not exist | **ADD** `excludeFromMCR` Boolean to Loan model |
| **Broker Compensation fields** | ❌ Does not exist | **ADD** to `LoanCompensation`: brokerComp, passThruFees, toleranceCure, brokerFlatFees |
| **Rate Lock Period / Expiry** | ❌ Not stored | **ADD** to `LoanCompensation`: rateLockPeriod, rateLockExpiry |
| **Cash-Out Amount** | ❌ Not stored | **ADD** to Loan or LoanCompensation |
| **Reverse Mortgage Flag** | ❌ Not stored | **ADD** to Loan model: Boolean |
| **Prepayment Penalty Flag** | ❌ Not stored | **ADD** to Loan model: Boolean |
| **Piggyback Second Flag** | ❌ Not stored | **ADD** to Loan model: Boolean |
| **Mortgage Insurance Flag** | ❌ Not stored | **ADD** to Loan model: Boolean |
| **MCR Report Engine** | ❌ Does not exist. | **CREATE** full service + controller + routes |
| **MCR Reports UI (5-tab + state sidebar)** | ❌ Does not exist. | **CREATE** new page + components |
| **Sidebar "MCR Reports" link** | ❌ Does not exist. | **ADD** to Sidebar for `lender` role |
| **In-Loan "Loan Center" tab** | ❌ Does not exist. | **CREATE** new tab component |
| **In-Loan "Audit & Dates" tab** | ❌ Does not exist. | **CREATE** new tab component |
| **In-Loan "Funding/Revenue" tab** | ❌ Does not exist. | **CREATE** new tab component |
| **In-Loan "MCR Data Audit" tab** | ❌ Does not exist. | **CREATE** new tab component |
| **Excel/XML Export** | ❌ Does not exist. | **CREATE** export service |
| **Financial Condition (Schedules A–O)** | ❌ Does not exist. | **CREATE** model + UI section |
| **MCR State Configuration** | ❌ Does not exist. | **CREATE** model for per-state MCR settings |

---

## 4. Database Schema Changes

### 4.1 NEW Model: `LoanStatusHistory` (The Snapshot Engine)

**File:** `backend/src/models/loanStatusHistory.model.js`

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  }
}, {
  timestamps: true  // createdAt = the exact moment of the status change
});

// Critical index for "time travel" queries
LoanStatusHistorySchema.index({ loan: 1, createdAt: -1 });
// Index for period-range queries
LoanStatusHistorySchema.index({ newStatus: 1, createdAt: 1 });

module.exports = mongoose.model('LoanStatusHistory', LoanStatusHistorySchema);
```

**Query Pattern — "What was Loan X's status on March 31?"**
```javascript
const statusOnDate = await LoanStatusHistory.findOne({
  loan: loanId,
  createdAt: { $lte: new Date('2026-03-31T23:59:59.999Z') }
}).sort({ createdAt: -1 });
// statusOnDate.newStatus = the status as of that date
```

### 4.2 NEW Model: `LoanCompensation` (The Revenue/Funding Tab)

**File:** `backend/src/models/loanCompensation.model.js`

This model stores all per-loan financial, classification, and audit date data that the MCR requires. It serves as the data source for the "Funding/Revenue" tab, "MCR Data Audit" tab, and "Audit & Dates" tab.

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    type: String,       // Who the loan was sold to (Fannie, Freddie, Ginnie, Private, etc.)
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

module.exports = mongoose.model('LoanCompensation', LoanCompensationSchema);
```

### 4.3 UPDATES to Existing Loan Model (`loan.model.js`)

Add the following fields to the main `loanSchema`:

```javascript
// === MCR CLASSIFICATION FIELDS ===

// Source of Business / Channel (RMLA Section II: I210–I240)
leadSource: {
  type: String,
  enum: ['Retail', 'Wholesale-Brokered', 'Correspondent', 'Table-Funded', 'Other'],
  default: 'Retail'
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

// Exclude from MCR — per ARIVE screenshot, allows excluding specific loans
excludeFromMCR: {
  type: Boolean,
  default: false
},

// Property State — CRITICAL for state-based reporting
// (may already exist in property.address.state — verify and ensure indexed)
// If not: add property.state as a standalone indexed field
```

### 4.4 UPDATES to Loan Status Enum

Add `Closed-Incomplete`:

```javascript
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
    'Withdrawn',
    'Closed-Incomplete'  // NEW — for MCR AC060
  ],
  default: 'Application Started'
}
```

### 4.5 UPDATE to Loan Details `loanType` Enum

```javascript
loanType: {
  type: String,
  enum: ['Purchase', 'Refinance', 'Cash-Out Refinance', 'Construction', 
         'Home Improvement', 'HELOC', 'Reverse Mortgage'],
  required: true
}
```

### 4.6 NEW Model: `MCRReport` (Saved Report Snapshots)

**File:** `backend/src/models/mcrReport.model.js`

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MCRReportSchema = new Schema({
  // --- Report Identity ---
  lender: {
    type: Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
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
```

### 4.7 NEW Model: `MCRStateConfig` (Per-State MCR Settings)

**File:** `backend/src/models/mcrStateConfig.model.js`

Per the ARIVE screenshots, each state has a gear icon for configuration. This model stores per-state MCR settings.

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MCRStateConfigSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  stateCode: {
    type: String,       // 'CA', 'TX', 'FL', etc.
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  // --- State-Specific Settings ---
  isActive: {
    type: Boolean,      // Whether this state is active for MCR reporting
    default: true
  },
  nmlsLicenseNumber: {
    type: String,       // State-specific NMLS license #
    default: null
  },
  // Supplemental State-Specific Form fields (SF010–SF1100)
  requiresSupplementalForm: {
    type: Boolean,
    default: false
  },
  supplementalFormData: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

MCRStateConfigSchema.index({ company: 1, stateCode: 1 }, { unique: true });

module.exports = mongoose.model('MCRStateConfig', MCRStateConfigSchema);
```

### 4.8 NEW Model: `FinancialCondition` (FC Schedules — Company Level)

**File:** `backend/src/models/financialCondition.model.js`

The Financial Condition section (Schedules A, B, C, CF, D, O) is a **company-level quarterly submission**. Unlike the loan-level data, this is entered manually by finance/accounting staff.

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FinancialConditionSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  year: { type: Number, required: true },
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },

  // --- Schedule A: Assets ---
  scheduleA: {
    // A010: Cash and Cash Equivalents
    cashAndEquivalents: { type: Number, default: 0 },
    // A020: Accounts Receivable
    accountsReceivable: { type: Number, default: 0 },
    // A030: Mortgage-Backed Securities (sub-schedule A030)
    mortgageSecurities: {
      heldToMaturity: { type: Number, default: 0 },
      availableForSale: { type: Number, default: 0 },
      tradingSecurities: { type: Number, default: 0 },
      total: { type: Number, default: 0 }             // CALCULATED
    },
    // A060: Mortgage Loans (sub-schedule A060)
    mortgageLoans: {
      hfsAtCost: { type: Number, default: 0 },        // A060-010
      hfsAtFairValue: { type: Number, default: 0 },    // A062T
      hfiAtCost: { type: Number, default: 0 },         // A060-060
      hfiAtFairValue: { type: Number, default: 0 },    // A066T
      allowanceForLoanLoss: { type: Number, default: 0 }, // A068
      total: { type: Number, default: 0 }              // CALCULATED
    },
    // A090: Other Real Estate Owned (OREO)
    otherRealEstateOwned: { type: Number, default: 0 },
    // A120-A160: Mortgage Servicing Rights
    msrAmortized: { type: Number, default: 0 },        // A120: MSR at Amortized Cost
    msrFairValue: { type: Number, default: 0 },        // A130: MSR at Fair Value
    totalMSR: { type: Number, default: 0 },            // A160: CALCULATED
    // A220: Derivatives (Assets)
    derivativeAssets: { type: Number, default: 0 },
    // A230: Other Assets
    otherAssets: { type: Number, default: 0 },
    // A280: Investments in Unconsolidated Subsidiaries
    investmentsInSubs: { type: Number, default: 0 },
    // A290: Total Assets — CALCULATED
    totalAssets: { type: Number, default: 0 }
  },

  // --- Schedule B: Liabilities & Equity ---
  scheduleB: {
    // Short-Term Liabilities
    warehouseLines: { type: Number, default: 0 },       // B010
    otherShortTermDebt: { type: Number, default: 0 },   // B015
    accountsPayable: { type: Number, default: 0 },      // B016
    totalShortTermLiabilities: { type: Number, default: 0 }, // B217
    // Long-Term Liabilities
    notesPayable: { type: Number, default: 0 },          // B020
    capitalLeases: { type: Number, default: 0 },         // B030
    deferredRevenue: { type: Number, default: 0 },       // B050
    guarantyLiabilities: { type: Number, default: 0 },   // B160
    derivativeLiabilities: { type: Number, default: 0 }, // B180
    taxesPayable: { type: Number, default: 0 },          // B190
    deferredTaxLiability: { type: Number, default: 0 },  // B200
    repurchaseReserves: { type: Number, default: 0 },    // B210
    totalLongTermLiabilities: { type: Number, default: 0 }, // B219
    totalLiabilities: { type: Number, default: 0 },      // B220
    // Equity (Corporations)
    preferredStock: { type: Number, default: 0 },         // B250
    commonStock: { type: Number, default: 0 },            // B260
    additionalPaidInCapital: { type: Number, default: 0 },// B270
    retainedEarnings: { type: Number, default: 0 },       // B280
    treasuryStock: { type: Number, default: 0 },          // B290
    otherComprehensiveIncome: { type: Number, default: 0 },// B300
    noncontrollingInterest: { type: Number, default: 0 }, // B310
    subordinatedDebt: { type: Number, default: 0 },       // B240
    totalEquity: { type: Number, default: 0 },            // B350
    totalLiabilitiesAndEquity: { type: Number, default: 0 } // B360
  },

  // --- Schedule B-350R: Equity Rollforward ---
  equityRollforward: {
    beginningBalance: { type: Number, default: 0 },       // B350A
    netIncome: { type: Number, default: 0 },              // B350B
    newStockIssuance: { type: Number, default: 0 },       // B350C
    stockRepurchases: { type: Number, default: 0 },       // B350D
    otherCapitalContributions: { type: Number, default: 0 },// B350E
    ociUnrealizedGainsAFS: { type: Number, default: 0 },  // B350F
    ociUnrealizedGainsDerivatives: { type: Number, default: 0 }, // B350G
    ociOther: { type: Number, default: 0 },               // B350H
    dividendsDistributions: { type: Number, default: 0 }, // B350L
    equityAdjustments: { type: Number, default: 0 },      // B350N
    endingBalance: { type: Number, default: 0 }           // B350T CALCULATED
  },

  // --- Schedule C: Income ---
  scheduleC: {
    // Interest Income
    interestOnLoansHFS: { type: Number, default: 0 },     // C010
    interestOnLoansHFI: { type: Number, default: 0 },     // C020
    interestOnSecuritiesHTM: { type: Number, default: 0 },// C030
    interestOnSecuritiesAFS: { type: Number, default: 0 },// C040
    interestOnTradingSecurities: { type: Number, default: 0 },// C050
    otherInterestIncome: { type: Number, default: 0 },    // C060
    yieldAdjustment: { type: Number, default: 0 },        // C070
    servicingRelatedInterest: { type: Number, default: 0 },// C080
    totalInterestIncome: { type: Number, default: 0 },    // C090 CALCULATED
    // Origination-Related Non-Interest Income
    discountsOnFVofLHS: { type: Number, default: 0 },     // C200
    originationFees: { type: Number, default: 0 },        // C210
    feesFromCorrespondents: { type: Number, default: 0 }, // C220
    brokerFeesBrokeredOut: { type: Number, default: 0 },  // C230
    otherOriginationIncome: { type: Number, default: 0 }, // C240
    amountsReclassified: { type: Number, default: 0 },    // C250
    totalOriginationIncome: { type: Number, default: 0 }, // C260 CALCULATED
    // Secondary Marketing Gains/(Losses)
    gainOnLoansSoldServicingRetained: { type: Number, default: 0 },   // C300
    capitalizedServicing: { type: Number, default: 0 },                // C310
    gainOnLoansSoldServicingReleased: { type: Number, default: 0 },   // C320
    servicingReleasedPremiums: { type: Number, default: 0 },          // C330
    feesPaidToBrokers: { type: Number, default: 0 },                  // C340
    directFeesReclassified: { type: Number, default: 0 },             // C350
    directExpensesReclassified: { type: Number, default: 0 },         // C360
    recognitionOfRetainedInterests: { type: Number, default: 0 },     // C370
    pairOffExpenses: { type: Number, default: 0 },                    // C380
    provisionForRepurchaseReserve: { type: Number, default: 0 },      // C390
    locomAdjustments: { type: Number, default: 0 },                   // C400
    irlcIncome: { type: Number, default: 0 },                         // C410
    gainsOnDerivativesHedging: { type: Number, default: 0 },          // C420
    gainOnFVChangesLHS: { type: Number, default: 0 },                 // C430
    otherSecondaryMarketGains: { type: Number, default: 0 },          // C440
    netSecondaryMarketingIncome: { type: Number, default: 0 },        // C450 CALCULATED
    // Servicing-Related Non-Interest Income
    servicingFeesFirstMortgages: { type: Number, default: 0 },        // C500
    servicingFeesOtherMortgages: { type: Number, default: 0 },        // C510
    subservicingFees: { type: Number, default: 0 },                   // C520
    lateFees: { type: Number, default: 0 },                           // C540
    amortizationOfMSRs: { type: Number, default: 0 },                 // C550
    changesMSRValuationAllowance: { type: Number, default: 0 },       // C570
    totalServicingIncome: { type: Number, default: 0 },               // C650 CALCULATED
    // Other Non-Interest Income
    gainFromSaleOfSecurities: { type: Number, default: 0 },           // C720
    otherNonInterestIncome: { type: Number, default: 0 },             // C770
    totalOtherNonInterestIncome: { type: Number, default: 0 },        // C780 CALCULATED
    totalGrossIncome: { type: Number, default: 0 },                   // C800 CALCULATED
    // Interest Expense
    warehousingInterestExpense: { type: Number, default: 0 },         // C100
    otherInterestExpense: { type: Number, default: 0 },               // C150
    totalInterestExpense: { type: Number, default: 0 }                // C160 CALCULATED
  },

  // --- Schedule CF: Cash Flow ---
  scheduleCF: {
    netCashFromOperating: { type: Number, default: 0 },    // CF010
    cashFromInvesting: { type: Number, default: 0 },       // CF020
    cashFromFinancing: { type: Number, default: 0 },       // CF030
    totalCashChange: { type: Number, default: 0 }          // CF040 CALCULATED
  },

  // --- Schedule D: Non-Interest Expense ---
  scheduleD: {
    // Personnel Compensation
    loanProductionOfficers: { type: Number, default: 0 },    // D010
    loanOrigination: { type: Number, default: 0 },           // D020
    warehousingSecondaryMktg: { type: Number, default: 0 },  // D030
    postCloseSupport: { type: Number, default: 0 },          // D040
    originationManagement: { type: Number, default: 0 },     // D050
    totalOriginationComp: { type: Number, default: 0 },      // D070 CALCULATED
    servicingManagement: { type: Number, default: 0 },       // D080
    otherServicingPersonnel: { type: Number, default: 0 },   // D090
    totalServicingComp: { type: Number, default: 0 },        // D100 CALCULATED
    // Other Expenses
    occupancyAndEquipment: { type: Number, default: 0 },     // D200
    technologyExpenses: { type: Number, default: 0 },        // D210
    outsourcingFees: { type: Number, default: 0 },           // D220
    professionalFees: { type: Number, default: 0 },          // D230
    allOtherExpenses: { type: Number, default: 0 },          // D280
    // Corporate Administration
    corporateManagement: { type: Number, default: 0 },       // D400
    corporateTech: { type: Number, default: 0 },             // D410
    otherCorporateExpenses: { type: Number, default: 0 },    // D430
    totalCorporateAdmin: { type: Number, default: 0 },       // D440 CALCULATED
    totalGrossExpenses: { type: Number, default: 0 },        // D310 CALCULATED
    preTaxNetOperatingIncome: { type: Number, default: 0 },  // D510 CALCULATED
    incomeTaxes: { type: Number, default: 0 },               // D520
    netIncome: { type: Number, default: 0 }                  // D600 CALCULATED
  },

  // --- Schedule O: Reserves ---
  scheduleO: {
    // Credit Loss Reserves
    creditLossBeginning: { type: Number, default: 0 },        // O010
    provisionForCreditLosses: { type: Number, default: 0 },   // O020
    chargeOffsNet: { type: Number, default: 0 },              // O030
    creditLossEnding: { type: Number, default: 0 },           // O060 CALCULATED
    // REO Valuation
    reoBeginning: { type: Number, default: 0 },               // O110
    reoChanges: { type: Number, default: 0 },                 // O120
    reoEnding: { type: Number, default: 0 },                  // O130 CALCULATED
    // Repurchase Reserves
    repurchaseBeginning: { type: Number, default: 0 },        // O310
    provisionForRepurchases: { type: Number, default: 0 },    // O320
    repurchaseChargeOffs: { type: Number, default: 0 },       // O330
    repurchaseEnding: { type: Number, default: 0 },           // O350 CALCULATED
    upbRepurchased: { type: Number, default: 0 },             // O360: Memo
    loansRepurchased: { type: Number, default: 0 }            // O370: Memo
  },

  // --- Explanatory Notes ---
  explanatoryNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

FinancialConditionSchema.index({ company: 1, year: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('FinancialCondition', FinancialConditionSchema);
```

---

## 5. Backend Implementation Plan

### 5.1 Status History Hook (Critical — Must Be Done First)

Every place in the codebase that changes `loan.status` must also write a `LoanStatusHistory` record. There are **2 functions** in `loan.controller.js` that update status:

1. **`updateLoanStatus` (line ~1305)** — Called from the lender dashboard
2. **`updateLoanStatus` (line ~2996)** — Called from borrower-facing changes

**Additionally**, add a Mongoose middleware on the Loan model:

```javascript
// In loan.model.js — pre-save hook
loanSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const LoanStatusHistory = mongoose.model('LoanStatusHistory');
    await LoanStatusHistory.create({
      loan: this._id,
      previousStatus: this._original_status || null,
      newStatus: this.status,
      changedBy: this._changedBy || null
    });
  }
  next();
});

loanSchema.post('init', function(doc) {
  doc._original_status = doc.status;
});
```

**Auto-populate audit dates on status change:**

```javascript
// Inside the pre-save hook or in the controller
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
if (dateMap[this.status]) {
  await LoanCompensation.findOneAndUpdate(
    { loan: this._id },
    { $setOnInsert: { loan: this._id }, [dateMap[this.status]]: new Date() },
    { upsert: true, new: true }
  );
}
```

**Migration Script**: Backfill `LoanStatusHistory` from existing loans (one entry per loan using current status + `createdAt`).

### 5.2 LoanCompensation Auto-Creation

Auto-create a `LoanCompensation` record when a loan is first created (all defaults). This ensures every loan always has compensation data:

```javascript
// Post-save hook on Loan model for new loans
loanSchema.post('save', async function(doc, next) {
  if (doc.wasNew) {
    await LoanCompensation.findOneAndUpdate(
      { loan: doc._id },
      { $setOnInsert: { loan: doc._id } },
      { upsert: true }
    );
  }
  next();
});
```

### 5.3 New API Routes

**File:** `backend/src/routes/mcr.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/mcr/generate` | Generate MCR for `{ year, period, states[], reportType }` |
| `GET` | `/api/v1/mcr/reports` | List all saved MCR reports (Generated Reports table) |
| `GET` | `/api/v1/mcr/reports/:id` | Get a specific saved report |
| `PUT` | `/api/v1/mcr/reports/:id` | Update report status (draft → final → submitted) |
| `DELETE` | `/api/v1/mcr/reports/:id` | Delete a draft report |
| `GET` | `/api/v1/mcr/reports/:id/export` | Export report as Excel or XML (`?format=excel|xml&state=all|CA`) |

**File:** `backend/src/routes/loanCompensation.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/loans/:loanId/compensation` | Get compensation data for a loan |
| `PUT` | `/api/v1/loans/:loanId/compensation` | Create/Update compensation data |

**File:** `backend/src/routes/mcrStateConfig.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/mcr/states` | List all state configs for the company |
| `PUT` | `/api/v1/mcr/states/:stateCode` | Update state-specific MCR settings |

**File:** `backend/src/routes/financialCondition.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/mcr/financial-condition/:year/:quarter` | Get FC data for period |
| `PUT` | `/api/v1/mcr/financial-condition/:year/:quarter` | Save/update FC data |

### 5.4 New Controllers

- **`backend/src/controllers/mcr.controller.js`** — Report generation, retrieval, export
- **`backend/src/controllers/loanCompensation.controller.js`** — CRUD for compensation data
- **`backend/src/controllers/mcrStateConfig.controller.js`** — State config CRUD
- **`backend/src/controllers/financialCondition.controller.js`** — FC schedule data entry

### 5.5 MCR Service (The Calculation Engine)

**File:** `backend/src/services/mcr.service.js`

Core logic file. Contains all query and calculation functions detailed in [Section 9](#9-mcr-report-calculation-engine).

### 5.6 Register Routes in `app.js`

```javascript
const mcrRoutes = require('./routes/mcr.routes');
const loanCompensationRoutes = require('./routes/loanCompensation.routes');
const mcrStateConfigRoutes = require('./routes/mcrStateConfig.routes');
const financialConditionRoutes = require('./routes/financialCondition.routes');

app.use('/api/v1/mcr', mcrRoutes);
app.use('/api/v1/mcr', mcrStateConfigRoutes);
app.use('/api/v1/mcr', financialConditionRoutes);
// loanCompensation routes nested under loans via loan routes
```

---

## 6. Frontend Implementation Plan

### 6.1 Sidebar — Add "MCR Reports" Link

**File:** `frontend/src/components/layout/Sidebar.js`

Add to the `lender` nav items:
```javascript
{ name: 'MCR Reports', href: '/lender/mcr-reports', icon: FileBarChart }
```
Also add to `company` nav items.

### 6.2 MCR Reports Main Page (2-Step Flow)

**File:** `frontend/src/pages/lender/mcr-reports.js`

This page implements the 2-step generation workflow observed in ARIVE screenshots:

**Step 1: Select Specifications**
- **Year dropdown** — Current year and previous years
- **Quarter dropdown** — Q1 / Q2 / Q3 / Q4
- **"Generate as LO" toggle** — When ON, generates as individual LO report; when OFF, generates as Company
- **State selection** — Checkboxes for each state where the company is licensed, with a gear icon (⚙️) next to each state for per-state MCR configuration
- **"Continue" button** → proceeds to Step 2

**Step 2: Analyze and Export**
- **Left sidebar: States** — List of selected states; clicking a state filters the report data to that state
- **Horizontal tabs:** Application Data | Closed Loan Data | Revenue Data | MLO Data | RMLA Section II
- **Tab content:** Grid/table with the report data for the selected state
- **"Export" button** → Opens Export Modal
- **"Help" button** → Opens field definitions tooltip/modal

**Below the 2-step flow:**
- **Generated Reports table** — Shows history of previously generated reports with columns:
  - File Name
  - Quarter
  - Year
  - States
  - Type (LO / Company)
  - Generated Date
  - Generated By
  - Actions (View, Export, Delete)

### 6.3 Export Modal

**Component:** `frontend/src/components/mcr/MCRExportModal.js`

Per ARIVE screenshot:
- **Report Format:** Radio buttons — `Excel` | `XML`
- **State:** Dropdown — `All` | individual states
- **"Save As Generated Report" checkbox** — If checked, saves the export to the Generated Reports table
- **Cancel / Export buttons**

### 6.4 MCR Report Viewer — Tab Components

Each tab is a data grid with the official NMLS row structure.

**Application Data tab (Tab 1):**
- Rows: AC010 through AC090
- Columns: Brokered (Amount / Count / Average), Closed-Retail (Amount / Count / Average), Closed-Wholesale (Amount / Count / Average)
- Per NMLS definitions, the three-column structure reflects origination channel

**Closed Loan Data tab (Tab 2):**
- Rows: AC100 through AC990 (loan type, property type, purpose, HOEPA, lien, fees, QM status)
- Same three-column structure
- Subtotals at AC190, AC290, AC390, AC590, AC990

**Revenue Data tab (Tab 3):**
- Rows: AC1010 through AC1290
- Revenue fields: origination fees, SRP, YSP, discount points, lender fees, broker fees
- Servicing disposition rows (AC1200–AC1290)

**MLO Data tab (Tab 4):**
- Dynamic rows — one per Loan Officer
- Columns: MLO Name, NMLS ID, Loan Count, Total Amount, Average Amount

**RMLA Section II tab (Tab 5):**
- Rows: I010 through I460
- Product type breakdown (Gov/Conv/Jumbo × Fixed/ARM)
- Channel breakdown (Brokered/Closed-Retail/Closed-Correspondent)
- Risk characteristics (Alt Doc, I/O, Option ARM, Prepayment Penalty)
- Purpose breakdown (Purchase/Refi)
- LTV distribution buckets
- Weighted averages (LTV, coupon rate, warehouse period)
- Pull-Through Ratio

### 6.5 New Frontend Services

**File:** `frontend/src/services/mcr.service.js`

```javascript
class MCRService {
  generateReport(year, period, states, reportType) { /* POST /api/v1/mcr/generate */ }
  getReports() { /* GET /api/v1/mcr/reports */ }
  getReport(id) { /* GET /api/v1/mcr/reports/:id */ }
  updateReportStatus(id, status) { /* PUT /api/v1/mcr/reports/:id */ }
  deleteReport(id) { /* DELETE /api/v1/mcr/reports/:id */ }
  exportReport(id, format, state) { /* GET /api/v1/mcr/reports/:id/export */ }
  getStates() { /* GET /api/v1/mcr/states */ }
  updateStateConfig(stateCode, data) { /* PUT /api/v1/mcr/states/:stateCode */ }
}
```

**File:** `frontend/src/services/loanCompensation.service.js`

```javascript
class LoanCompensationService {
  getCompensation(loanId) { /* GET /api/v1/loans/:loanId/compensation */ }
  updateCompensation(loanId, data) { /* PUT /api/v1/loans/:loanId/compensation */ }
}
```

**File:** `frontend/src/services/financialCondition.service.js`

```javascript
class FinancialConditionService {
  getFC(year, quarter) { /* GET /api/v1/mcr/financial-condition/:year/:quarter */ }
  saveFC(year, quarter, data) { /* PUT /api/v1/mcr/financial-condition/:year/:quarter */ }
}
```

---

## 7. In-Loan MCR Tabs

Per the client's instructions: *"Make sure when you do the MCR these tabs are built in: Loan Center (similar to ARIVE but call it something else), Audit and Dates – the MCR will need this"*

These tabs are added to the in-loan view (`frontend/src/pages/lender/loans/[id].js`) as new main tabs alongside existing Dashboard, Documents, Milestones, Application tabs.

### 7.1 Loan Center Tab (rename from ARIVE's "Loan Center")

**Proposed name:** "Loan Hub" or "Loan Overview" (avoid using ARIVE's exact name)

**File:** `frontend/src/components/lender/loans/LoanCenterTab.js`

**Purpose:** Consolidated loan processing hub — a single-pane view of all critical data and actions.

**Layout (sections):**

| Section | Content |
|---------|---------|
| **Status Tracker** | Visual pipeline showing current status with progress bar. Click to update status. |
| **Quick Facts** | Key loan details at a glance: Loan Amount, Rate, Program, Property Address, Borrower Name, LO Name |
| **Key Dates** | Application date, Lock date, CTC date, Closing date, Funded date — pulled from LoanCompensation audit dates |
| **Action Buttons** | Quick actions: Update Status, Add Note, Upload Document, Request Conditions, Send Message |
| **Recent Activity** | Last 5 activities/notes on this loan |
| **Condition Summary** | Outstanding conditions count — approved / pending / denied |
| **Document Checklist** | Quick view of required vs received documents |

### 7.2 Audit & Dates Tab

**File:** `frontend/src/components/lender/loans/AuditDatesTab.js`

**Purpose:** All critical audit dates and timestamps the MCR needs. This is the **single source of truth** for date-sensitive MCR calculations.

**Layout (two sections):**

**Section 1: Audit Dates (editable date pickers)**

| Field | Source | Notes |
|-------|--------|-------|
| Application Date | `LoanCompensation.applicationDate` | Auto-set when status → "Application Submitted" |
| Approval Date | `LoanCompensation.approvalDate` | Auto-set when status → "Conditional Approval" |
| Clear to Close Date | `LoanCompensation.clearToCloseDate` | Auto-set when status → "Clear to Close" |
| Closing Date | `LoanCompensation.closingDate` | Auto-set when status → "Closed" |
| Funded Date | `LoanCompensation.fundedDate` | Auto-set when status → "Funded" |
| Disbursement Date | `LoanCompensation.disbursementDate` | Manual entry |
| Denial Date | `LoanCompensation.denialDate` | Auto-set when status → "Declined" |
| Withdrawn Date | `LoanCompensation.withdrawnDate` | Auto-set when status → "Withdrawn" |
| Closed Incomplete Date | `LoanCompensation.closedIncompleteDate` | Auto-set when status → "Closed-Incomplete" |
| Note Date | `LoanCompensation.noteDate` | Manual entry |
| Recording Date | `LoanCompensation.recordingDate` | Manual entry |
| First Payment Date | `LoanCompensation.firstPaymentDate` | Manual entry |

**Section 2: Rate/Lock Dates**

| Field | Source |
|-------|--------|
| Rate Lock Date | `LoanCompensation.rateLockDate` |
| Rate Lock Expiry | `LoanCompensation.rateLockExpiry` |
| Rate Lock Period (days) | `LoanCompensation.rateLockPeriod` |

**Section 3: Status History (read-only table)**

| Column | Source |
|--------|--------|
| Date/Time | `LoanStatusHistory.createdAt` |
| Previous Status | `LoanStatusHistory.previousStatus` |
| New Status | `LoanStatusHistory.newStatus` |
| Changed By | `LoanStatusHistory.changedBy` (populated with user name) |
| Reason | `LoanStatusHistory.changeReason` |

All dates auto-save on change (debounced PUT to `/api/v1/loans/:loanId/compensation`).

### 7.3 Funding / Revenue Tab

**File:** `frontend/src/components/lender/loans/FundingRevenueTab.js`

**Purpose:** Per-loan financial data required for MCR Tab 3 (Revenue Data) and Tab 2 (Closed Loan Data fees).

**Layout (three sections):**

**Section 1: Revenue Info**

| Field | Input Type | LoanCompensation Field |
|-------|-----------|----------------------|
| Broker Compensation | Currency `$` | `brokerCompensation` |
| Paid By | Dropdown: Borrower/Lender/Split/N/A | `brokerCompPaidBy` |
| Origination Fee | Currency `$` | `originationFee` |
| Processing Fee | Currency `$` | `processingFee` |
| Pass Through Fees | Currency `$` | `passThruFees` |
| Tolerance Cure | Currency `$` | `toleranceCure` |
| Broker Flat Fees | Currency `$` | `brokerFlatFees` |
| Loan Revenue | Currency `$` (calculated or manual) | `loanRevenue` |
| SRP Amount | Currency `$` | `srpAmount` |
| YSP / Premium | Currency `$` | `yspAmount` |
| Discount Points | Currency `$` | `discountPoints` |
| Lender Fees Collected | Currency `$` | `lenderFeesCollected` |

**Section 2: Product Info**

| Field | Input Type | Source |
|-------|-----------|--------|
| Program | Read-only (from loan) | `loan.loanParameters.selectedProgramId.name` |
| Final Rate | Number `%` | `LoanCompensation.finalRate` |
| Discount Points | Currency `$` | `LoanCompensation.discountPoints` |
| Rate Lock Period | Number (days) | `LoanCompensation.rateLockPeriod` |
| Rate Expiry | Date | `LoanCompensation.rateLockExpiry` |

**Section 3: Loan Info**

| Field | Input Type | Source |
|-------|-----------|--------|
| Loan Amount | Read-only | `loan.loanDetails.loanAmount` |
| Loan Purpose | Read-only | `loan.loanDetails.loanType` |
| Cash-Out Amount | Currency `$` | `LoanCompensation.cashOutAmount` |
| Occupancy | Read-only | `loan.property.occupancyType` |
| Property Type | Read-only | `loan.property.propertyType` |
| Lien Position | Dropdown | `LoanCompensation.lienPosition` |
| Investor Sold To | Dropdown | `LoanCompensation.investorSoldTo` |
| Servicing Disposition | Dropdown | `LoanCompensation.servicingDisposition` |

**Auto-save** on blur (debounced).

### 7.4 MCR Data Audit Tab

**File:** `frontend/src/components/lender/loans/MCRDataAuditTab.js`

**Purpose:** Read-only audit view showing all MCR-relevant data for this loan, plus the "Exclude from MCR" toggle. This is a data review screen, not an edit screen.

**Layout:**

**Header:**
- **"Exclude from MCR" toggle** — Blue toggle switch. When ON, this loan is excluded from all MCR report calculations. Maps to `loan.excludeFromMCR`.

**Three read-only cards:**

**Card 1: Revenue Info** (pulled from LoanCompensation)
- Broker Compensation, Paid By, Pass Through Fees, Tolerance Cure, Broker Flat Fees, Loan Revenue

**Card 2: Product Info** (pulled from Loan + LoanCompensation)
- Program, Final Rate, Discount Points, Rate Lock Period, Rate Expiry

**Card 3: Loan Info** (pulled from Loan + LoanCompensation)
- Loan Amount, Loan Purpose, Cash-Out Amount, Occupancy, Property Type, Lien Position

Each card has an "Edit" link that navigates to the Funding/Revenue tab for editing.

**Card 4: MCR Classification** (pulled from Loan)
- QM Status, Channel/Lead Source, Doc Type, Interest Only, HOEPA Flag, Reverse Mortgage, Prepayment Penalty, Piggyback Second, Mortgage Insurance

### 7.5 Tab Registration in In-Loan View

Update `frontend/src/pages/lender/loans/[id].js` to add new main tabs:

```javascript
// Current:
// mainTabs: ['dashboard', 'documents', 'milestones', 'application']

// Updated:
mainTabs: [
  'dashboard',
  'loan-hub',        // NEW — Loan Center (renamed "Loan Hub")
  'documents',
  'milestones',
  'application',
  'funding-revenue', // NEW — Funding / Revenue
  'audit-dates',     // NEW — Audit & Dates
  'mcr-audit'        // NEW — MCR Data Audit
]
```

---

## 8. MCR Report Generation Workflow (2-Step Flow)

### 8.1 Step 1: Select Specifications

**API Call:** None yet — this is a frontend-only step.

**User Flow:**
1. Navigate to MCR Reports page
2. Select **Year** from dropdown (current year + previous 5 years)
3. Select **Quarter** from dropdown (Q1 / Q2 / Q3 / Q4)
4. Toggle **"Generate as LO"** (OFF = Company report, ON = LO report)
   - When ON, a secondary dropdown appears to select which LO
5. Select **States** via checkboxes
   - States are auto-populated from the company's loan portfolio (distinct property states)
   - Each state has a ⚙️ gear icon to open per-state MCR settings modal (`MCRStateConfig`)
6. Click **"Continue"**

**State Detection:**
```javascript
// Backend: GET /api/v1/mcr/available-states
const states = await Loan.distinct('property.state', { 
  lender: { $in: companyLenderIds },
  excludeFromMCR: { $ne: true }
});
// Returns: ['CA', 'TX', 'FL', ...]
```

### 8.2 Step 2: Analyze and Export

**API Call:** `POST /api/v1/mcr/generate`

**Request body:**
```json
{
  "year": 2026,
  "period": "Q1",
  "states": ["CA", "TX"],
  "reportType": "Company",
  "loanOfficerId": null,
  "saveAsGenerated": true
}
```

**Backend processing:**
1. Calculate `startDate` and `endDate` from year + quarter
2. Query all loans matching:
   - Company/lender ownership
   - `property.state` IN selected states
   - `excludeFromMCR !== true`
   - (If LO report) `assignedLoanOfficer === loanOfficerId`
3. Run the MCR Calculation Engine (Section 9) to compute all 5 tabs
4. Run per-state breakdown (generate separate results for each selected state)
5. Save frozen snapshot to `MCRReport` collection
6. Return results + report ID

**Response:**
```json
{
  "reportId": "abc123",
  "fileName": "MCR_Q1_2026_CA_TX_Company",
  "aggregatedData": { /* All 5 tabs combined */ },
  "perStateData": {
    "CA": { /* Tab 1-5 for CA only */ },
    "TX": { /* Tab 1-5 for TX only */ }
  },
  "validationErrors": [],
  "summary": {
    "totalLoansIncluded": 150,
    "totalLoansExcluded": 3
  }
}
```

### 8.3 Generated Reports Table

The "Generated Reports" section at the bottom of the MCR Reports page shows all previously saved reports.

**Columns:**

| Column | Source |
|--------|--------|
| File Name | `MCRReport.fileName` (auto-generated: `MCR_{Period}_{Year}_{States}_{Type}`) |
| Quarter | `MCRReport.period` |
| Year | `MCRReport.year` |
| States | `MCRReport.states.join(', ')` |
| Type | `MCRReport.reportType` (LO / Company) |
| Generated | `MCRReport.createdAt` |
| Generated By | `MCRReport.generatedBy.firstName + lastName` |
| Actions | View (→ viewer), Export, Delete |

---

## 9. MCR Report Calculation Engine

**File:** `backend/src/services/mcr.service.js`

### 9.1 Helper: Get Loan Status as of a Date

```javascript
async function getLoanStatusAsOfDate(loanId, asOfDate) {
  const entry = await LoanStatusHistory.findOne({
    loan: loanId,
    createdAt: { $lte: asOfDate }
  }).sort({ createdAt: -1 });
  return entry ? entry.newStatus : null;
}
```

### 9.2 Helper: Batch Query — All Loans with Status as of Date

```javascript
async function getLoansWithStatusAsOfDate(filter, asOfDate) {
  const loans = await Loan.find(filter).select('_id createdAt');
  const pipeline = [
    { $match: { loan: { $in: loans.map(l => l._id) }, createdAt: { $lte: asOfDate } } },
    { $sort: { loan: 1, createdAt: -1 } },
    { $group: { _id: '$loan', latestStatus: { $first: '$newStatus' }, changedAt: { $first: '$createdAt' } } }
  ];
  return await LoanStatusHistory.aggregate(pipeline);
}
```

### 9.3 Core Filter: Exclude MCR-Excluded Loans

All queries must include:
```javascript
const baseFilter = {
  ...lenderOrCompanyFilter,
  excludeFromMCR: { $ne: true },
  'property.state': { $in: selectedStates }
};
```

### 9.4 Tab 1: Application Data (AC010–AC090)

For a report period `[startDate, endDate]`:

| Row | ID | Logic |
|-----|----|-------|
| **Beginning Pipeline** | AC010 | Loans created before `startDate` whose status as of `startDate - 1ms` was active (NOT Funded, Declined, Withdrawn, Closed-Incomplete) |
| **Apps Received** | AC020 | Loans where `createdAt` is within `[startDate, endDate]` |
| **Approved Not Accepted** | AC030 | Loans that reached `Conditional Approval` during the period but did NOT reach `Funded`/`Closed` by `endDate` |
| **Apps Denied** | AC040 | Loans with status changed to `Declined` during period |
| **Apps Withdrawn** | AC050 | Loans with status changed to `Withdrawn` during period |
| **Closed Incomplete** | AC060 | Loans with status changed to `Closed-Incomplete` during period |
| **Net Amount Change** | AC065 | `SUM(loanDetails.loanAmount - loanDetails.requestedLoanAmount)` for active loans (per NMLS: changes in $ amounts of apps in pipeline) |
| **Net Count Change** | AC063 | Default `0` (no split/merge loan feature) |
| **Total Pipeline** | AC066 | `AC010 + AC020 - (AC030 + AC040 + AC050 + AC060) ± AC065 ± AC063` |
| **Closed & Funded** | AC070 | Loans where `compensation.fundedDate` in `[startDate, endDate]` — THIS IS THE KEY ROW |
| **Ending Pipeline** | AC080 | Loans created ≤ `endDate` whose status as of `endDate (23:59:59)` is active |
| **Total Results** | AC090 | `AC070 + AC080` — must equal AC066 |

**Three-column structure per NMLS definitions:**

| Column | Condition |
|--------|-----------|
| **Brokered** | `loan.leadSource === 'Wholesale-Brokered'` or brokered-out loans |
| **Closed-Retail** | `loan.leadSource === 'Retail'` |
| **Closed-All Other** | Correspondent, Table-Funded, Other |

**For each row × column, compute:**
- **Amount ($):** `SUM(loanDetails.loanAmount)`
- **Count (#):** `COUNT(distinct loans)`
- **Average ($):** `Amount / Count` (Count > 0 ? : 0)

### 9.5 Tab 2: Closed Loan Data (AC100–AC990)

Scope: Only loans from **AC070** (funded during the period).

**Loan Type Breakdown (AC100–AC190):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC100 | Conventional | `program.programType === 'conventional'` |
| AC110 | FHA-Insured | `program.programType === 'fha'` |
| AC120 | VA-Guaranteed | `program.programType === 'va'` |
| AC130 | FSA/RHS (USDA) | `program.programType === 'usda'` |
| AC140 | Farm Service Agency | (subset of USDA — if tracked separately) |
| AC190 | **Total by Loan Type** | `SUM(AC100:AC140)` |

**Property Type Breakdown (AC200–AC290):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC200 | 1-4 Family | `propertyType` IN (Single Family, Condo, Townhouse, PUD, Co-op) |
| AC210 | Manufactured Housing | `propertyType === 'Manufactured Home'` |
| AC220 | Multifamily (5+ units) | `propertyType === 'Multi-Family'` AND units ≥ 5 |
| AC230 | Mixed-Use | (future — not currently in app) |
| AC240 | Vacant Land | (future — not currently in app) |
| AC290 | **Total by Property Type** | `SUM(AC200:AC240)` — must = AC190 |

**Purpose Breakdown (AC300–AC390):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC300 | Purchase | `loanType === 'Purchase'` |
| AC310 | Home Improvement | `loanType === 'Home Improvement'` |
| AC320 | Refinancing | `loanType` IN ('Refinance', 'Cash-Out Refinance') |
| AC390 | **Total by Purpose** | Must = AC190 |

**HOEPA (AC400):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC400 | HOEPA Loans | `loan.hoeparFlag === true` |

**Lien Status Breakdown (AC500–AC590):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC500 | First Lien | `compensation.lienPosition === '1st'` |
| AC510 | Subordinate Lien | `compensation.lienPosition === '2nd'` |
| AC520 | Not Secured by Lien | `compensation.lienPosition === 'Not Secured by Lien'` |
| AC590 | **Total by Lien** | Must = AC190 |

**Fees Collected (AC600–AC610):**

| Row ID | Field | Formula |
|--------|-------|---------|
| AC600 | Broker Fees Collected (at/before closing) | `SUM(brokerCompensation + originationFee + processingFee + brokerFlatFees)` |
| AC610 | Lender Fees Collected | `SUM(lenderFeesCollected)` |

**Reverse Mortgage Breakdown (AC700–AC890):**
Only for loans with `isReverseMortgage === true`. Mirror the same structure as AC100–AC590 but scoped to reverse mortgages. For most brokers, this will be all zeros.

| Row ID | Field |
|--------|-------|
| AC700 | Reverse: Conventional |
| AC710 | Reverse: FHA (HECM) |
| AC720 | Reverse: VA |
| AC730 | Reverse: FSA/RHS |
| AC790 | **Total Reverse by Type** |
| AC800 | Reverse: 1-4 Family |
| AC810 | Reverse: Manufactured |
| AC890 | **Total Reverse by Property** |

**QM Breakdown (AC920–AC990):**

| Row ID | Field | Query |
|--------|-------|-------|
| AC900 | Brokered Loans | All funded loans (default for brokers) |
| AC910 | Funded Loans | Loans where company is the lender |
| AC920 | Safe Harbor QM | `qmStatus === 'QM-Safe Harbor'` |
| AC930 | Rebuttable Presumption QM | `qmStatus === 'QM-Rebuttable Presumption'` |
| AC940 | Non-QM | `qmStatus === 'Non-QM'` |
| AC950 | Not Subject to QM | `qmStatus === 'Not Subject to QM'` |
| AC960 | Exempt from QM | `qmStatus === 'Exempt'` |
| AC990 | **Total QM** | Must = AC190 |

### 9.6 Tab 3: Revenue Data (AC1010–AC1290)

Scope: Funded loans in period.

| Row ID | Field | Formula |
|--------|-------|---------|
| AC1010 | Origination Fees | `SUM(originationFee + processingFee)` — Maps to C210 |
| AC1020 | SRP (Service Release Premium) | `SUM(srpAmount)` |
| AC1030 | YSP (Yield Spread Premium) | `SUM(yspAmount)` |
| AC1040 | Discount Points | `SUM(discountPoints)` |
| AC1050 | Other Origination Income | `SUM(brokerFlatFees + passThruFees)` |
| AC1100 | **Gross Revenue** | `SUM(AC1010:AC1050)` |
| AC1200 | Servicing Released | Count where `servicingDisposition === 'Released'` |
| AC1210 | Servicing Retained | Count where `servicingDisposition === 'Retained'` |
| AC1290 | **Total by Servicing** | Must = AC070 count |

### 9.7 Tab 4: MLO Data (Attribution)

Scope: Funded loans in period.

```javascript
const mloData = await Loan.aggregate([
  { $match: { _id: { $in: fundedLoanIds }, excludeFromMCR: { $ne: true } } },
  { $group: {
    _id: '$assignedLoanOfficer',
    totalAmount: { $sum: '$loanDetails.loanAmount' },
    totalCount: { $sum: 1 }
  }},
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'officer' } },
  { $unwind: '$officer' },
  { $project: {
    officerName: { $concat: ['$officer.firstName', ' ', '$officer.lastName'] },
    nmlsId: '$officer.nmlsId',  // NMLS Individual ID
    totalAmount: 1,
    totalCount: 1,
    averageAmount: { $cond: [
      { $gt: ['$totalCount', 0] },
      { $divide: ['$totalAmount', '$totalCount'] },
      0
    ]}
  }}
]);
```

**Validation:** `SUM(all MLO amounts)` must = AC070 amount. `SUM(all MLO counts)` must = AC070 count.

### 9.8 Tab 5: RMLA Section II — Risk Characteristics (I010–I460)

Scope: Funded loans in period (same as AC070).

**Product Type Breakdown (I010–I080):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I010 | Government Fixed | program IN (fha, va, usda) AND amortizationType = 'Fixed' |
| I020 | Government ARM | program IN (fha, va, usda) AND amortizationType = 'ARM' |
| I030 | Conventional/Conforming Fixed | program = conventional AND Fixed AND amount ≤ conformingLimit |
| I040 | Conventional/Conforming ARM | program = conventional AND ARM AND amount ≤ conformingLimit |
| I050 | Jumbo Fixed | (program = jumbo) OR (conventional AND Fixed AND amount > conformingLimit) |
| I060 | Jumbo ARM | (program = jumbo) OR (conventional AND ARM AND amount > conformingLimit) |
| I070 | Other Fixed | program NOT IN above AND Fixed |
| I080 | Other ARM | program NOT IN above AND ARM |
| I090 | Total Fixed (HFS) | `I010 + I030 + I050 + I070` where held for sale |
| I100 | Total ARM (HFS) | `I020 + I040 + I060 + I080` where held for sale |

**Additional Product Rows (I110–I140):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I110 | Closed-End Second Liens | `lienPosition === '2nd'` |
| I120 | HELOCs | `loanType === 'HELOC'` |
| I130 | Reverse Mortgages | `isReverseMortgage === true` |
| I140 | Construction Loans | `loanType === 'Construction'` |

**Channel Breakdown (I210–I240):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I210 | Brokered | `leadSource === 'Wholesale-Brokered'` |
| I220 | Closed-Retail | `leadSource === 'Retail'` |
| I230 | Closed-Correspondent | `leadSource === 'Correspondent'` |
| I240 | Closed-All Other | Everything else (Table-Funded, Other) |

**Rate Type Totals (I250–I269):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I250 | Total Fixed | Sum of all Fixed amortization loans |
| I259 | Total ARM | Sum of all ARM amortization loans |
| I260 | Jumbo Total | Sum of all jumbo loans |
| I269 | Non-Jumbo Total | Sum of non-jumbo loans |

**Risk Characteristics (I270–I309):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I270 | Alternative/Reduced Documentation | `docType` NOT IN ('Full Doc') |
| I280 | Interest Only | `interestOnlyFlag === true` |
| I290 | Option ARMs | `amortizationType === 'Option ARM'` |
| I300 | Prepayment Penalties | `hasPrepaymentPenalty === true` |

**Purpose Breakdown (I310–I329):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I310 | Purchase | `loanType === 'Purchase'` |
| I319 | Total Purchase | Same |
| I320 | Refinance | `loanType` IN ('Refinance', 'Cash-Out Refinance') |
| I329 | Total Refinance | Same |

**Mortgage Insurance & Piggyback (I330–I349):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I330 | With Mortgage Insurance | `hasMortgageInsurance === true` |
| I340 | Piggyback Seconds | `isPiggybackSecond === true` |

**LTV Distribution (I370–I380):**

| Row ID | Field | Logic |
|--------|-------|-------|
| I370-010 | LTV 0–60% | `ltv ≤ 60` |
| I370-020 | LTV 60.01–70% | `60 < ltv ≤ 70` |
| I370-030 | LTV 70.01–80% | `70 < ltv ≤ 80` |
| I370-040 | LTV 80.01–90% | `80 < ltv ≤ 90` |
| I370-050 | LTV 90.01–95% | `90 < ltv ≤ 95` |
| I370-060 | LTV >95% | `ltv > 95` |
| I380 | Weighted Average LTV | `SUM(loanAmount × ltv) / SUM(loanAmount)` |

**Weighted Averages & Other (I390–I460):**

| Row ID | Field | Formula |
|--------|-------|---------|
| I390 | Weighted Average Coupon Rate | `SUM(loanAmount × interestRate) / SUM(loanAmount)` |
| I400 | Loans Sold (by investor type) | Count by `investorSoldTo` |
| I410 | Table-Funded Loans | `leadSource === 'Table-Funded'` |
| I420 | Loans Brokered-Out | `leadSource === 'Wholesale-Brokered'` |
| I430 | Pull-Through Ratio | `(AC070.count / AC020.count) × 100` — % of apps that funded |
| I440 | Weighted Avg Warehouse Period (All) | `SUM(loanAmount × warehousePeriodDays) / SUM(loanAmount)` |
| I450 | Weighted Avg Warehouse Period (Fixed) | Same but only Fixed loans |
| I460 | Weighted Avg Warehouse Period (ARM) | Same but only ARM loans |

**Conforming Limit:** Stored in a config file. Default: `$806,500` (2025). Updated annually.

---

## 10. Financial Condition Section (Schedules A–O)

The Financial Condition (FC) section is a **company-level quarterly submission** that provides balance sheet, income statement, and reserves data. Unlike loan-level data (which is auto-calculated from loan records), the FC section requires **manual data entry** by finance/accounting staff.

### 10.1 Who Fills This Out?

For **mortgage brokers**, many FC fields will be zero or N/A (no securities, no servicing, no warehousing). The key fields for brokers are:
- **Schedule A:** Cash (A010), Accounts Receivable (A020), Other Assets (A230), Total Assets (A290)
- **Schedule B:** Short-term liabilities (B010–B016), Total Liabilities (B220), Equity (B260–B350)
- **Schedule C:** Origination Fees (C210), Broker Fees Earned (C230), Total Gross Income (C800)
- **Schedule D:** Personnel compensation (D010–D130), Other expenses (D200–D280), Net Income (D600)

For **non-delegated correspondents** and larger companies, more FC fields become relevant (warehouse lines, loans HFS, secondary marketing gains).

### 10.2 UI: Financial Condition Page

**File:** `frontend/src/pages/lender/mcr-reports/financial-condition.js`

**Layout:**
- **Period selector:** Year + Quarter dropdown
- **Accordion sections** for each schedule:
  - Schedule A: Assets
  - Schedule B: Liabilities & Equity
  - Schedule B-350R: Equity Rollforward
  - Schedule C: Income
  - Schedule CF: Cash Flow
  - Schedule D: Non-Interest Expense
  - Schedule O: Reserves
- Each section contains a form with labeled number inputs
- **Calculated fields** are grayed out and auto-computed
- **Save Draft** and **Finalize** buttons
- **Explanatory Notes** text area at the bottom

### 10.3 Calculated Fields (Auto-Computed)

The following fields are CALCULATED and should not be manually editable:

**Schedule A:**
- `A290 (Total Assets)` = A010 + A020 + A030.total + A060.total + A090 + A160 + A220 + A230 + A280

**Schedule B:**
- `B217 (Total Short-Term)` = B010 + B015 + B016
- `B219 (Total Long-Term)` = B020 + B030 + ... + B210
- `B220 (Total Liabilities)` = B217 + B219
- `B319 (Total Corporate Equity)` = B250 + B260 + B270 + B280 + B290 + B300 + B310 + B240
- `B350 (Total Equity)` = B319 + B320 + B349
- `B360 (Total L&E)` = B220 + B350

**Schedule C:**
- `C090 (Total Interest Income)` = SUM(C010:C080)
- `C260 (Total Origination Income)` = SUM(C200:C250)
- `C450 (Net Secondary Marketing)` = SUM(C300:C440)
- `C650 (Total Servicing Income)` = SUM(C500:C640)
- `C780 (Total Other Non-Interest)` = SUM(C720:C770)
- `C800 (Total Gross Income)` = C090 + C260 + C450 + C650 + C780
- `C160 (Total Interest Expense)` = SUM(C100:C150)

**Schedule D:**
- `D070 (Total Origination Comp)` = SUM(D010:D060)
- `D100 (Total Servicing Comp)` = D080 + D090
- `D130 (Total Non-Corp Personnel)` = D070 + D110
- `D170 (Total Other Personnel)` = D150 + D160
- `D180 (Total Personnel)` = D130 + D170
- `D310 (Total Gross Expenses)` = C160 + D180 + D300 + D440
- `D510 (Pre-Tax NOI)` = C800 - D310
- `D530` = D510 - D520
- `D600 (Net Income)` = D530 + D540 + D560

**Schedule O:**
- `O060 (Credit Loss Ending)` = O010 + O020 + O030 + O040 + O050
- `O130 (REO Ending)` = O110 + O120
- `O350 (Repurchase Ending)` = O310 + O320 + O330 + O340

### 10.4 Cross-Validation Between FC and Loan Data

- `B210 (Repurchase Reserves)` must equal `O350 (Ending Repurchase Reserve)` on Schedule O
- `C390 (Provision for Repurchase Reserve)` must equal `O320` on Schedule O
- `C700 (Provision for Credit Losses)` must equal `O020` on Schedule O
- `B350B (Net Income in Equity Rollforward)` must equal `D600 (Net Income)`
- `B350T (Ending Equity)` must equal `B350 (Total Equity)`

---

## 11. State-Based Reporting

### 11.1 How State-Based Reporting Works

Per NMLS requirements and ARIVE reference:
- Each MCR report is filed **per state** based on the **property state** of the loan
- A company must file an MCR for each state in which it is licensed
- The report generation UI allows selecting multiple states and generating results for all at once
- The report viewer has a **left sidebar** showing selected states — clicking a state filters the tab data

### 11.2 Property State Field

Every loan must have `property.state` (2-letter state code) properly populated. This field is the key for state-based filtering.

**Backend query pattern:**
```javascript
// For a single state
const filter = { ...baseFilter, 'property.state': 'CA' };

// For multiple states
const filter = { ...baseFilter, 'property.state': { $in: ['CA', 'TX'] } };
```

### 11.3 Per-State MCR Configuration

Via `MCRStateConfig` model, companies can configure:
- State-specific NMLS license number
- Whether supplemental state-specific form is required (SF010–SF1100)
- Custom supplemental form data

### 11.4 Supplemental State-Specific Form (SF010–SF1100)

Certain states require additional data. The supplemental form includes:
- **Commercial Origination Data** (SF010–SF130): Loans originated that are secured by commercial property
- **Consumer Origination Data** (SF210–SF530): Consumer loans originated  
- **Commercial Servicing Data** (SF610–SF730): Commercial loans serviced
- **Consumer Servicing Data** (SF810–SF1100): Consumer loans serviced

For most residential mortgage brokers, this will be all zeros. The UI should default to collapsed/hidden with an "Expand" option.

---

## 12. Export Functionality (Excel & XML)

Per the ARIVE export modal, the system supports two export formats:

### 12.1 Excel Export

**Library:** Use `exceljs` or `xlsx` npm package.

**Structure:** One workbook with tabs matching the MCR tabs:
- Sheet 1: Application Data
- Sheet 2: Closed Loan Data
- Sheet 3: Revenue Data
- Sheet 4: MLO Data
- Sheet 5: RMLA Section II
- Sheet 6: Financial Condition (all schedules)

Each sheet follows the NMLS grid layout with Row IDs, field names, and the three-column structure.

### 12.2 XML Export

**Format:** NMLS-compliant XML schema for direct upload to the NMLS system.

**Structure:** Follow the NMLS XML submission format:
```xml
<MortgageCallReport>
  <ReportInfo>
    <Year>2026</Year>
    <Quarter>Q1</Quarter>
    <State>CA</State>
    <CompanyNMLSId>123456</CompanyNMLSId>
  </ReportInfo>
  <RMLA_SectionI>
    <ApplicationData>
      <AC010><Amount>5000000</Amount><Count>25</Count></AC010>
      ...
    </ApplicationData>
    <ClosedLoanData>...</ClosedLoanData>
    <RevenueData>...</RevenueData>
    <MLOData>...</MLOData>
  </RMLA_SectionI>
  <RMLA_SectionII>...</RMLA_SectionII>
  <FinancialCondition>...</FinancialCondition>
</MortgageCallReport>
```

### 12.3 Export API

```
GET /api/v1/mcr/reports/:id/export?format=excel&state=all
GET /api/v1/mcr/reports/:id/export?format=xml&state=CA
```

**Parameters:**
- `format`: `excel` | `xml`
- `state`: `all` | specific state code (e.g., `CA`)

**"Save As Generated Report" option:** If the user checks this in the export modal, the export is recorded in the MCRReport's metadata and appears in the Generated Reports table.

---

## 13. Validation & QA Checklist

These are the **mandatory cross-checks** the system runs after generating a report. Display results in the `MCRValidationPanel` component.

### 13.1 Pipeline Balance Check
```
AC066 (Total Pipeline) === AC090 (Total Results = AC070 + AC080)
```
If not equal → **ERROR** — "Pipeline does not balance"

### 13.2 Closed Loan Vertical Checks
```
AC070.count === AC190.count  (Total by Loan Type)
AC070.count === AC290.count  (Total by Property Type)
AC070.count === AC390.count  (Total by Purpose)
AC070.count === AC590.count  (Total by Lien Status)
AC070.count === AC990.count  (Total by QM Status)
AC070.count === AC1290.count (Total by Servicing Disposition)
```
If any mismatch → **ERROR** — "Closed loan totals do not cross-check"

### 13.3 MLO Attribution Check
```
SUM(all MLO row amounts) === AC070.amount
SUM(all MLO row counts) === AC070.count
```
If not equal → **WARNING** — "MLO attribution does not match total closed loans"

### 13.4 Revenue Sanity Check
```
AC1100 (Gross Revenue) > 0  (for any period with funded loans)
```
If `AC070.count > 0` but `AC1100 === 0` → **WARNING** — "Revenue is $0 but there are funded loans — check compensation data"

### 13.5 Financial Condition Cross-Checks
```
B360 (Total L&E) === A290 (Total Assets)       // Balance sheet must balance
B350B (Net Income) === D600 (Net Income)        // Income must match
B210 === O350                                    // Repurchase reserves must match
```

### 13.6 Status History Integrity Check
- Find a loan funded AFTER the report end date
- Verify it appears as active/processing in the report, NOT Funded
- Run as automated test during QA

### 13.7 State Data Check
- Verify all loans in the report have a valid `property.state`
- Flag any loans with missing state as **WARNING**

### 13.8 Division-by-Zero Guard
Every `Amount / Count` calculation must check `Count > 0`. If `Count === 0`, display `$0.00`.

### 13.9 Exclude from MCR Audit
Report should log:
```
totalLoansIncluded: X
totalLoansExcluded: Y (with excludeFromMCR = true)
```

---

## 14. File-by-File Task Breakdown

### Backend — New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/src/models/loanStatusHistory.model.js` | Snapshot engine schema |
| 2 | `backend/src/models/loanCompensation.model.js` | Revenue/compensation/audit dates schema |
| 3 | `backend/src/models/mcrReport.model.js` | Saved report snapshots |
| 4 | `backend/src/models/mcrStateConfig.model.js` | Per-state MCR configuration |
| 5 | `backend/src/models/financialCondition.model.js` | FC schedules (A, B, C, CF, D, O) |
| 6 | `backend/src/services/mcr.service.js` | Core calculation engine (all 5 tabs) |
| 7 | `backend/src/services/mcrExport.service.js` | Excel + XML export generation |
| 8 | `backend/src/controllers/mcr.controller.js` | Generate, list, get, update, delete, export |
| 9 | `backend/src/controllers/loanCompensation.controller.js` | CRUD for compensation |
| 10 | `backend/src/controllers/mcrStateConfig.controller.js` | State config CRUD |
| 11 | `backend/src/controllers/financialCondition.controller.js` | FC data entry |
| 12 | `backend/src/routes/mcr.routes.js` | MCR report API routes |
| 13 | `backend/src/routes/loanCompensation.routes.js` | Compensation API routes |
| 14 | `backend/src/routes/mcrStateConfig.routes.js` | State config routes |
| 15 | `backend/src/routes/financialCondition.routes.js` | FC data routes |
| 16 | `backend/scripts/backfill-status-history.js` | One-time migration to seed history |
| 17 | `backend/src/config/conformingLimits.js` | Annual conforming loan limits |

### Backend — Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `backend/src/models/loan.model.js` | Add MCR fields (leadSource, docType, interestOnlyFlag, hoeparFlag, qmStatus, isReverseMortgage, hasPrepaymentPenalty, isPiggybackSecond, hasMortgageInsurance, excludeFromMCR). Add `Closed-Incomplete` to status enum. Add `Home Improvement`, `Cash-Out Refinance`, `HELOC`, `Reverse Mortgage` to loanType enum. Add pre-save hook for status history + auto-populate audit dates. |
| 2 | `backend/src/controllers/loan.controller.js` | Integrate status history writes into both `updateLoanStatus` functions. Auto-create LoanCompensation with `fundedDate` on Funded. |
| 3 | `backend/src/app.js` | Register all new MCR routes |
| 4 | `backend/src/routes/loan.routes.js` | Add compensation sub-routes |

### Frontend — New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/src/pages/lender/mcr-reports.js` | MCR Reports main page (2-step flow + Generated Reports table) |
| 2 | `frontend/src/pages/lender/mcr-reports/[id].js` | MCR Report viewer (state sidebar + 5 tabs) |
| 3 | `frontend/src/pages/lender/mcr-reports/financial-condition.js` | Financial Condition data entry page |
| 4 | `frontend/src/services/mcr.service.js` | MCR API service |
| 5 | `frontend/src/services/loanCompensation.service.js` | Compensation API service |
| 6 | `frontend/src/services/financialCondition.service.js` | FC API service |
| 7 | `frontend/src/components/mcr/MCRSpecSelector.js` | Step 1: Select Specifications UI |
| 8 | `frontend/src/components/mcr/MCRGeneratedReportsTable.js` | Generated Reports history table |
| 9 | `frontend/src/components/mcr/MCRReportViewer.js` | 5-tab viewer + state sidebar |
| 10 | `frontend/src/components/mcr/MCRExportModal.js` | Export modal (Excel/XML format, state selector) |
| 11 | `frontend/src/components/mcr/MCRStateConfigModal.js` | Per-state configuration modal |
| 12 | `frontend/src/components/mcr/MCRValidationPanel.js` | Validation results display |
| 13 | `frontend/src/components/mcr/tabs/ApplicationDataTab.js` | Tab 1: AC010–AC090 grid |
| 14 | `frontend/src/components/mcr/tabs/ClosedLoanDataTab.js` | Tab 2: AC100–AC990 grid |
| 15 | `frontend/src/components/mcr/tabs/RevenueDataTab.js` | Tab 3: AC1010–AC1290 grid |
| 16 | `frontend/src/components/mcr/tabs/MloDataTab.js` | Tab 4: Per-LO table |
| 17 | `frontend/src/components/mcr/tabs/RmlaTab.js` | Tab 5: I010–I460 grid |
| 18 | `frontend/src/components/mcr/fc/ScheduleAForm.js` | FC Schedule A: Assets |
| 19 | `frontend/src/components/mcr/fc/ScheduleBForm.js` | FC Schedule B: Liabilities & Equity |
| 20 | `frontend/src/components/mcr/fc/ScheduleCForm.js` | FC Schedule C: Income |
| 21 | `frontend/src/components/mcr/fc/ScheduleDForm.js` | FC Schedule D: Expenses |
| 22 | `frontend/src/components/mcr/fc/ScheduleOForm.js` | FC Schedule O: Reserves |
| 23 | `frontend/src/components/lender/loans/LoanCenterTab.js` | In-loan "Loan Hub" tab |
| 24 | `frontend/src/components/lender/loans/AuditDatesTab.js` | In-loan "Audit & Dates" tab |
| 25 | `frontend/src/components/lender/loans/FundingRevenueTab.js` | In-loan "Funding/Revenue" tab |
| 26 | `frontend/src/components/lender/loans/MCRDataAuditTab.js` | In-loan "MCR Data Audit" tab |

### Frontend — Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `frontend/src/components/layout/Sidebar.js` | Add "MCR Reports" nav item for lender/company roles |
| 2 | `frontend/src/pages/lender/loans/[id].js` | Add 4 new tabs: Loan Hub, Funding/Revenue, Audit & Dates, MCR Data Audit. Add MCR classification fields (leadSource, docType, etc.) to Loan Details sub-tab. |

---

## 15. Implementation Phases & Timeline

### Phase 1: Database Foundation (Backend) — ~4-5 days
1. Create `LoanStatusHistory` model
2. Create `LoanCompensation` model (with all audit dates + revenue fields)
3. Create `MCRReport` model
4. Create `MCRStateConfig` model
5. Create `FinancialCondition` model
6. Modify Loan model (new fields + status enum + pre-save hook)
7. Modify `loan.controller.js` (status history + auto date population)
8. Write & run backfill migration script
9. Create `conformingLimits.js` config

### Phase 2: In-Loan Tabs (Full Stack) — ~5-6 days
1. Create LoanCompensation controller + routes
2. Register routes in `app.js`
3. Build `LoanCenterTab.js` — "Loan Hub" (consolidated processing hub)
4. Build `AuditDatesTab.js` — All audit dates + status history table
5. Build `FundingRevenueTab.js` — Revenue info, product info, loan info
6. Build `MCRDataAuditTab.js` — Read-only audit view + "Exclude from MCR" toggle
7. Update `[id].js` to register all 4 new tabs
8. Add MCR classification fields to Loan Details sub-tab

### Phase 3: MCR Calculation Engine (Backend) — ~5-6 days
1. Build `mcr.service.js` — all 5 tab computation functions
2. Build `mcr.controller.js` — generate, CRUD, available-states
3. Build `mcr.routes.js`
4. Build `mcrStateConfig.controller.js` + routes
5. Register all MCR routes in `app.js`
6. Write unit tests for each calculation function

### Phase 4: MCR Reports UI (Frontend) — ~6-7 days
1. Add "MCR Reports" to Sidebar
2. Build MCR Reports main page with 2-step flow
3. Build Step 1: `MCRSpecSelector` (year, quarter, states, generate-as-LO)
4. Build Step 2: `MCRReportViewer` (state sidebar + 5 tabs)
5. Build all 5 tab components (ApplicationDataTab through RmlaTab)
6. Build `MCRGeneratedReportsTable`
7. Build `MCRValidationPanel`
8. Build `MCRStateConfigModal`
9. Create `mcr.service.js` frontend service

### Phase 5: Financial Condition UI — ~3-4 days
1. Build FC data entry page
2. Build Schedule A–O form components
3. Build `financialCondition.controller.js` + routes
4. Wire up calculated fields
5. FC cross-validation checks

### Phase 6: Export, Validation & Polish — ~3-4 days
1. Build `mcrExport.service.js` (backend)
2. Implement Excel export using `exceljs`
3. Implement XML export (NMLS-compliant schema)
4. Build `MCRExportModal` (frontend)
5. Implement all cross-check validations
6. End-to-end testing with test data
7. Edge case testing (empty periods, zero loans, single state, LO report)

**Total Estimated Effort: ~26-32 developer days**

---

## 16. Risk & Edge Cases

### 16.1 Historical Data Gap
**Risk:** Existing loans have NO status history records.  
**Mitigation:** Backfill script creates one entry per loan using current status + `createdAt`. Add warning banner: *"Status history tracking began on [date]. Reports before this date use approximated data."*

### 16.2 LoanCompensation Not Filled
**Risk:** Users forget to fill in compensation data.  
**Mitigation:**
- Auto-create `LoanCompensation` when loan is created
- Show "Missing Data" warning in report if funded loans have $0 revenue
- Add completion indicator badge on Funding/Revenue tab
- MCR Data Audit tab highlights empty required fields in red

### 16.3 Missing Property State
**Risk:** Loans with no `property.state` will be excluded from state-based reports.  
**Mitigation:** Validation check flags these loans. Dashboard warning shows count of loans missing state.

### 16.4 Program Type Mismatch
**Risk:** Loan refs program with `programType = 'other'` — doesn't map to NMLS types.  
**Mitigation:** Map `jumbo` to conforming/jumbo logic (amount-based). Map `other` to catch-all with warning.

### 16.5 Missing LTV
**Risk:** `financialCalculations.ltv` not populated.  
**Mitigation:** Calculate on-the-fly: `loanAmount / propertyValue × 100`. If value is 0, skip from LTV buckets and flag.

### 16.6 Multi-Company Context
**Risk:** Company-level reports need to aggregate across all lenders.  
**Mitigation:** MCR service accepts `{ lender: id }` or `{ company: id }` filter.

### 16.7 Timezone Handling
**Risk:** UTC timestamps cause boundary issues (11 PM EST = next day UTC).  
**Mitigation:** Use lender/company timezone to convert period boundaries. Default `America/New_York`.

### 16.8 Conforming Loan Limit Updates
**Risk:** Limits change annually.  
**Mitigation:** `conformingLimits.js` config file with per-year limits. Report year determines which limit to use.

### 16.9 "Exclude from MCR" Misuse
**Risk:** Users accidentally exclude loans, causing underreporting.  
**Mitigation:** MCR Data Audit shows clear "EXCLUDED" badge. Report summary shows excluded count. Admin can view list of excluded loans.

### 16.10 Large Dataset Performance
**Risk:** Companies with thousands of loans may have slow report generation.  
**Mitigation:** Use MongoDB aggregation pipelines (not in-memory loops). Index `property.state`, `excludeFromMCR`, `status`. Consider caching generated reports.

### 16.11 XML Schema Compliance
**Risk:** NMLS expects specific XML format for electronic submission.  
**Mitigation:** Reference official NMLS XML schema documentation. Validate generated XML against schema before export.

### 16.12 Financial Condition Data Entry Errors
**Risk:** Manual data entry for FC schedules is error-prone.  
**Mitigation:** All calculated fields are auto-computed (not editable). Cross-validation between schedules catches inconsistencies. "Review" step before finalizing.

---

## Appendix A: NMLS Row ID Quick Reference

### Application Data (Tab 1)

| Row ID | Name |
|--------|------|
| AC010 | Beginning Pipeline |
| AC020 | Apps Received |
| AC030 | Approved Not Accepted |
| AC040 | Apps Denied |
| AC050 | Apps Withdrawn |
| AC060 | Closed Incomplete |
| AC063 | Net Count Change |
| AC065 | Net Amount Change |
| AC066 | Total Pipeline |
| AC070 | Closed & Funded |
| AC080 | Ending Pipeline |
| AC090 | Total Results |

### Closed Loan Data (Tab 2)

| Row ID | Name |
|--------|------|
| AC100–AC190 | Loan Type (Conv/FHA/VA/USDA/Total) |
| AC200–AC290 | Property Type (1-4 Family/Manufactured/Multi/Total) |
| AC300–AC390 | Purpose (Purchase/HomeImprove/Refi/Total) |
| AC400 | HOEPA |
| AC500–AC590 | Lien (1st/2nd/Not Secured/Total) |
| AC600–AC610 | Fees (Broker/Lender) |
| AC700–AC890 | Reverse Mortgage Breakdown |
| AC900–AC990 | QM/Closed Breakdown |

### Revenue Data (Tab 3)

| Row ID | Name |
|--------|------|
| AC1010 | Origination Fees |
| AC1020 | SRP |
| AC1030 | YSP |
| AC1040 | Discount Points |
| AC1050 | Other Origination Income |
| AC1100 | Gross Revenue |
| AC1200–AC1290 | Servicing Disposition |

### MLO Data (Tab 4)

| Field | Description |
|-------|-------------|
| MLO Name | Full name |
| NMLS ID | Individual NMLS number |
| Loan Count | Number of loans funded |
| Total Amount | Sum of loan amounts |
| Average Amount | Total / Count |

### RMLA Section II (Tab 5)

| Row ID | Name |
|--------|------|
| I010–I080 | Product Type (Gov/Conv/Jumbo/Other × Fixed/ARM) |
| I090–I100 | HFS Totals (Fixed/ARM) |
| I110 | Closed-End Second Liens |
| I120 | HELOCs |
| I130 | Reverse Mortgages |
| I140 | Construction Loans |
| I210–I240 | Channel (Brokered/Retail/Correspondent/Other) |
| I250–I269 | Rate Type & Size Totals |
| I270 | Alt/Reduced Documentation |
| I280 | Interest Only |
| I290 | Option ARMs |
| I300 | Prepayment Penalties |
| I310–I329 | Purpose (Purchase/Refi) |
| I330–I349 | Mortgage Insurance / Piggyback |
| I370–I380 | LTV Distribution & Weighted Avg |
| I390 | Weighted Avg Coupon Rate |
| I400–I420 | Loans Sold / Table-Funded / Brokered-Out |
| I430 | Pull-Through Ratio |
| I440–I460 | Weighted Avg Warehouse Period |

### Financial Condition

| Schedule | Content |
|----------|---------|
| A (A010–A290) | Assets: Cash, Securities, Mortgage Loans, OREO, MSRs, Derivatives |
| B (B010–B360) | Liabilities & Equity |
| B-350R | Equity Rollforward |
| C (C010–C800) | Income: Interest, Origination, Secondary Marketing, Servicing, Other |
| CF (CF010–CF040) | Cash Flow Data |
| D (D010–D600) | Non-Interest Expense: Personnel, Other, Corporate Admin, Taxes, Net Income |
| O (O010–O370) | Reserves: Credit Loss, REO, Repurchase |

---

## Appendix B: Status Mapping for MCR

| Loan Status (in app) | MCR Classification | Is "Final"? | Is "Active Pipeline"? |
|---|---|---|---|
| Pre-Qualification | Pipeline | No | Yes |
| Application Started | Pipeline | No | Yes |
| Application Submitted | Pipeline | No | Yes |
| Processing | Pipeline | No | Yes |
| Underwriting | Pipeline | No | Yes |
| Conditional Approval | Pipeline (Approved) | No | Yes |
| Clear to Close | Pipeline | No | Yes |
| Closed | Pipeline (near-final) | No | Yes |
| **Funded** | **Closed/Funded** | **Yes** | No |
| **Declined** | **Denied** | **Yes** | No |
| **Withdrawn** | **Withdrawn** | **Yes** | No |
| **Closed-Incomplete** | **Closed Incomplete** | **Yes** | No |

**"Final" statuses** exit the pipeline. Everything else is "Active Pipeline."

---

## Appendix C: MCR Definitions Glossary

Key terms from the official NMLS MCR Definitions Document:

| Term | Definition |
|------|-----------|
| **Application** | A request for a residential mortgage loan, per HMDA definitions (12 CFR 1003.2(b)) |
| **Beginning Pipeline** | All open applications/loans at start of reporting period that have not reached a terminal status |
| **Brokered** | Third party originations — loans originated by brokers and submitted to lenders |
| **Closed-Retail** | Loans originated directly by the reporting entity and closed in its name |
| **Closed-Correspondent** | Loans acquired from correspondents and closed in the reporting entity's name |
| **QM (Qualified Mortgage)** | Loans meeting ability-to-repay requirements under Dodd-Frank Act |
| **HOEPA** | High-cost mortgage under Home Ownership and Equity Protection Act |
| **RMLA** | Residential Mortgage Loan Activity — the main loan-level section of MCR |
| **Financial Condition (FC)** | Company-level balance sheet and income statement (Schedules A-O) |
| **LTV** | Loan-to-Value ratio — loan amount divided by property value |
| **MSR** | Mortgage Servicing Rights — the right to service a mortgage loan |
| **HFS** | Held for Sale — loans intended to be sold on secondary market |
| **HFI** | Held for Investment — loans held in portfolio |
| **SRP** | Service Release Premium — premium paid by investor when buying loan with servicing released |
| **YSP** | Yield Spread Premium — compensation paid by lender to broker |
| **Pull-Through Ratio** | Percentage of applications that result in funded loans |
| **Warehouse Period** | Days between closing/funding and sale to investor |

---

## Appendix D: Column Structure Reference

Per NMLS definitions, Tabs 1-3 use a **three-column structure** based on origination channel:

| Column | Description | leadSource Mapping |
|--------|-------------|-------------------|
| **Brokered** | Loans originated by the company as a broker (submitted to a lender for funding) | `Wholesale-Brokered` |
| **Closed-Retail** | Loans originated and closed directly by the company | `Retail` |
| **Closed-All Other** | Loans closed via correspondent, table-funding, or other channels | `Correspondent`, `Table-Funded`, `Other` |

Each column has three sub-columns:
- **Amount ($)** — Sum of loan amounts
- **Count (#)** — Number of distinct loans
- **Average ($)** — Amount / Count

---

*This document is the single source of truth for the MCR module implementation. All development should reference this plan. Updated to incorporate official NMLS MCR Definitions, ARIVE system UI reference, and client requirements for Loan Center + Audit & Dates tabs.*
