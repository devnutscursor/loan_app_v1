## MCR Feedback Implementation TODO

This document is a **developer checklist** to fully implement the requirements from:

- `MCR feedback/ApplicationData MCR feedback.txt`
- `MCR feedback/closedLoan feedback.txt`
- `MCR feedback/dataMapping MCR feedback.txt`
- `MCR feedback/RMLA Tab feedback.txt`
- `MCR feedback/MLO Tab Feedback.txt`
- `MCR_FEEDBACK_IMPLEMENTATION_PLAN.md`

It is scoped to the **current codebase** (backend Node/Express + Mongo + Next.js frontend).

---

## 1. Application Pipeline (Tab 1: AC010–AC090)

### 1.1 AC030 “Approved but not Accepted”

- **Status & model**
  - **DONE**: `Approved-Not-Accepted` status exists in `Loan` (`loan.model.js`).
- **MCR calculation**
  - **DONE**: `calculateApplicationData` in `mcr.controller.js` has an AC030 bucket.
- **UI**
  - **TODO**: Ensure lender UI allows selecting `Approved-Not-Accepted` in all status-change paths:
    - `frontend/src/pages/lender/loans/[id].js` (status dropdown / status change modal).

### 1.2 True carry-over AC010 (snapshot logic)

Feedback: AC010 must be **“open on day before period start”**, not derived.

- **Current behavior**
  - `calculateApplicationData` derives AC010 from identity:
    - Start = End + exits − received.
- **Required change (TODO)**
  - Update `calculateApplicationData` in `backend/src/controllers/mcr.controller.js`:
    - Use **status history** from `LoanStatusHistory` to compute AC010 directly:
      - As-of `startDate - 1ms`, include loans that are in an **active pipeline status**.
    - Keep the balance check as a **validation**, not as the source of AC010.
  - Add unit tests in `backend/tests/mcr-calculations.test.js` to verify:
    - Loans created before the quarter and still active are counted in AC010.
    - Identity \(AC010 + AC020 = AC030 + AC040 + AC050 + AC060 + AC080\) holds and surfaces as a validation error when broken.

### 1.3 “No delete after application date”

Feedback: Once a loan has an **application date**, it must not be hard-deleted.

- **Current behavior**
  - No delete-guard found in `backend/src/controllers/loan.controller.js` (only document removal, S3 cleanup, etc.).
- **TODO — backend**
  - In any endpoint that deletes a `Loan`:
    - Before `Loan.deleteOne` / `findByIdAndDelete`:
      - Look up `LoanCompensation` by `loanId`.
      - If `applicationDate` is set, **block delete** with HTTP 400:
        - `"Loans cannot be deleted after application date. Change status to Withdrawn or Closed-Incomplete instead."`
      - Optionally also block if any `LoanStatusHistory` exists for that loan.
- **TODO — frontend**
  - On delete attempt in lender UI:
    - Surface backend error message clearly in modals / toasts.

### 1.4 Status-change workflow guards (Denied / Withdrawn / Closed-Incomplete)

- **Denied / Declined**
  - **DONE (backend)**: `loan.controller.js` enforces:
    - `status === 'Declined'` requires `denialReasons` and, if `Other` present, `denialReasonOtherText`.
    - Saves `loan.denialReasons` and `loan.denialReasonOtherText`.
  - **TODO (frontend)**
    - In `frontend/src/pages/lender/loans/[id].js`:
      - Show **mandatory denial-reasons modal** when setting status to Declined:
        - Multi-select standard reasons + free-text box for “Other”.
      - Pass `denialReasons` and `denialReasonOtherText` to the status-update API.

---

## 2. Closed Loan Data (Tab 2: AC100–AC1290)

### 2.1 Funding Method router (Brokered vs Non-Delegated)

- **Current implementation**
  - `Loan.fundingMethod` exists and is used in:
    - `calculateClosedLoanData` (Tab 2) to decide `brokered` vs `nonDelegated`.
    - `calculateRMLAData` (Tab 5) channel section.
- **TODO**
  - Confirm **UI field** for `fundingMethod` exists and is required:
    - If missing, add a `fundingMethod` dropdown on the loan classification UI:
      - Where: `frontend/src/pages/lender/loans/[id].js` (loan-level details).
      - Options: `Brokered`, `Non-Delegated`, `Delegated`, `Unknown`.
    - Use this value in any internal logic instead of overloading `leadSource`.

### 2.2 Reverse mortgage subtype enforcement

- **Current implementation**
  - `Loan.isReverseMortgage` and `Loan.reverseMortgageType` exist.
  - Tab 2 uses `reverseMortgageType` to route to AC700/AC710/AC720.
- **TODO**
  - In the loan UI:
    - When `isReverseMortgage` is `true` or loan type is `Reverse Mortgage`:
      - Require `reverseMortgageType` dropdown selection.
    - File: `frontend/src/pages/lender/loans/[id].js`.
  - Optionally: Add a **validation warning** in `MCRDataAuditTab` for funded reverse loans missing subtype.

### 2.3 AC990 checksum validation surfacing

Feedback: AC990 must match AC190/AC290/AC390/AC590 and expose issues, not silently hide them.

- **Current behavior**
  - Tab 2 (`calculateClosedLoanData`) builds all section totals; checks are implicit, not surfaced.
- **TODO — backend**
  - In `mcr.controller.js` after computing **applicationData / closedLoanData / rmlaData**:
    - Build a `validationErrors[]` array on the `MCRReport` document:
      - Add error entries when **AC990** total amount differs from:
        - AC190, AC290, AC390, AC590, AC790, AC1290.
  - Extend `MCRReport` model (if needed) to ensure `validationErrors` is persisted.
- **TODO — frontend**
  - In `frontend/src/components/mcr/MCRValidationPanel.js`:
    - Display these validation errors clearly for the user.

---

## 3. Revenue & Compensation (Tab 3)

Most revenue fields already exist in `LoanCompensation` and are surfaced in `FundingRevenueTab.js`.

- **TODO**
  - Ensure **gross revenue math** in MCR Tab 3 matches the UI calculation:
    - Cross-check `calculateRevenueData` in `mcr.controller.js` with the formula used in `FundingRevenueTab.js`.
  - Add tests in `backend/tests/mcr-calculations.test.js` to verify:
    - AC1010–AC1100 roll up correctly from fixtures.

---

## 4. MLO Attribution (Tab 4)

Feedback: Every funded loan must be tied to an LO with NMLS ID.

- **Current implementation**
  - `calculateMLOData` uses `assignedLoanOfficer` or a fallback LO and includes `nmlsId`.
- **TODO — data requirements**
  - Enforce that for loans reaching **Funded**:
    - `loan.assignedLoanOfficer` exists.
    - That user has a non-empty `nmls` / `nmlsId`.
- **TODO — backend**
  - In the **status-update** path in `backend/src/controllers/loan.controller.js`:
    - When `status` is changing to `Funded`:
      - Fetch `assignedLoanOfficer` and check for valid `nmls`/`nmlsId`.
      - If missing, return 400 with a clear `missingFields` payload.
- **TODO — frontend**
  - In loan detail page (`frontend/src/pages/lender/loans/[id].js`):
    - Show “Assigned LO: Name — NMLS” in the header (read-only).
    - If backend returns a “missing LO NMLS” error when trying to fund:
      - Show a blocking modal describing the issue and how to fix it (admin/user profile update).

---

## 5. RMLA Section II (Tab 5)

### 5.1 HELOC vs Closed-End Second & credit line amount

Feedback: HELOCs must report the **maximum credit limit**, not the drawn amount.

- **Current implementation**
  - `LoanCompensation` has:
    - `lienPosition`, `secondLienType`, `creditLineAmount`.
  - `calculateRMLAData` uses `lienPosition` and `isPiggybackSecond` but does **not** yet use `secondLienType` / `creditLineAmount` for HELOC-specific buckets.
- **TODO — backend**
  - Update `calculateRMLAData` to:
    - Distinguish:
      - `ClosedEndSecond` vs `HELOC` when `lienPosition === '2nd'`.
    - For HELOC-related volume:
      - Use `creditLineAmount` instead of `getLoanAmount(loan)` for the relevant RMLA bucket(s).
  - Add tests in `backend/tests/mcr-calculations.test.js`:
    - HELOC loan is classified using `creditLineAmount`.

- **TODO — frontend**
  - `FundingRevenueTab.js` already exposes:
    - `secondLienType`, `creditLineAmount`.
  - Ensure UX clearly indicates:
    - `creditLineAmount` is **required** when `secondLienType === 'HELOC'` (show error / highlight).

### 5.2 Weighted-average LTV fallback & correctness

Feedback: WA LTV should never be 0% when LTVs exist; compute fallback where needed.

- **Current implementation**
  - `calculateRMLAData` uses `loan.financialCalculations.ltv` and weights by **loan amount**.
  - It does **not** compute LTV if that field is missing.
- **TODO — backend**
  - In `calculateRMLAData`:
    - Before using `ltv`, if `financialCalculations.ltv` is null/0 but:
      - `loanAmount` and `property.propertyValue` exist, compute:
        - \(LTV = (loanAmount / propertyValue) \times 100\).
    - Store this computed value only for the calculation (do not mutate the DB here).
  - Add validation output to `MCRReport.validationErrors`:
    - Count of funded loans missing any LTV input (no stored LTV and no property value).
- **TODO — tests**
  - Add unit tests to ensure:
    - WA LTV is non-zero when input loans have valid LTV or derivable data.

### 5.3 Origination channel mapping

Feedback: RMLA uses origination channel (Brokered vs Retail vs Correspondent vs Table-Funded).

- **Current implementation**
  - `calculateRMLAData` channel:
    - Uses `fundingMethod` → `brokered / closedRetail / closedCorrespondent`.
    - Overrides to `tableFunded` when `loan.leadSource === 'Table-Funded'`.
- **TODO**
  - Confirm this mapping with the client; if needed:
    - Introduce a dedicated `originationChannel` field separate from `leadSource`.
    - Update `frontend/src/pages/lender/loans/[id].js` and `Loan` model accordingly.

---

## 6. Workflow Gates Before Status → Funded

Feedback: You must **block status changes to Funded** until all required MCR dimensions are complete.

### 6.1 Backend gate (core of “no dirty data”)

**File:** `backend/src/controllers/loan.controller.js`

- **TODO**
  - In the main status-update handler:
    - When `status` is changing to `Funded`:
      - Load the `Loan` and related `LoanCompensation`.
      - Build a `missingFields` array if any of these are missing:
        - Program / product:
          - `loan.loanParameters.selectedProgramId`
        - Purpose:
          - `loan.loanDetails.loanType`
        - Property:
          - `loan.property.propertyType`
          - `loan.property.state`
        - Lien:
          - `comp.lienPosition`
        - QM & risk:
          - `loan.qmStatus`
        - Channel:
          - `loan.fundingMethod`
        - LO:
          - `loan.assignedLoanOfficer` and `assignedLoanOfficer.nmls` / `nmlsId`
        - Reverse mortgage subtype:
          - If `loan.isReverseMortgage === true`, require `loan.reverseMortgageType`.
        - Second-lien & HELOC:
          - If lien is 2nd: `comp.secondLienType`.
          - If `secondLienType === 'HELOC'`: `comp.creditLineAmount`.
        - Servicing (Non-Delegated):
          - If `fundingMethod === 'Non-Delegated'`: `comp.servicingDisposition` must be `Retained` or `Released`.
      - If `missingFields.length > 0`, return HTTP 400 with:
        - `{ message: 'Cannot set status to Funded — missing required MCR fields.', missingFields }`.

### 6.2 Frontend handling

**File:** `frontend/src/pages/lender/loans/[id].js`

- **TODO**
  - When status update to Funded fails with 400 and includes `missingFields`:
    - Show a modal:
      - Title: “Complete Required MCR Fields Before Funding”.
      - List each missing field with friendly label and link to the correct tab:
        - Example: “Property Type → click to open Property tab”.
  - Optionally add a “MCR Readiness” widget that mirrors `MCRDataAuditTab` at the loan level.

---

## 7. Testing & QA

### 7.1 Unit tests

- **File:** `backend/tests/mcr-calculations.test.js`
- **TODO**
  - Add / extend tests for:
    - AC010 snapshot carry-over using `LoanStatusHistory`.
    - AC030 classification (Approved-Not-Accepted transition in period).
    - HELOC classification uses `creditLineAmount`.
    - Reverse subtype routes to correct AC700/710/720.
    - Dimensional totals (AC190, AC290, AC390, AC590) match AC990.
    - Weighted average LTV is non-zero when inputs or derivable values exist.

### 7.2 API integration tests

- **TODO**
  - Status update endpoint:
    - Denied requires denial reasons.
    - Funded gate blocks missing required fields and returns `missingFields`.
  - Loan delete endpoints:
    - Block delete after `applicationDate` is set.

### 7.3 Manual QA scenarios

- **TODO**
  - Replicate client examples:
    - 3 apps in period, 2 funded, 1 still processing → Tab 1 matches example.
    - Prior-quarter pipeline carry-over behavior correct for AC010.
    - HELOC loan reports credit line, not drawn amount, in RMLA.
    - Reverse mortgage loans require subtype and map correctly.
    - Weighted-average LTV and pull-through ratios look correct for test data.

---

## 8. Rollout Sequence (Recommended)

1. **Backend schema & calculation updates**
   - `Loan`, `LoanCompensation`, MCR calculation helpers.
2. **Frontend fields & modals**
   - Funding method, denial reasons, reverse subtype, HELOC credit line, readiness UI.
3. **Workflow gates**
   - Enable delete / funded / denied guards in `loan.controller.js`.
4. **Validation surfacing**
   - MCR validation panel showing AC990 / LTV / readiness issues.
5. **Testing & data cleanup**
   - Run test fixtures, manual QA, and any backfill scripts (e.g., `backend/scripts/mcr-backfill.js`).

