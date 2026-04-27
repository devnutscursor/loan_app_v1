/**
 * Compensation Type (BPC / LPC) routing helpers — frontend.
 * Mirrors backend/src/utils/compensationRouting.js — keep in sync.
 *
 * Per the client's "Compensation Type SOP":
 *   Lender Paid  → compensation is baked into the Mortech price; display the
 *                  raw price. No Section A fee is added.
 *   Borrower Paid → the LO-comp is *thinned* out of the displayed price
 *                  (`finalPrice = rawPrice - lenderPaidDefaultPct`) and an
 *                  explicit origination-charge fee is added to Section A
 *                  (`fee = loanAmount * borrowerPaidFeePct / 100`).
 *                  That fee is a Prepaid Finance Charge → reduces Amount
 *                  Financed → raises APR. We compute `bpcApr` from Amount
 *                  Financed = loan − ΣPFC (points + BPC fee + qualifying fees)
 *                  via an actuarial PV solve; Mortech APR is kept as `mortechApr`.
 *
 * Defaults: thin 1.250% (editable in Broker Compensation). Section A fee is
 * fixed at 0.750% (`FIXED_BORROWER_SECTION_A_FEE_PCT`).
 */

const round3 = (n) => Number(Number(n || 0).toFixed(3));
const round2 = (n) => Number(Number(n || 0).toFixed(2));

/** Fixed borrower Section A fee per product policy (not editable in UI). */
export const FIXED_BORROWER_SECTION_A_FEE_PCT = 0.75;

/**
 * Borrower "Points" $ and % from Mortech `<quote_detail price="...">` (stored as `rate.points`).
 *
 * Mortech uses two conventions in that attribute:
 *   - **Small magnitude** (e.g. `8.000`): percent of loan amount (matches
 *     `costs_and_profit / amt_from_borrower @profit_percent` in the XML).
 *   - **Large values** (bond-style, e.g. `90.784`): treat as % of par; borrower
 *     cost uses `100 - price` as the percent of loan (same as classic
 *     `(100 − ratesheet_price) / 100 × loan` when `price` is the bond price).
 *
 * Threshold: values **> 35** use the `100 − price` rule; otherwise `price` is
 * used directly as the percent of loan (allows negatives for lender credits).
 */
export function quoteDetailPointsCostAndPct(quoteDetailPrice, loanAmount) {
  const p = Number(quoteDetailPrice);
  const la = Number(loanAmount) || 0;
  if (!Number.isFinite(p) || la <= 0) return { pct: null, dollars: 0 };
  const pct = p > 35 ? round3(100 - p) : round3(p);
  const dollars = round2((la * pct) / 100);
  return { pct, dollars };
}

/** Default compensation sub-state — shape matches backend/src/utils/compensationRouting.js. */
export const COMP_INITIAL = Object.freeze({
  lenderPaidDefaultPct: 1.25,   // "Thin" applied to the raw price when BPC
  lenderPaidDefaultAmt: 0,      // displayed dollar equivalent = loanAmount * pct/100
  borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
  bpcEqualsLpc: false,
  updatedAt: null,
});

/** Hydrate compensation sub-state from a persisted selection / loan. */
export function hydrateCompensationFromLoan(src) {
  const d = src || {};
  const lenderPaidDefaultPct =
    Number.isFinite(Number(d.lenderPaidDefaultPct))
      ? round3(d.lenderPaidDefaultPct)
      : COMP_INITIAL.lenderPaidDefaultPct;
  const lenderPaidDefaultAmt =
    Number.isFinite(Number(d.lenderPaidDefaultAmt))
      ? round2(d.lenderPaidDefaultAmt)
      : 0;
  return {
    lenderPaidDefaultPct,
    lenderPaidDefaultAmt,
    borrowerPaidFeePct: FIXED_BORROWER_SECTION_A_FEE_PCT,
    bpcEqualsLpc: false,
    updatedAt: d.updatedAt || null,
  };
}

/** Validate a compensation sub-state. Returns `{ ok, errors }`. */
export function validateCompensation(comp) {
  const errors = {};
  const c = comp || {};
  const thin = Number(c.lenderPaidDefaultPct);
  if (!Number.isFinite(thin) || thin < 0 || thin > 10) {
    errors.lenderPaidDefaultPct = 'Enter a percentage between 0.000 and 10.000.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Build the Section A PFC fee object for BPC. Amount rounded to 2 decimals.
 * `section` uses Mortech's XML label ("Origination Charges") so the row groups
 * naturally with other Origination fees in the Closing Fee Detail grid. TRID
 * still treats this as Section A (Origination Charges IS Section A).
 */
export function buildBpcSectionAFee(loanAmount, feePct) {
  const amount = round2((Number(loanAmount) || 0) * (Number(feePct) || 0) / 100);
  return {
    name: 'Borrower Paid Compensation',
    description: 'Borrower Paid Compensation',
    amount,
    section: 'Origination Charges',
    isPFC: true,
    paymentType: 'origination',
    prepaid: false,
  };
}

/** Level monthly P&I on full note amount (standard fixed amortization). */
function monthlyPI(loanAmount, annualRatePct, termYears) {
  const p = Number(loanAmount) || 0;
  const r = Number(annualRatePct) / 100 / 12;
  const n = Math.round(Number(termYears) * 12) || 360;
  if (p <= 0 || n <= 0) return 0;
  if (r <= 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** PV of N level monthly payments M at periodic rate r (r > 0). */
function pvLevelMonthly(M, r, n) {
  if (r <= 0) return M * n;
  return (M * (1 - Math.pow(1 + r, -n))) / r;
}

function isBorrowerPaidMortechFee(f) {
  const pt = String(f.paymentType || '').toLowerCase();
  if (pt.includes('paid by others')) return false;
  return true;
}

function isMortechFeePfcForApr(f) {
  return mortechFeePfcVerdict(f).include;
}

/** Mirrors backend/src/utils/compensationRouting.js — keep in sync. */
function mortechFeePfcVerdict(f) {
  if (!f) return { include: false, reason: 'null_or_empty' };
  const amt = Number(f.amount) || 0;
  if (amt <= 0) return { include: false, reason: 'non_positive_amount' };
  const desc = String(f.description || '');
  if (/borrower paid compensation/i.test(desc)) {
    return { include: false, reason: 'synthetic_bpc_row_skipped' };
  }
  if (f.isPFC === true && isBorrowerPaidMortechFee(f)) {
    return { include: true, rule: 'isPFC_flag_borrower_paid' };
  }
  if (!isBorrowerPaidMortechFee(f)) {
    return { include: false, reason: 'paid_by_others' };
  }
  const sec = String(f.section || '');
  if (sec === 'Origination Charges') {
    if (/appraisal/i.test(desc)) {
      return { include: false, reason: 'appraisal_excluded_from_origination' };
    }
    return { include: true, rule: 'origination_charges' };
  }
  if (sec === 'Prepaids' && /pre-?paid interest/i.test(desc)) {
    return { include: true, rule: 'prepaid_interest' };
  }
  return { include: false, reason: 'not_pfc_rule_section' };
}

function feeLineSnapshot(f) {
  return {
    description: String(f.description || ''),
    amount: round2(Math.abs(Number(f.amount) || 0)),
    section: String(f.section || ''),
    paymentType: String(f.paymentType || ''),
    isPFC: f.isPFC === true,
  };
}

function auditMortechFeesForBpcApr(fees) {
  const included = [];
  const excluded = [];
  if (!Array.isArray(fees)) {
    return { sum: 0, included, excluded };
  }
  let sum = 0;
  for (const f of fees) {
    const v = mortechFeePfcVerdict(f);
    const snap = feeLineSnapshot(f);
    if (v.include) {
      sum += snap.amount;
      included.push({ ...snap, rule: v.rule || 'included' });
    } else {
      excluded.push({ ...snap, reason: v.reason || 'excluded' });
    }
  }
  return { sum: round2(sum), included, excluded };
}

function sumMortechFeesPfcForApr(fees) {
  return auditMortechFeesForBpcApr(fees).sum;
}

function sumTotalPfcDollarsForBpcApr({ fees, pointsDollars, bpcSectionAFeeDollars, feesPfcSum }) {
  const pts = Math.max(0, Number(pointsDollars) || 0);
  const bpc = Math.max(0, Number(bpcSectionAFeeDollars) || 0);
  const feeSum = Number.isFinite(Number(feesPfcSum))
    ? round2(Number(feesPfcSum))
    : auditMortechFeesForBpcApr(fees).sum;
  return round2(pts + bpc + feeSum);
}

/**
 * BPC APR: find monthly rate j such that PV(j; level P&I at note rate on L) = L − ΣPFC.
 * Nominal annual APR = j × 12 × 100 (%). Falls back to Mortech APR on failure.
 */
function computeAprAfterPrepaidFinanceCharges({
  loanAmount,
  annualNoteRatePct,
  termYears,
  totalPfcDollars,
  fallbackApr,
}) {
  const L = Number(loanAmount) || 0;
  const note = Number(annualNoteRatePct);
  const yrs = Number(termYears) || 30;
  const pfc = Math.max(0, Number(totalPfcDollars) || 0);
  const fb = Number(fallbackApr);
  if (!Number.isFinite(note) || L <= 0 || note <= 0) {
    return Number.isFinite(fb) ? round3(fb) : null;
  }
  const N = Math.round(yrs * 12);
  if (N <= 0) return Number.isFinite(fb) ? round3(fb) : null;
  const M = monthlyPI(L, note, yrs);
  if (!Number.isFinite(M) || M <= 0) return Number.isFinite(fb) ? round3(fb) : null;
  if (pfc <= 0) return Number.isFinite(fb) ? round3(fb) : null;

  const AF = Math.max(0.01, L - pfc);
  const rNote = note / 100 / 12;
  const pvNote = pvLevelMonthly(M, rNote, N);
  if (Math.abs(pvNote - L) > 0.05 * L) {
    return Number.isFinite(fb) ? round3(fb) : null;
  }
  if (pvNote <= AF + 1e-2) {
    return Number.isFinite(fb) ? round3(fb) : null;
  }

  let lo = rNote;
  let hi = rNote;
  let pvHi = pvLevelMonthly(M, hi, N);
  let guard = 0;
  while (pvHi > AF && hi < 0.35 && guard < 5000) {
    hi += 0.00001;
    pvHi = pvLevelMonthly(M, hi, N);
    guard += 1;
  }
  if (pvHi > AF) {
    return Number.isFinite(fb) ? round3(fb) : null;
  }

  for (let i = 0; i < 120; i += 1) {
    const mid = (lo + hi) / 2;
    const pvMid = pvLevelMonthly(M, mid, N);
    const diff = pvMid - AF;
    if (Math.abs(diff) < 1e-4 || hi - lo < 1e-10) {
      const aprPct = mid * 12 * 100;
      if (!Number.isFinite(aprPct) || aprPct <= 0 || aprPct > 80) {
        return Number.isFinite(fb) ? round3(fb) : null;
      }
      return round3(aprPct);
    }
    if (diff > 0) lo = mid;
    else hi = mid;
  }
  const aprPct = ((lo + hi) / 2) * 12 * 100;
  if (!Number.isFinite(aprPct) || aprPct <= 0 || aprPct > 80) {
    return Number.isFinite(fb) ? round3(fb) : null;
  }
  return round3(aprPct);
}

/**
 * Core compensation math applied to a single Mortech rate row.
 *
 * When LPC is active: returns the raw price/cost/APR untouched with `isBpc=false`.
 * When BPC is active: subtracts the thin from the price, recomputes cost,
 * builds the Section A PFC fee, and recomputes `bpcApr` from ΣPFC + Amount Financed.
 *
 * Returns an enriched object that replaces the plain `{ rate, apr, pi, cost, basePrice }`
 * shape consumed by the rate cards. Display **Price** uses `100 − quote_detail@price`
 * (`points`); **Points $** still follows `quoteDetailPointsCostAndPct`. Original
 * fields remain on the spread `src` for traceability.
 */
export function applyCompensationToRate({
  rate,
  loanAmount,
  compPayer,
  compensation,
  termYears,
  includeAprAudit = false,
}) {
  const src = rate || {};
  const mortechApr = Number(src.apr);
  const sheet = Number(src.ratesheetPrice);
  const pts = Number(src.points);
  // Card "Price" = 100 − `<quote_detail price="…">` (API field `points`). If
  // `price` is absent / non-finite, fall back to `ratesheet_price` for display.
  let rawBasePrice;
  if (Number.isFinite(pts)) {
    rawBasePrice = round3(100 - pts);
  } else if (Number.isFinite(sheet) && sheet > 0) {
    rawBasePrice = round3(sheet);
  } else {
    rawBasePrice = 100;
  }
  const quotePts = quoteDetailPointsCostAndPct(pts, loanAmount);
  const rawCost = quotePts.dollars;
  const isBpc = String(compPayer || '').toLowerCase().includes('borrower');

  if (!isBpc) {
    return {
      ...src,
      rawBasePrice: round3(rawBasePrice),
      rawCost,
      basePrice: round3(rawBasePrice),
      cost: rawCost,
      finalPrice: round3(rawBasePrice),
      finalCost: rawCost,
      mortechApr: Number.isFinite(mortechApr) ? round3(mortechApr) : null,
      bpcApr: null,
      sectionAFee: null,
      compType: 'Lender Paid',
      thinPctApplied: 0,
      isBpc: false,
    };
  }

  const comp = compensation || COMP_INITIAL;
  const thinPct = round3(Number(comp.lenderPaidDefaultPct) || 0);
  const feePct = FIXED_BORROWER_SECTION_A_FEE_PCT;
  const finalPrice = round3(rawBasePrice - thinPct);
  // Points $ follow `quote_detail@price` only — BPC thinning does not change it.
  const finalCost = quotePts.dollars;
  const sectionAFee = buildBpcSectionAFee(loanAmount, feePct);
  const la = Number(loanAmount) || 0;
  const feeAudit = includeAprAudit ? auditMortechFeesForBpcApr(src.fees) : null;
  const totalPfc = sumTotalPfcDollarsForBpcApr({
    fees: src.fees,
    pointsDollars: quotePts.dollars,
    bpcSectionAFeeDollars: sectionAFee.amount,
    feesPfcSum: feeAudit ? feeAudit.sum : undefined,
  });
  const noteRate = Number(src.interestRate);
  const bpcApr = computeAprAfterPrepaidFinanceCharges({
    loanAmount: la,
    annualNoteRatePct: noteRate,
    termYears,
    totalPfcDollars: totalPfc,
    fallbackApr: mortechApr,
  });

  const out = {
    ...src,
    rawBasePrice: round3(rawBasePrice),
    rawCost,
    basePrice: finalPrice,
    cost: finalCost,
    finalPrice,
    finalCost,
    mortechApr: Number.isFinite(mortechApr) ? round3(mortechApr) : null,
    bpcApr,
    sectionAFee,
    compType: 'Borrower Paid',
    thinPctApplied: thinPct,
    feePctApplied: feePct,
    isBpc: true,
  };

  if (includeAprAudit && feeAudit) {
    const yrs = Number(termYears) || 30;
    const N = Math.round(yrs * 12) || 360;
    const M = monthlyPI(la, noteRate, yrs);
    const AF = Math.max(0.01, la - totalPfc);
    const rNote = Number.isFinite(noteRate) ? noteRate / 100 / 12 : 0;
    const pvNote = Number.isFinite(M) && M > 0 && rNote > 0 ? pvLevelMonthly(M, rNote, N) : null;
    out.aprCalculationDebug = {
      version: 1,
      loanAmount: la,
      termYears: yrs,
      amortMonths: N,
      interestRate: noteRate,
      quoteDetailPrice: Number.isFinite(pts) ? pts : null,
      quotePointsPct: quotePts.pct,
      pointsDollars: quotePts.dollars,
      sectionAFeeDollars: sectionAFee.amount,
      feesPfcSum: feeAudit.sum,
      feesPfcIncludedCount: feeAudit.included.length,
      feesPfcExcludedCount: feeAudit.excluded.length,
      feesIncluded: feeAudit.included.slice(0, 50),
      feesExcluded: feeAudit.excluded.slice(0, 50),
      totalPfcDollars: totalPfc,
      amountFinanced: round2(AF),
      levelMonthlyPI: round3(M),
      pvOfPIAtNoteRate: pvNote != null ? round2(pvNote) : null,
      mortechApr: Number.isFinite(mortechApr) ? round3(mortechApr) : null,
      bpcApr,
    };
  }

  return out;
}

/**
 * Build the compensation block persisted on `loan.pricingSelection.compensation`
 * when the LO clicks Apply on a rate card. Consumer: `applyRate()` in the
 * Products & Pricing tab.
 */
export function buildPricingSelectionCompensation({
  compPayer,
  compensation,
  rateItem,
}) {
  const comp = compensation || COMP_INITIAL;
  const isBpc = String(compPayer || '').toLowerCase().includes('borrower');
  return {
    type: isBpc ? 'Borrower Paid' : 'Lender Paid',
    lenderPaidDefaultPct: round3(comp.lenderPaidDefaultPct),
    borrowerPaidFeePct: isBpc ? FIXED_BORROWER_SECTION_A_FEE_PCT : 0,
    thinPctApplied: isBpc ? round3(rateItem?.thinPctApplied ?? comp.lenderPaidDefaultPct) : 0,
    rawPrice: rateItem?.rawBasePrice != null ? round3(rateItem.rawBasePrice) : null,
    finalPrice: rateItem?.finalPrice != null ? round3(rateItem.finalPrice) : null,
    bpcApr: rateItem?.bpcApr != null ? round3(rateItem.bpcApr) : null,
    sectionAFee: isBpc && rateItem?.sectionAFee
      ? {
          name: rateItem.sectionAFee.name,
          amount: round2(rateItem.sectionAFee.amount),
          section: rateItem.sectionAFee.section,
          isPFC: !!rateItem.sectionAFee.isPFC,
        }
      : null,
    appliedAt: new Date().toISOString(),
  };
}

/** Format helpers used by the UI. */
export const fmtPct3 = (v) => `${round3(v).toFixed(3)}%`;
export const fmtMoney2 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
