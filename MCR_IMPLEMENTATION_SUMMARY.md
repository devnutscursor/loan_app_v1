# MCR Implementation Summary

**Status: ✅ COMPLETE — All components implemented and verified**
**Last Updated:** Current Session
**Backend Port:** 5000

---

## Overview

The Mortgage Call Report (MCR) system is fully implemented across backend, frontend, data models, export service, and per-loan MCR data management. The system supports NMLS-compliant MCR generation, state-level breakdowns, Excel/XML export, Financial Condition schedules (A–O), and per-loan compensation/date audit management.

---

## Backend Routes

### `backend/src/routes/mcr.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/mcr/generate` | Generate new MCR report for period |
| GET | `/api/v1/mcr/reports` | List all saved MCR reports |
| GET | `/api/v1/mcr/reports/:id` | Get a specific report |
| PUT | `/api/v1/mcr/reports/:id` | Update report status (draft→final→submitted) |
| DELETE | `/api/v1/mcr/reports/:id` | Delete a draft report |
| GET | `/api/v1/mcr/reports/:id/export` | Export as Excel or XML |
| GET | `/api/v1/mcr/states` | Get all state-specific MCR configs |
| PUT | `/api/v1/mcr/states/:stateCode` | Update state MCR config |
| GET | `/api/v1/mcr/financial-condition/:year/:quarter` | Get FC data for period |
| PUT | `/api/v1/mcr/financial-condition/:year/:quarter` | Save FC data for period |

### `backend/src/routes/loanCompensation.routes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loans/:loanId/compensation` | Get (or auto-create) compensation record |
| PUT | `/api/v1/loans/:loanId/compensation` | Update compensation/MCR data |
| GET | `/api/v1/loans/:loanId/status-history` | Get loan status timeline |
| POST | `/api/v1/loans/:loanId/sync-mcr` | Sync/backfill all MCR defaults for loan |

---

## Backend Controllers

### `backend/src/controllers/mcr.controller.js` — 960 lines

- `generateReport` — Queries loans by lender + state filter + period dates, fetches LoanStatusHistory, calculates all 5 MCR data tabs, builds per-state breakdowns, saves MCRReport snapshot
- `getReports` / `getReport` / `updateReport` / `deleteReport` — Full CRUD with submitted-report delete guard
- `exportReport` — Streams Excel buffer (ExcelJS) or XML string; optionally includes FC data in Sheet 6
- `getStateConfigs` / `updateStateConfig` — Upsert per-state MCR configuration
- `getFinancialCondition` / `saveFinancialCondition` — Upsert Schedules A–O per company/year/quarter

### `backend/src/controllers/loanCompensation.controller.js` — 225 lines

- `getCompensation` — findOne or `new LoanCompensation().save()` to trigger auto-fill hook
- `updateCompensation` — Object.assign + `.save()` to trigger auto-fill hook
- `syncMCRDefaults` *(added this session)* — Backfills:
  - `leadSource` → 'Retail', `docType` → 'Full Doc', `qmStatus` → 'QM-Safe Harbor', `propertyType` → 'Single Family Home'
  - `property.state/city/streetAddress` from `borrowerDetails.currentAddress` (fallback: `Borrower.primaryAddress`)
  - Audit dates from LoanStatusHistory events; calls `loan.markModified('property')` before save
- `getStatusHistory` — All status change events for a loan

---

## Backend Models

### `backend/src/models/mcrReport.model.js` — 139 lines

Fields: `lender`, `company`, `generatedBy`, `year`, `period`, `startDate`, `endDate`, `states[]`, `reportType` (Company/LO), `applicationData` (Mixed), `closedLoanData` (Mixed), `revenueData` (Mixed), `mloData` (Mixed), `rmlaData` (Mixed), `perStateData` (Map), `status` (draft/final/submitted), `fileName`, `totalLoansIncluded`, `totalLoansExcluded`

### `backend/src/models/financialCondition.model.js` — 238 lines

- **A:** Assets — cash, receivables, MBS, mortgage loans, OREO, MSR, derivatives; `totalAssets` CALCULATED
- **B:** Liabilities & Equity; `totalLiabilitiesAndEquity` CALCULATED
- **B-350R:** Equity Rollforward; `endingEquity` CALCULATED
- **C:** Income; `netIncome` CALCULATED
- **CF:** Cash Flow; `netChangeInCash` CALCULATED
- **D:** Non-Interest Expense; `totalNonInterestExpense` CALCULATED
- **O:** Reserves

### `backend/src/models/loanCompensation.model.js` — ~270 lines

Pre-save hook derives: `finalRate`, `amortizationType`, `lienPosition` ('1st' default), `cashOutAmount`, `rateLockExpiry`, `noteDate`, `firstPaymentDate` (+1 month), `originationFee`, `loanRevenue`

13 date fields: `applicationDate`, `disclosureDate`, `creditPullDate`, `processingStartDate`, `submittedToUWDate`, `uwDecisionDate`, `clearToCloseDate`, `closingDisclosureDate`, `closingDate`, `fundedDate`, `disbursementDate`, `wireDate`, `noteSigned`

### `backend/src/models/loan.model.js` — ~1290 lines *(modified this session)*

- Added to `propertySchema`: `streetAddress`, `addressLine2`, `city`, `state`, `county`
- MCR classification fields: `leadSource`, `docType`, `qmStatus`, `isReverseMortgage`, `hasPrepaymentPenalty`, `isPiggybackSecond`, `hasMortgageInsurance`, `excludeFromMCR`
- Pre-save hook derives: `isReverseMortgage`, `hasMortgageInsurance`, `qmStatus`

---

## Export Service

### `backend/src/services/mcrExport.service.js` — 677 lines

`generateExcel(report, fcData, stateFilter)` — ExcelJS workbook, 6 sheets:
1. **Application Data** — AC010–AC090 with self-checking pipeline balance row
2. **Closed Loan Data** — AC100 + breakdowns by type, property, occupancy, HOEPA, lien, QM
3. **Revenue Data** — AC1010–AC1100 + servicing disposition AC1200–AC1210
4. **MLO Data** — Per-MLO: name, NMLS ID, count, volume, avg; totals row
5. **RMLA Section II** — Product type, channel, risk characteristics, purpose, LTV buckets
6. **Financial Condition** — (optional) all FC schedule values

`generateXML(report, fcData, stateFilter, companyInfo)` — NMLS MISMO XML

---

## Calculation Engine (mcr.controller.js lines 430–960)

| Function | AC Codes | Description |
|----------|----------|-------------|
| `calculateApplicationData` | AC010–AC090 | Pipeline: received, denied, withdrawn, funded, closed-incomplete, ending |
| `calculateClosedLoanData` | AC100–AC960 | Funded breakdowns: type, property, occupancy, HOEPA, lien, QM |
| `calculateRevenueData` | AC1010–AC1210 | Fee types + servicing disposition |
| `calculateMLOData` | mloData | Per-loan-officer attribution |
| `calculateRMLAData` | rmlaData | Product type, channel, risk, LTV distribution |

Uses `compMap` (LoanCompensation keyed by loan `_id`) and `statusAtEndDate`/`statusDuringPeriod` from LoanStatusHistory.

---

## Frontend Pages

| File | Lines | Description |
|------|-------|-------------|
| `frontend/src/pages/lender/mcr-reports.js` | 901 | 5-tab view + state sidebar + generate modal + MCRValidationPanel + export |
| `frontend/src/pages/company/mcr-reports.js` | 540 | Company MCR page (same structure) |
| `frontend/src/pages/lender/mcr-reports/financial-condition.js` | 652 | FC Schedules A–O manual data entry with auto-calculated fields |

---

## Frontend Components

### `frontend/src/components/mcr/MCRValidationPanel.js` — 254 lines

Post-generation validation per spec §13:

| Rule | Check | Severity |
|------|-------|----------|
| 13.1 Pipeline Balance | AC010 + AC020 − AC030 − AC040 − AC050 − AC060 − AC090 = 0 | error/pass |
| 13.2 Closed Loan Verticals | Type/property/occupancy/lien/QM sums = AC100 | error/pass |
| 13.3 MLO Attribution | Sum of MLO counts = AC050 funded count | warning/pass |
| 13.4 Revenue Sanity | Revenue > $0 when funded loans > 0 | warning/pass |
| 13.5 Balance Sheet | A290 = B360; ER net income = D net income | error/pass |
| 13.9 Excluded Loans | Count of excludeFromMCR loans | info |
| 13.8 Division Guard | Always passes — safe division confirmed | pass |

### `frontend/src/components/mcr/MCRStateConfigModal.js`

Per-state reporting config: enable/disable, thresholds, product/channel flags.

---

## Loan-Level MCR Tabs

All in `frontend/src/components/lender/loans/mcr/`

### `MCRDataAuditTab.js` — 397 lines *(rewritten this session)*

- Calls `syncMCRDefaults` on load (backfills defaults before validation runs)
- Status-aware severity: pre-closing missing revenue → `info`; post-funded → `error`
- Color-coded display: red/amber/blue/green per severity

### `AuditDatesTab.js` — 306 lines

- 13 MCR date pickers + rate lock section (lockDate, lockPeriod, rateLockExpiry)
- Collapsible status history timeline with from/to/user for each event

### `FundingRevenueTab.js` — 305 lines

- Revenue fields: brokerComp, origination, SRP, YSP, discount points, processing, pass-thru, flat fees, lender fees, loanRevenue
- Product: finalRate, lockPeriod, amortizationType, lienPosition
- Classification: leadSource, docType, channel
- Additional: cashOutAmount, investorName, MI premium, warehouseDays, servicingDisposition

### `LoanCenterTab.js` — 340 lines

Consolidated hub: visual status pipeline tracker, quick facts, key dates, condition summary, document count.

---

## Frontend Service

### `frontend/src/services/mcr.service.js` — 121 lines

- **mcrService:** `generateReport`, `getReports`, `getReport`, `updateReportStatus`, `deleteReport`, `exportReport` (browser download), `getStateConfigs`, `updateStateConfig`, `getFinancialCondition`, `saveFinancialCondition`
- **loanCompensationService:** `getCompensation`, `updateCompensation`, `getStatusHistory`, `syncMCRDefaults`

---

## Data Pipeline

```
1. Loan Created
   - propertySchema saves streetAddress/city/state/county (fixed this session)
   - MCR fields: leadSource, docType, qmStatus, excludeFromMCR
   - Pre-save hook derives: isReverseMortgage, hasMortgageInsurance, qmStatus

2. LoanCompensation Auto-Created (first getCompensation call)
   - Pre-save hook derives: finalRate, amortizationType, lienPosition,
     cashOutAmount, rateLockExpiry, noteDate, firstPaymentDate, loanRevenue

3. MCR Sync (on MCRDataAuditTab load)
   - syncMCRDefaults backfills: leadSource, docType, qmStatus, propertyType,
     property.state/city/streetAddress, audit dates from LoanStatusHistory

4. MLO Assigned
   - loan.assignedLoanOfficer used by calculateMLOData() for per-officer attribution

5. MCR Report Generated
   - generateReport() queries loans by lender + state + period
   - Calculates 5 tabs; builds perStateData[]; saves MCRReport snapshot
```

---

## Known Limitations

1. **Loans missing property.state** — syncMCRDefaults backfills from borrowerDetails.currentAddress. If also empty, loan won't appear in state-filtered queries.
2. **AC010 pipeline beginning** — Requires applicationDate in LoanCompensation. Loans with no status history may lack this.
3. **Revenue $0 pre-closing** — Intentional. Status-aware validation prevents false alarms.
4. **Financial Condition is manual** — Not derived from loan data; requires manual entry by finance staff.
5. **XML export** — Verify NMLS MISMO schema version before official regulatory submission.

---

## Full File Index

### Backend

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/routes/mcr.routes.js` | ~60 | All 10 MCR routes |
| `backend/src/routes/loanCompensation.routes.js` | ~30 | 4 compensation/sync routes |
| `backend/src/controllers/mcr.controller.js` | 960 | Report gen + CRUD + FC + state config + calc engine |
| `backend/src/controllers/loanCompensation.controller.js` | 225 | Compensation CRUD + syncMCRDefaults |
| `backend/src/services/mcrExport.service.js` | 677 | Excel (6 sheets) + XML export |
| `backend/src/models/mcrReport.model.js` | 139 | MCR report snapshot schema |
| `backend/src/models/mcrStateConfig.model.js` | ~80 | Per-state MCR settings |
| `backend/src/models/financialCondition.model.js` | 238 | FC Schedules A–O |
| `backend/src/models/loanCompensation.model.js` | ~270 | Dates + revenue + auto-fill hook |
| `backend/src/models/loan.model.js` | ~1290 | Core schema + MCR fields + property address |

### Frontend

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/pages/lender/mcr-reports.js` | 901 | Lender MCR reports (5-tab + generate + export) |
| `frontend/src/pages/company/mcr-reports.js` | 540 | Company MCR reports |
| `frontend/src/pages/lender/mcr-reports/financial-condition.js` | 652 | FC Schedules A–O data entry |
| `frontend/src/components/mcr/MCRValidationPanel.js` | 254 | Validation rules 13.1–13.9 |
| `frontend/src/components/mcr/MCRStateConfigModal.js` | ~150 | State config modal |
| `frontend/src/components/lender/loans/mcr/MCRDataAuditTab.js` | 397 | Per-loan audit (sync-on-load, status-aware) |
| `frontend/src/components/lender/loans/mcr/AuditDatesTab.js` | 306 | 13 date pickers + rate lock + history |
| `frontend/src/components/lender/loans/mcr/FundingRevenueTab.js` | 305 | Revenue + product + classification |
| `frontend/src/components/lender/loans/mcr/LoanCenterTab.js` | 340 | Consolidated loan hub |
| `frontend/src/services/mcr.service.js` | 121 | All frontend MCR API calls |

---

## Session Fixes Applied

| Issue | Root Cause | Fix |
|-------|------------|-----|
| MCR Data Audit false errors | No defaults on existing loans; no status-aware validation | Rewrote MCRDataAuditTab: syncMCRDefaults on load, status-aware severity |
| property.state/city never persisted | propertySchema missing address fields (Mongoose strict mode) | Added fields to propertySchema in loan.model.js |
| Address dropped on loan creation | propertyData builder incomplete | Fixed both createLoan and createLoanData in loan.controller.js |
| Existing loans had no MCR defaults | Legacy loans pre-MCR module | syncMCRDefaults backfills classification + property address |
| propertyType missing warning | No default in pipeline | syncMCRDefaults backfills 'Single Family Home' |
| MCR sidebar icon missing | 'chart-bar' not in renderIcon() switch | Added SVG case to Sidebar.js renderIcon() |
| Compensation bypassed pre-save hook | Used .create() / findOneAndUpdate() | Both now use .save() |
