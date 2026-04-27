# Application Tabs → MCR Testing Plan (Comprehensive)

This document is a **QA playbook** for testing **every dropdown and MCR-relevant field** under the **Application** section (Borrower Information, Loan Details, Property Information, Financial Information, Additional Information) and verifying **how each change affects Mortgage Call Report (MCR)** outputs.

It is written for **operations/QA** (what to change, where to look, what should move). It does not describe implementation code.

---

## 1) How MCR Uses Loan Data (Mental Model)

MCR reports are built from **saved loan records** plus **loan compensation** records and **status/dates** for the selected reporting period.

- **Application Data** tab: pipeline movement (applications received, denied, withdrawn, funded, ending pipeline, plugs).
- **Closed Loan Data** tab: **funded loans in period** — loan type (program), property type, **purpose** (from loan type), lien, QM, HOEPA, reverse buckets, brokered vs non-delegated columns.
- **Revenue Data** tab: fee and revenue fields from compensation (funded loans in period).
- **MLO Data** tab: funded loans grouped by assigned loan officer.
- **RMLA Section II** tab: risk profile — product mix, other mortgages, channel, risk flags, LTV buckets, weighted averages, pull-through.

**Critical rule for testing:** after changing data, **save the loan**, ensure **dates/status** qualify the loan for the report period, then **generate a new MCR report** (snapshots do not update retroactively).

---

## 2) Global Test Method (Use for Every Case)

### 2.1 One-variable discipline

For each test:

1. Use a **dedicated test loan** (or reset fields to a known baseline).
2. Change **only one** dropdown/field.
3. **Save** (Application tabs use Save when prompted).
4. Confirm **MCR inclusion** and **Audit & Dates** / **Funding / Revenue** as needed.
5. **Generate** MCR for the **same year/period** the loan’s activity falls into.
6. Record: **field changed**, **old → new value**, **which MCR tab/row moved**, **pass/fail**.

### 2.2 What “affecting MCR” means

| Symptom | Meaning |
|--------|---------|
| Row count/amount changes | Field is wired into that MCR calculation |
| No change | Field is **not** used for MCR, or loan **not in period**, **excluded**, or **not funded** for Closed Loan / RMLA funded sections |
| Application Data only | Field may affect pipeline classification indirectly via status/dates, not the dropdown itself |

### 2.3 Minimum data checklist (per test loan)

- Borrower user has a **valid email** if testing notifications (separate from MCR).
- **Loan not excluded** from MCR (`MCR Data Audit`).
- For **Closed Loan** / **RMLA funded** sections: loan **Funded/Closed** with **funded/closing date** in period; **compensation** record exists (`Funding / Revenue` / sync).
- **Program** selected if testing **Conventional / FHA / VA / FSA-RHS** closed-loan columns.

---

## 3) Tab-by-Tab: Dropdowns & MCR Impact

### 3.1 Borrower Information

**Typical content:** personal details, addresses, demographics, contact info.

**Direct MCR report impact:** usually **none** on standard NMLS tab line items (those are loan/comp/property/status driven).

**Still test:**

| Area | Why test |
|------|----------|
| Marital status, dependents, demographics | Regression: save/load, no 500s; optional indirect use in other features |
| Address / state | If any future **state-scoped** report filter is used, confirm property state remains primary for MCR (see Property tab) |

**Expected MCR:** no material change to AC/I codes solely from borrower-only fields.

---

### 3.2 Loan Details

**High MCR impact.** Dropdowns and related fields here drive **Closed Loan purpose** and **RMLA “Other Mortgages”** and **purpose** rows.

| UI control | Primary MCR effect |
|------------|-------------------|
| **Loan Type** (Purchase, Refinance, Cash-Out Refinance, Home Improvement, Construction, HELOC, Reverse Mortgage, Land Contract, …) | **Closed Loan:** AC300 Home Purchase / AC310 Home Improvement / AC320 Refinancing (purpose mapping from `loanDetails.loanType`). **RMLA:** construction / land contract / reverse branches; purpose I350/I360. |
| **Construction Type** (when Construction) | **RMLA:** construction bucket eligibility (with property + units); avoid stale construction type when loan type is no longer Construction. |
| **Refinance subtype** (if present) | Same purpose family as refinance for closed-loan purpose. |
| **MCR Classification** (same page): Funding Method, Source of Business, Documentation Type, QM Status | **RMLA:** channel I210–I240; alt-doc I270; QM buckets in **Closed Loan** AC920–AC940 when funded. |
| **Reverse Mortgage** checkbox + program subtype | **Closed Loan:** AC700–AC720, AC790; **RMLA:** reverse I130. |
| **Risk toggles** (Interest Only, HOEPA, Prepayment Penalty, Piggyback Second, MI) | **RMLA:** I280–I340; **Closed Loan:** HOEPA AC400 when applicable. |

**Test matrix (Loan Details)**

1. **Loan Type = Purchase** → Closed Loan: purpose in **Home Purchase**; RMLA purpose **Purchase** side.
2. **Loan Type = Refinance** / **Cash-Out Refinance** → **Refinancing** / refinance purpose.
3. **Loan Type = Home Improvement** → **Home Improvement** purpose.
4. **Loan Type = Construction** + property/units variants → RMLA **Other Mortgages** construction rows (I140–I160) per property + units; not “first mortgage” product rows when excluded by rules.
5. **Loan Type = HELOC** → purpose maps to **refinance** side for closed-loan purpose reporting; confirm **I120** only when **compensation** has 2nd lien + HELOC + credit line (see Funding tab).
6. **Loan Type = Reverse Mortgage** or checkbox → reverse closed-loan + RMLA I130.
7. **Loan Type = Land Contract** or property Land Contract → RMLA I180.
8. **Documentation Type** → RMLA I270 when not full doc.
9. **QM Status** → Closed Loan QM columns when funded.
10. **Funding Method / Source of Business** → RMLA channel + table-funded override behavior.

---

### 3.3 Property Information

**High MCR impact** for property-type, units, occupancy-related reporting, and LTV.

| UI control | Primary MCR effect |
|------------|-------------------|
| **Property type** (“What type of home…”) | **Closed Loan:** AC200 vs AC210 (manufactured). **RMLA:** first-mortgage eligibility (1–4 residential); commercial / mixed-use → other mortgage / construction commercial paths. |
| **Number of units** | **RMLA:** 1–4 vs 5+ construction buckets; first-mortgage vs other. |
| **Occupancy** | Often **underwriting/UI**; confirm LTV/source amounts still consistent for RMLA LTV buckets. |
| **Mixed-use / Manufactured** | Manufactured → AC210 when funded; mixed-use can push commercial-style RMLA paths when aligned with property type labels. |
| **Property value / contract price** (with loan amount) | **RMLA LTV** distribution I370–I430 when `financialCalculations.ltv` missing (fallback uses value + amount). |

**Test matrix (Property)**

1. Single Family / Condo / Townhouse / Multi-Family + units 1–4 vs 5+.
2. **Manufactured** → AC210 count.
3. **Commercial / Office / Retail / Industrial / Mixed-Use** → RMLA commercial / construction commercial as applicable.
4. **Land Contract** (as property type) → RMLA I180 with loan type/land contract rules.
5. Change **property value** with fixed loan amount → LTV bucket shift in RMLA.

---

### 3.4 Financial Information

**Indirect MCR impact** via stored **financial calculations** and loan amounts.
image.png
| UI area | Primary MCR effect |
|---------|-------------------|
| Income / assets / debts (if they drive saved **DTI/LTV** on loan) | **RMLA:** weighted LTV uses `financialCalculations.ltv` when present; DTI may appear in audit views, not always in every MCR line. |
| Any dropdown that only classifies **income type** | Usually **no** direct MCR code change; verify save still succeeds. |

**Test:** set extreme but valid LTV scenario (amount vs property value) and confirm RMLA LTV row + weighted average.

---

### 3.5 Additional Information

**Usually low direct MCR impact** (properties owned, declarations, etc.).

| UI area | Primary MCR effect |
|---------|-------------------|
| Declarations, gifts, owned properties | Mostly compliance/UI; **confirm no regression** on save. |
| Any field duplicated in **Property** or **Loan Details** | Prefer testing those under their primary tab for MCR mapping. |

---

## 4) MCR Tabs Outside Application (Must Be in Same Test Plan)

These are **not** under the Application accordion but **always** affect MCR when testing “everything”:

| Location | What to test |
|----------|--------------|
| **MCR → Audit & Dates** | Application date, denial, withdrawal, closing, funded dates → **Application Data** AC010–AC080, AC070. |
| **MCR → Funding / Revenue** | Lien position, second lien type, HELOC credit line, amortization, fees, funded date → **Closed Loan** lien AC500–AC520; **RMLA** I110–I120, I280–I340, revenue tab. |
| **MCR → MCR Data Audit** | Validation summary; exclude-from-MCR toggle. |
| **Loan Dashboard → Program** | `programType` → **Closed Loan** AC100–AC130; **RMLA** product type rows. |

---

## 5) Cross-Reference: MCR Row → Where to Set It

| MCR area | Primary UI sources |
|----------|-------------------|
| Application pipeline | Status + **Audit & Dates** + compensation application date |
| Closed: forward type AC100–AC130 | **Loan program** (dashboard) |
| Closed: property AC200/210 | **Property Information** property type |
| Closed: purpose AC300–AC320 | **Loan Details** loan type (purpose mapping) |
| Closed: lien AC500–AC520 | **Funding / Revenue** lien position |
| Closed: QM AC920–AC940 | **Loan Details** MCR Classification QM |
| RMLA first vs other mortgages | **Property** type + units + **Funding** lien + **Loan** type/construction |
| RMLA channel I210–I240 | **Loan Details** funding method + source of business |
| RMLA risk I270–I340 | **Loan Details** MCR toggles + **Funding** amortization |
| RMLA LTV I370–I430 | Loan amount paths + **property value** + `financialCalculations.ltv` |

---

## 6) Suggested Test Suite Order (Efficient)

1. **Baseline loan** — Purchase, SFR, 1 unit, 1st lien, full doc, QM, brokered, funded in period → generate MCR, export row snapshot.
2. **Loan Details** — run Loan Type matrix (section 3.2).
3. **Property** — run property type + units matrix (section 3.3).
4. **MCR Classification** — doc type, QM, toggles (section 3.2).
5. **Funding / Revenue** — lien, HELOC, amortization, dates (section 4).
6. **Financial** — LTV/DTI if used (section 3.4).
7. **Borrower + Additional** — smoke save + confirm no MCR drift (sections 3.1, 3.5).

---

## 7) Pass/Fail Log Template (Copy per Test)

```
Test ID:
Date:
User:
Loan ID / Number:
Report period (Q/Y):

Change:
  Tab:
  Field:
  From:
  To:

Save: OK / Fail
MCR regenerated: OK / Fail

Expected MCR impact:
  Tab:
  Row(s):

Actual:
Pass/Fail:
Notes / screenshots:
```

---

## 8) Known Product Nuances (Avoid False Bugs)

- **Loan Type** mixes **purpose** (Purchase, Refinance, …) with **product-style** values (HELOC, Reverse Mortgage). Purpose mapping for **Closed Loan** follows backend rules; always confirm against a **fresh** generated report.
- **HELOC in RMLA I120** requires **2nd lien + HELOC + credit line amount** in **Funding / Revenue**, not only Loan Type = HELOC.
- **First mortgage RMLA rows** only apply when lien + property + units match the “standard first mortgage” definition; otherwise amounts flow to **Other Mortgages**.

---

## 9) Completion Criteria

Testing is **complete** when:

1. Every dropdown in **Loan Details**, **Property Information**, and **MCR Classification** (on loan page) has at least one documented pass case.
2. **Funding / Revenue** lien/HELOC/amortization cases are documented.
3. **Borrower**, **Financial**, and **Additional** tabs have smoke tests with **no unexpected MCR movement** (or documented exceptions).
4. At least one **end-to-end** funded loan scenario is verified across **all five MCR tabs**.

---

*Related guides:* `MCR feedback/RMLA-UI-Verification-Guide.md`, `Email-Testing-Guide.md` (email is separate from MCR aggregation).
