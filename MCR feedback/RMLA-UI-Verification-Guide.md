# RMLA UI Verification Guide (Operations Only)

This guide explains how to change values in the app UI so each RMLA section updates in MCR Reports.
It is written for business users/QA and focuses only on screens and fields.

---

## Before You Start (Required)

For every loan you want reflected in RMLA:

1. Open loan details page.
2. Make changes in the relevant tabs below.
3. Save changes.
4. In `Audit & Dates`, ensure required dates exist (especially closing/funded context for the report period).
5. Make sure loan is included in MCR (not excluded).
6. Re-generate/open `MCR Reports` for the same period.

If a loan is not in the selected reporting period, RMLA totals will not move.

---

## UI Areas You Will Use

- `Application > Loan Details`
- `Application > Property Information`
- `MCR > Funding / Revenue`
- `MCR > Audit & Dates`
- `Loan Details > MCR Classification` section

---

## 1) Residential First Mortgages (T010–T100)

These rows move when the loan is a standard first mortgage profile.

### T010–T080 (Gov/Conventional/Jumbo × Fixed/ARM)

Update from UI:

- `MCR > Funding / Revenue`
  - `Lien Position` (set to first-lien profile)
  - `Amortization Type` (Fixed/ARM)
- Program selection in loan workflow (loan program category determines Gov/Conventional/Jumbo behavior)
- `Application > Property Information`
  - `What type of home is this?` (residential type)
  - `Number of Units` (1–4 for this section)

### T100 (Total Residential First Mortgages)

- Auto-total of T010–T080.

---

## 2) Other Mortgages (T110–T200)

Use these combinations to test each row.

### T110 Closed-End Second Mortgages

- `MCR > Funding / Revenue`
  - `Lien Position` = second/subordinate
  - `Second Lien Type` = Closed-End Second

### T120 HELOCs

- `MCR > Funding / Revenue`
  - `Lien Position` = second/subordinate
  - `Second Lien Type` = HELOC
  - `HELOC Credit Line Amount` = set a positive value

Note: This row should follow credit line amount behavior for reporting.

### T130 Reverse Mortgages

- `Loan Details > MCR Classification`
  - `Reverse Mortgage` = checked
  - Set reverse mortgage subtype if shown
or
- `Application > Loan Details`
  - `Loan Type` = Reverse Mortgage

### T140 Construction, 1-4 Unit Residential

- `Application > Loan Details`
  - `Loan Type` = Construction
- `Application > Property Information`
  - Residential property type
  - `Number of Units` = 1 to 4

### T150 Construction, 5+ Unit Residential

- `Application > Loan Details`
  - `Loan Type` = Construction
- `Application > Property Information`
  - Residential property type
  - `Number of Units` = 5 or more

### T160 Construction, Commercial

- `Application > Loan Details`
  - `Loan Type` = Construction
- `Application > Property Information`
  - `What type of home is this?` = Commercial / Office / Retail / Industrial / Mixed-Use

### T170 Commercial Mortgage

- `Application > Loan Details`
  - `Loan Type` = non-construction
- `Application > Property Information`
  - `What type of home is this?` = Commercial / Office / Retail / Industrial / Mixed-Use

### T180 Land Contract

Set either (or both):

- `Application > Loan Details`
  - `Loan Type` = Land Contract
- `Application > Property Information`
  - `What type of home is this?` = Land Contract

### T200 Total Other Mortgages

- Auto-total of T110 through T180.

---

## 3) Origination Channel (T210–T240)

Change from `Loan Details > MCR Classification`:

- `Funding Method`
- `Source of Business`

Use these for validation:

- T210 Brokered: funding method broker profile
- T220 Closed-Retail: retail/direct profile
- T230 Closed-Correspondent: correspondent/delegated profile
- T240 Table-Funded: source/business set to table-funded profile

---

## 4) Risk Characteristics (T250–T340)

Change from `Loan Details > MCR Classification` toggles/fields and `Funding / Revenue`:

- Alt/Reduced Doc: `Documentation Type`
- Interest Only: `Interest Only` toggle
- Option ARM: `Amortization Type` = Option ARM (`Funding / Revenue`)
- Prepayment Penalty: `Prepayment Penalty` toggle
- Mortgage Insurance: `Mortgage Insurance` toggle
- Piggyback Second: `Piggyback Second` toggle

---

## 5) LTV Distribution (T370–T430)

Main UI inputs:

- `Application > Loan Details`
  - Loan amount related fields
- `Application > Property Information`
  - Property value / contract purchase price context

LTV buckets move based on loan amount versus property value profile.

### LTV Bucket Test Matrix (one value in every column)

Use this quick matrix to force at least one loan into each LTV bucket.

Recommended setup:

- Keep `Property Value` fixed at `100,000` for each test loan.
- Change loan amount per row below.
- Keep all loans in the same reporting period and included in MCR.

| RMLA Row | LTV Bucket | Example Property Value | Example Loan Amount | Expected LTV |
|---|---|---:|---:|---:|
| T370 | `<= 60%` | 100,000 | 60,000 | 60% |
| T380 | `60.01% - 70%` | 100,000 | 65,000 | 65% |
| T390 | `70.01% - 80%` | 100,000 | 75,000 | 75% |
| T400 | `80.01% - 90%` | 100,000 | 85,000 | 85% |
| T410 | `90.01% - 95%` | 100,000 | 93,000 | 93% |
| T420 | `95.01% - 100%` | 100,000 | 98,000 | 98% |
| T430 | `> 100%` | 100,000 | 110,000 | 110% |

Minimal steps per test loan:

1. Set loan amount in `Application > Loan Details`.
2. Set property value in `Application > Property Information`.
3. Save loan.
4. In `Audit & Dates`, ensure report-period eligibility and MCR inclusion.
5. Regenerate/open `MCR Reports` and verify the target bucket moved.

---

## 6) Weighted Averages & Pull-Through

### Weighted Averages

Driven by funded loans in period:

- LTV-related inputs (loan amount and property value profile)
- Coupon/rate fields (`Funding / Revenue`)
- Warehouse period (`Funding / Revenue`)

### Pull-Through Ratio

Driven by:

- Applications received in period
- Loans funded in period

Date/status context is controlled via `Audit & Dates` and loan lifecycle status.

---

## Practical QA Script (Recommended)

Use one test loan per target row:

1. Set row-specific fields (examples above).
2. Save loan.
3. Confirm dates/status in `Audit & Dates`.
4. Confirm inclusion in MCR.
5. Open `MCR Reports` for the intended period.
6. Verify only expected row moved and amount/count changed as planned.

Repeat for each row from T010 through T430 sections you want validated.

---

## Troubleshooting Checklist

If a row is not changing:

- Re-check report period and dates.
- Re-save the loan after edits.
- Confirm loan is included in MCR.
- Confirm profile conditions are mutually consistent (for example, construction vs non-construction).
- Re-open report after refresh/regeneration.

