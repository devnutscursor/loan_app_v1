# MCR Client Feedback — Complete Implementation Plan

This plan converts all client feedback in `MCR feedback/*.txt`, `MCR Guide.txt`, `MCR 1.txt`, and `MCR Definitions.txt` into a complete implementation roadmap for **LoanApp360 / Syncly360 CRM**.

## Objectives

- **Match NMLS MCR intent and client feedback** for Tabs 1–5 (+ Financial Condition where relevant).
- Ensure **snapshot correctness** (time-travel status), **checksum correctness**, and **data completeness**.
- Prevent “dirty data” by enforcing **workflow gates** (no hard delete after application date, required fields before funding, denial reasons on denied status).
- Keep the system **backward compatible** with existing loans and previously generated `MCRReport` snapshots.

## Source of Requirements (Client Feedback)

- **Application pipeline reconciliation** (AC010–AC090) and “no delete after application date”
- **Closed loan categorization** and **AC990 master checksum**
- **UI → DB mapping** and missing fields list (funding method router, HELOC limits, reverse subtype, etc.)
- **MLO attribution** requiring NMLS ID for each loan’s LO
- **RMLA risk matrix**, including HELOC credit line amount and correct weighted averages
- **Reg B / ECOA adverse action** requirement for the “Denied” state (denial reasons)

## Current State Summary (What Exists Today)

- Backend:
  - `LoanStatusHistory` model exists (snapshot engine).
  - `LoanCompensation` model exists (revenue + dates + product).
  - `MCRReport`, `MCRStateConfig`, `FinancialCondition`, Excel/XML exports exist.
  - MCR calculations exist in `backend/src/controllers/mcr.controller.js` for Tab 1–5.
- Frontend:
  - Lender/company MCR report pages exist with viewer, state filter, export, and validations.
  - Loan-level MCR tabs exist (`FundingRevenueTab`, `AuditDatesTab`, `MCRDataAuditTab`, `LoanCenterTab`).
- Gaps vs feedback:
  - **AC030 Approved but not Accepted** is not implemented as its own bucket.
  - No hard enforcement for **“no delete after application date”**.
  - No hard enforcement for **required dimensions before status → Funded**.
  - No explicit **Funding Method** router field (currently inferred from `leadSource`).
  - No **HELOC vs Closed-End Second** distinction + no **credit line amount** requirement.
  - Reverse mortgage subtypes not enforced as required selection.
  - LO NMLS ID is not strictly enforced for funded loans.
  - Denial reasons modal/storage not enforced when status becomes Denied/Declined.
  - RMLA **weighted average LTV** can appear as 0% when LTV is missing; needs stronger data guarantees and/or computation fallback.

---

## Phase 1 — Data Model Changes (Schema)

### 1.1 Add missing fields required by feedback

#### A) `Loan` model (`backend/src/models/loan.model.js`)

Add:

- **Funding router**
  - `fundingMethod`: enum (recommended)
    - `Brokered`
    - `Non-Delegated`
    - `Delegated` (optional if you support it)
    - `Unknown` (optional, only during migration)
- **Approved-but-not-accepted tracking**
  - Option 1 (recommended): new status `Approved-Not-Accepted` (see Phase 3)
  - Option 2: milestone/date field (see Phase 3)
- **Reverse subtype**
  - `reverseMortgageType`: enum
    - `HECM-Standard`
    - `HECM-Saver`
    - `Proprietary/Other`
- **Denied compliance (Reg B)**
  - `denialReasons`: array of enum codes (e.g., `DTI_TOO_HIGH`, `CREDIT_SCORE`, `COLLATERAL`, `INCOME`, `OTHER`)
  - `denialReasonOtherText`: string (required when `OTHER`)

Notes:

- Keep existing MCR classification fields (`leadSource`, `docType`, `qmStatus`, etc.).
- Continue to store `excludeFromMCR` on `Loan`.

#### B) `LoanCompensation` model (`backend/src/models/loanCompensation.model.js`)

Add:

- **Second-lien type / HELOC router**
  - `secondLienType`: enum
    - `ClosedEndSecond`
    - `HELOC`
    - `N/A`
  - (or) `isRevolvingLine`: boolean (less descriptive, but OK)
- **HELOC credit line amount**
  - `creditLineAmount`: number
  - Required when `secondLienType=HELOC`

Notes:

- Client feedback explicitly requires HELOC reporting to use **max credit limit**, not draw amount.

#### C) User/LO model normalization

Ensure one canonical field for LO NMLS ID across the app:

- Backend: standardize to `user.nmlsId` (or `user.nmls`) consistently.
- Frontend: display “Assigned LO: Name — NMLS ID” and validate presence.

### 1.2 Migration / backfill scripts

Create a migration script (or one-time admin endpoint) to backfill fields:

- `fundingMethod` default derivation:
  - if `leadSource === 'Wholesale-Brokered'` → `Brokered`
  - else → `Non-Delegated` (or default based on your business)
- If `isReverseMortgage === true` and `reverseMortgageType` missing:
  - set `reverseMortgageType = 'HECM-Standard'` temporarily OR leave null and flag via “MCR readiness” report (recommended).
- If lien position = 2nd and no second lien type:
  - set `secondLienType = 'ClosedEndSecond'` temporarily and flag for review.

Deliverables:

- `backend/scripts/mcr-backfill-feedback-fields.js` (or similar)
- Safe to re-run idempotently.

---

## Phase 2 — Workflow Guards (Prevent Dirty Data)

### 2.1 No hard delete after application date

Requirement: “Don’t let users delete a loan record once it has an application date.”

Implementation:

- Identify the loan delete endpoint(s) in controllers/routes (likely `backend/src/controllers/loan.controller.js` and/or company/admin controllers).
- Before delete:
  - Lookup `LoanCompensation` for the loan.
  - If `comp.applicationDate` exists → return **400** with message:
    - “Loans cannot be deleted after application date. Change status to Withdrawn/Closed-Incomplete instead.”
  - Optionally also block delete if any `LoanStatusHistory` exists.
- Add same guard for bulk delete operations (if any).

### 2.2 Gate status transitions to “Funded”

Requirement: to prevent AC990 checksum failures and orphaned records, **do not allow status → Funded** unless all required fields are complete.

Add a validator in the status-change flow (wherever `loan.status` is updated):

Required before Funded (minimum from feedback):

- `Loan.loanParameters.selectedProgramId` (program type known)
- `Loan.loanDetails.loanType` (purpose)
- `Loan.property.propertyType`
- `Loan.property.state`
- `LoanCompensation.lienPosition`
- `Loan.qmStatus`
- `Loan.fundingMethod`
- `Loan.assignedLoanOfficer` AND LO has a valid NMLS ID
- If `Loan.isReverseMortgage === true` → require `Loan.reverseMortgageType`
- If lien is 2nd:
  - require `LoanCompensation.secondLienType`
  - if `HELOC`, require `LoanCompensation.creditLineAmount`
- If servicing disposition is required for Non-Delegated:
  - require `LoanCompensation.servicingDisposition IN ['Retained','Released']`

Response shape:

- Return 400 with:
  - `message`
  - `missingFields: [{ field, label, severity }]`

Frontend behavior:

- Show a modal listing missing fields with direct links to the appropriate tab/section.

### 2.3 Gate status transitions to “Denied/Declined”

Requirement (Reg B): when status becomes denied, capture and store denial reasons.

Implementation:

- Backend rejects denied status changes unless:
  - `denialReasons.length > 0`
  - if includes `OTHER` then `denialReasonOtherText` is non-empty
- Frontend triggers a mandatory denial reason modal on denied transition.

---

## Phase 3 — Tab 1: Application Data (AC010–AC090) Corrections

### 3.1 Implement AC030 “Approved but not Accepted”

Client definition: commitment/approval issued, borrower walks away.

Recommended implementation (most auditable):

- Add new loan status: **`Approved-Not-Accepted`**
- UI: allow lenders to set this status (with optional note)
- MCR logic:
  - AC030 counts loans where status transitioned to `Approved-Not-Accepted` **during the period**

Alternative (infer from milestones) is less reliable and harder to validate.

### 3.2 Make AC010 true carry-over (snapshot query)

Client definition: open on **the day before the period starts**.

Update calculation approach:

- AC010: `applicationDate < startDate` AND status-as-of `(startDate - 1ms)` is active pipeline
- AC020: `applicationDate` in period
- AC030/40/50/60: transitions in period (status history timestamps)
- AC070: funded in period (use `LoanCompensation.fundedDate` primarily)
- AC080: active pipeline as-of `endDate`
- AC090: checksum

Keep the balance identity as a validation:

- **Validate** \(AC010 + AC020 = AC030 + AC040 + AC050 + AC060 + AC080\)
- **Do not derive** AC010 from the identity (derivation can hide data problems).

### 3.3 “Pending state entered in period” alignment

Feedback says the input tracks everything that entered “Pending” in the period.

Define “entered pipeline” as:

- `LoanCompensation.applicationDate` being set (preferred)
- If missing, fallback to `Loan.createdAt` but flag as “needs application date” for MCR readiness.

---

## Phase 4 — Tab 2: Closed Loan Data (AC100–AC1290) Updates

### 4.1 Use `fundingMethod` (not `leadSource`) for Brokered vs Non-Delegated columns

Client feedback treats this as a funding/warehouse distinction.

Implementation:

- Replace column routing logic:
  - Brokered column: `fundingMethod === 'Brokered'`
  - Non-Delegated column: `fundingMethod === 'Non-Delegated'` (and optionally `Delegated`)
- Keep `leadSource` for marketing channel and RMLA channel section if needed.

### 4.2 Reverse mortgage subtype accuracy

Replace “string guessing” reverse mapping with:

- `Loan.reverseMortgageType` required and used to populate AC700/710/720.

### 4.3 AC990 checksum enforcement

Already validated in UI, but strengthen:

- Backend can compute and store `validationErrors` in `MCRReport` at generation time (optional).
- Add a “data completeness” list in report output:
  - loans missing required categories are listed (or at least counted).

---

## Phase 5 — Tab 4: MLO Data (Attribution) Hard Requirements

Requirement: every loan must be tied to an LO with NMLS ID.

Implementation:

- Add funding gate (Phase 2.2) enforcement.
- Ensure LO NMLS ID is present in user profile:
  - Backend validation at user creation/edit (admin flow).
- UI:
  - Display assigned LO + NMLS on loan dashboard.
  - If missing, show a blocking warning before allowing Funded.

---

## Phase 6 — Tab 5: RMLA Section II Updates

### 6.1 HELOC vs Closed-End Second logic

Requirement:

- T110 Closed-End Second: lien=2nd AND `secondLienType=ClosedEndSecond`
- T120 HELOC: lien=2nd AND `secondLienType=HELOC`, and report **credit line amount** (max limit)

Implementation:

- Add `creditLineAmount` and route amount to HELOC bucket from that field.

### 6.2 Conforming vs Jumbo logic

Already exists with `conformingLimits.js` amount-based jumbo logic.

Enhancement (optional based on client):

- County-based conforming limits require external API or county lookup.
- If not implementing, document assumption: national baseline limit per year.

### 6.3 Weighted averages correctness

Feedback notes WA LTV showing 0% is a bug symptom.

Implementation steps:

- Ensure `loan.financialCalculations.ltv` is populated; if not, compute fallback:
  - \(LTV = (loanAmount / propertyValue) \times 100\) when property value exists.
- Add readiness validation: “Funded loans missing LTV” count.
- Ensure WA formulas use numeric values and correct amount weighting.

---

## Phase 7 — Frontend UI Updates

### 7.1 Loan Details / Classification UI

Add/ensure inputs exist for:

- `fundingMethod` (required before Funded)
- Reverse subtype selection when reverse is checked
- Denial reasons modal when setting status to denied

### 7.2 Funding/Revenue UI (LoanCompensation tab)

Add/ensure inputs:

- `secondLienType` + conditional `creditLineAmount` when HELOC
- Strong required-field indicators aligned to funding gate rules

### 7.3 MCR Reports UI

- Application Data display includes AC030 now (non-zero possible).
- Validation panel:
  - Adds checks for AC030 logic consistency if needed.
  - Adds readiness indicators for missing required fields.

---

## Phase 8 — Backend Calculation + Validation Enhancements

### 8.1 Calculation changes

- Tab 1:
  - Compute AC010 directly from snapshot status at start boundary.
  - Add AC030 bucket.
  - Use `fundedDate` (LoanCompensation) for AC070 primarily.
- Tab 2:
  - Use `fundingMethod` for column splits.
  - Use `reverseMortgageType` for reverse categories.
- Tab 5:
  - Implement HELOC/credit line logic.
  - Improve LTV fallback and WA calculations.

### 8.2 Centralized validation output

Add a backend function to generate `validationErrors[]` at report generation time:

- Pipeline balance
- Dimensional totals equal AC990
- MLO totals equal funded totals
- Revenue sanity: funded count > 0 implies AC1100 > 0 (warning)
- Missing-field counts (readiness)

Store on `MCRReport.validationErrors` (already present in schema per earlier plan docs).

---

## Phase 9 — Testing Strategy

### 9.1 Unit tests (`backend/tests/mcr-calculations.test.js`)

Add fixtures covering:

- AC010 carry-over computed from status history boundaries
- AC030 classification (approved-not-accepted transition in period)
- HELOC classification uses `creditLineAmount`
- Reverse subtype routes to correct AC700/710/720
- Dimensional totals match AC990 for fully categorized funded loans
- Weighted average LTV non-zero when inputs exist

### 9.2 Integration tests (API)

- Status update endpoint:
  - Denied requires denial reasons
  - Funded requires all fields
  - Delete blocked when applicationDate exists

### 9.3 Manual QA checklist

- Create 3 applications in a quarter: 2 funded, 1 still processing → Tab 1 matches client example.
- Run report for Q1 with a loan funded in Q2 → shows as pipeline in Q1 (snapshot).
- Make one funded loan missing property type → AC990 check fails and identifies missing field.
- HELOC loan reports max credit limit, not draw.

---

## Phase 10 — Rollout Plan (Safe Deployment)

1. **Deploy schema changes** (non-breaking; defaults allowed).
2. Deploy UI to capture new fields (`fundingMethod`, denial reasons, reverse subtype, HELOC fields).
3. Deploy report calculation updates (still tolerant of legacy data; warnings only).
4. Run backfill scripts + publish “MCR readiness” screen/report.
5. Enable enforcement gates (Funded/Denied/Delete) after data cleanup window.

---

## File-by-File Worklist (Implementation Targets)

### Backend

- `backend/src/models/loan.model.js`
  - Add `fundingMethod`, `reverseMortgageType`, `denialReasons`, `denialReasonOtherText`
  - Add `Approved-Not-Accepted` status if using status-based approach
- `backend/src/models/loanCompensation.model.js`
  - Add `secondLienType`, `creditLineAmount`
- `backend/src/controllers/loan.controller.js`
  - Enforce: no-delete after applicationDate
  - Enforce: Funded gate required fields
  - Enforce: Denied gate reasons required
- `backend/src/controllers/mcr.controller.js`
  - Tab 1 fixes (AC010 snapshot, AC030)
  - Tab 2 uses `fundingMethod`
  - Tab 5 HELOC logic + weighted averages robustness
  - Optionally compute/store `validationErrors`
- `backend/tests/mcr-calculations.test.js`
  - Add new test cases per Phase 9
- `backend/scripts/*`
  - Add backfill/migration scripts for new fields

### Frontend

- Loan view / status change UI (likely `frontend/src/pages/lender/loans/[id].js` and components it uses)
  - Denial reasons modal for denied transitions
  - Funded gate blocking UI (show missing fields)
- `frontend/src/components/lender/loans/mcr/FundingRevenueTab.js`
  - Add HELOC fields (second lien type, credit line amount)
- `frontend/src/components/lender/loans/mcr/MCRDataAuditTab.js`
  - Add readiness warnings for new required fields
- `frontend/src/pages/lender/mcr-reports.js`, `frontend/src/pages/company/mcr-reports.js`
  - Update Application Data display for AC030
  - Improve validation messaging if backend provides `validationErrors`

---

## Acceptance Criteria

All client feedback items are satisfied when:

- Tab 1 includes AC030 and AC010 is true carry-over based on snapshot status.
- Tab 1 pipeline balance identity holds and violations surface as validation errors (not hidden by derived AC010).
- No hard delete is possible after application date.
- Status → Funded is blocked unless all MCR dimensions are complete (including LO NMLS ID).
- Status → Denied is blocked unless denial reasons are captured.
- Closed Loan Data columns are routed by `fundingMethod` (not marketing `leadSource`).
- Reverse mortgages are classified by required subtype.
- HELOCs are classified correctly and use credit line limit amount.
- RMLA weighted averages and buckets are correct and non-zero when data is present.
- Exports (Excel/XML) still succeed and match the report data.

