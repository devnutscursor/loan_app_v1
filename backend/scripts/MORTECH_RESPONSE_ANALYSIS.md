# Mortech Direct API – Response Analysis

## Summary: credentials control how many rates you get

| Credentials | Same request (75024, 225k value, 150k loan, FICO 740, 30yr fixed) | Rates returned |
|-------------|-------------------------------------------------------------------|----------------|
| **LoanStar** (customerId=05lsta01) | One `<results>` | **1 rate** – The Loan Store Broker, 5.875% |
| **Travis** (customerId=travis)      | Three `<results>` | **3 rates** – Chase, 5.625% / 5.500% / 5.250% (par, +1 pt, +2 pts) |

So the **number of rates is credential/config-dependent** (vendor selection and price-point options per customer), not just the request params.

---

## Response 1: LoanStar credentials (single rate)

- **Structure:** One `<results>` block with `index="1"` and `size="1"`.
- **One rate:** One `<quote>` (vendor "The Loan Store Broker(10895)", Conf 30 Yr Fixed, 5.875%, P&I 887.31).
- **Fees:** Populated (Origination, Underwriting, Appraisal, Credit Report, Pre-paid Interest, borrower rebate -517.5).

---

## Response 2: Travis credentials (multiple rates)

- **Structure:** Three `<results>` blocks: `index="1"`, `index="2"`, `index="3"` (each `size="1"`).
- **Vendor:** All three are **Chase(273)**, same product "Conf 30 Yr Fixed", different rate/price points:

| Index | Rate  | Price (pts) | P&I    |
|-------|--------|-------------|--------|
| 1     | 5.625% | 0.000 (par) | 863.48 |
| 2     | 5.500% | 1.000       | 851.68 |
| 3     | 5.250% | 2.000       | 828.31 |

- **Fees:** Empty `<fee_list></fee_list>` in each result (no origination/underwriting breakdown in this response).
- **Profit:** `costs_and_profit` shows Margin table, total profit 2.08% / $3120; second and third results show `amt_from_borrower` (0.546% / 1.77%).

---

### XML layout (multiple rates)

```xml
<mortech>
  <header><errorNum>0</errorNum><errorDesc>Success</errorDesc></header>
  <loanDates>...</loanDates>
  <results index="1" ... product_name="Conf 30 Yr Fixed " lockTerm="30" termType="Fixed">
    <quote ... vendor_name="Chase(273)" ...>
      <quote_detail rate="5.625" price="0.000" ... piti="863.48"/>
      <fees><fee_list></fee_list></fees>
    </quote>
    <eligibility>...</eligibility>
  </results>
  <results index="2" ...>
    <quote ... vendor_name="Chase(273)" ...>
      <quote_detail rate="5.500" price="1.000" ... piti="851.68"/>
      ...
    </quote>
  </results>
  <results index="3" ...>
    <quote ... vendor_name="Chase(273)" ...>
      <quote_detail rate="5.250" price="2.000" ... piti="828.31"/>
      ...
    </quote>
  </results>
  <ineligibleReasons>...</ineligibleReasons>
</mortech>
```

- **Number of rates** = number of `<results>` elements (each has one `<quote>`).
- Our parser iterates `mortech.results` and pushes one object per `<results>` into `quotes[]`, so **multiple rates are already supported** in the loan_app backend.

---

## How to see 1 vs multiple rates

- **One rate:** Exactly one `<results ...>` in the body.
- **Multiple rates:** Multiple `<results ...>` elements (same or different products/lenders/price points, depending on customer config).

Run the script `test-mortech-direct-variations.sh` to call Mortech with different parameters and count `<results>` in each response.
