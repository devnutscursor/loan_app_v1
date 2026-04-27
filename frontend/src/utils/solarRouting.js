/**
 * Solar Panel (PACE / HERO lien + Solar Lease) routing helpers.
 * Mirrors backend/src/utils/solarRouting.js — keep in sync when changing rules.
 *
 * Core rules (summary):
 *   S1 — PACE lien = Yes AND payoff = "none"      → Agency/Gov ineligible; Non-QM only.
 *   S2 — PACE lien = Yes AND payoff = "new_loan"  → effectiveLoanAmount += paceLienBalance (LTV bumps).
 *   S3 — PACE lien = Yes AND payoff = "other_funds" → no LTV/DTI impact.
 *   S4 — Lease = Yes AND assumed = true           → DTI add-back = monthlyLeasePayment.
 *   S5 — Lease = Yes AND assumed = false          → yellow note, no DTI impact.
 */

import { classifyMortgageProductText } from './housingEventSeasoning';

export const SOLAR_INITIAL = {
  hasSolar: false,
  hasPaceLien: false,
  paceLienBalance: '',
  pacePayoff: '', // "new_loan" | "other_funds" | "none" | ""
  /** True after Continue when PACE is financed into the note — `form.baseLoanAmount` is total note. */
  noteIncludesFinancedPace: false,
  hasLease: false,
  leaseAssumed: false,
  monthlyLeasePayment: '',
};

export const PACE_PAYOFF_OPTIONS = [
  { value: 'new_loan', label: 'Yes, paid off with new loan' },
  { value: 'other_funds', label: 'Yes, paid off with other funds' },
  { value: 'none', label: 'No, lien will remain' },
];

function toNum(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isSolarActive(solar) {
  return !!(solar && (solar.hasSolar || solar.hasPaceLien || solar.hasLease));
}

/**
 * Hydrate form.solarDetails from a persisted loan.solar document.
 * Returns a normalized object that always matches SOLAR_INITIAL shape.
 */
export function hydrateSolarFromLoan(loanSolar) {
  if (!loanSolar || typeof loanSolar !== 'object') return { ...SOLAR_INITIAL };
  return {
    ...SOLAR_INITIAL,
    hasSolar: !!loanSolar.hasSolar,
    hasPaceLien: !!loanSolar.hasPaceLien,
    paceLienBalance:
      loanSolar.paceLienBalance != null && loanSolar.paceLienBalance !== ''
        ? String(loanSolar.paceLienBalance)
        : '',
    pacePayoff: loanSolar.pacePayoff || '',
    noteIncludesFinancedPace: !!loanSolar.noteIncludesFinancedPace,
    hasLease: !!loanSolar.hasLease,
    leaseAssumed: !!loanSolar.leaseAssumed,
    monthlyLeasePayment:
      loanSolar.monthlyLeasePayment != null && loanSolar.monthlyLeasePayment !== ''
        ? String(loanSolar.monthlyLeasePayment)
        : '',
  };
}

/**
 * Validate the modal inputs. Returns { ok: boolean, errors: { field: message } }.
 */
export function validateSolarDetails(solar) {
  const errors = {};
  if (!solar) return { ok: true, errors };

  if (solar.hasPaceLien) {
    if (!solar.pacePayoff) {
      errors.pacePayoff = 'Select a payoff option.';
    }
    if (toNum(solar.paceLienBalance) <= 0) {
      errors.paceLienBalance = 'Enter the PACE lien balance.';
    }
  }

  if (solar.hasLease && solar.leaseAssumed) {
    if (toNum(solar.monthlyLeasePayment) <= 0) {
      errors.monthlyLeasePayment = 'Enter the assumed monthly lease payment.';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Evaluate all the solar rules against the current solar state.
 * Returns the routing summary used by UI + backend.
 */
export function evaluateSolarRules(solar) {
  const banners = [];
  const processorTasks = [];
  let blocksAgency = false;
  let financedPaceAmount = 0;
  let dtiAddBack = 0;

  if (!isSolarActive(solar)) {
    return { blocksAgency, financedPaceAmount, dtiAddBack, banners, processorTasks };
  }

  if (solar.hasPaceLien) {
    const payoff = solar.pacePayoff || '';
    const balance = toNum(solar.paceLienBalance);

    if (payoff === 'none') {
      blocksAgency = true; // RULE S1
      banners.push({
        tone: 'red',
        text:
          'Agency / Government loans require 1st lien position. ' +
          'PACE liens must be paid off for Conventional/Gov eligibility.',
      });
    } else if (payoff === 'new_loan') {
      financedPaceAmount = balance > 0 ? balance : 0; // RULE S2
      if (financedPaceAmount > 0) {
        banners.push({
          tone: 'blue',
          text:
            `PACE payoff of $${financedPaceAmount.toLocaleString('en-US')} will be financed into the new loan; ` +
            `LTV recomputed on the effective loan amount.`,
        });
      }
      processorTasks.push('Request PACE assessment payoff statement and UCC-1 status.');
    } else if (payoff === 'other_funds') {
      // RULE S3 — no impact; still queue processor task for title/UCC verification.
      processorTasks.push('Verify PACE payoff (funded by other sources) on CD / title.');
    }
  }

  if (solar.hasLease) {
    if (solar.leaseAssumed) {
      // RULE S4 — DTI add-back for assumed solar lease payment.
      dtiAddBack = toNum(solar.monthlyLeasePayment);
      if (dtiAddBack > 0) {
        banners.push({
          tone: 'blue',
          text:
            `Assumed solar-lease payment of $${dtiAddBack.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/mo added to DTI.`,
        });
      }
      processorTasks.push('Request Solar Lease Agreement; verify assumability and monthly payment.');
    } else {
      // RULE S5 — seller must terminate / remove panels.
      banners.push({
        tone: 'yellow',
        text:
          'Seller must terminate or move the solar panels; verify via contract before closing.',
      });
      processorTasks.push('Verify solar-panel lease termination / removal per purchase contract.');
    }
  }

  return { blocksAgency, financedPaceAmount, dtiAddBack, banners, processorTasks };
}

/** Apply S4 DTI add-back to existing monthlyDebts. */
export function applySolarDtiAddBack(monthlyDebts, solar) {
  const base = toNum(monthlyDebts);
  const { dtiAddBack } = evaluateSolarRules(solar);
  return base + dtiAddBack;
}

/**
 * Apply S2 LTV adjustment for financed PACE payoff.
 * When `noteIncludesFinancedPace`, `baseLoanAmount` is already the total note (first lien + PACE).
 * Otherwise it is first-lien only and effective = base + financedPaceAmount.
 *
 * @returns { effectiveLoanAmount, effectiveLtv, baseFirstLienAmount, baseLtv, adjusted: boolean }
 */
export function applySolarLtvAdjustment({ baseLoanAmount, purchasePrice, solar } = {}) {
  const entered = toNum(baseLoanAmount);
  const val = toNum(purchasePrice);
  const { financedPaceAmount } = evaluateSolarRules(solar || {});
  if (financedPaceAmount <= 0) {
    const ltv = val > 0 ? (entered / val) * 100 : 0;
    return {
      effectiveLoanAmount: entered,
      effectiveLtv: ltv,
      baseFirstLienAmount: entered,
      baseLtv: ltv,
      adjusted: false,
    };
  }
  const noteIncludes = !!(solar && solar.noteIncludesFinancedPace);
  const effectiveLoanAmount = noteIncludes ? entered : entered + financedPaceAmount;
  const baseFirstLienAmount = Math.max(0, effectiveLoanAmount - financedPaceAmount);
  const effectiveLtv = val > 0 ? (effectiveLoanAmount / val) * 100 : 0;
  const baseLtv = val > 0 ? (baseFirstLienAmount / val) * 100 : 0;
  return {
    effectiveLoanAmount,
    effectiveLtv,
    baseFirstLienAmount,
    baseLtv,
    adjusted: true,
  };
}

/**
 * Filter the catalog when RULE S1 is active: hide Conv/FHA/VA/USDA — keep Non-QM only.
 * Honors the user's rateType / loanTerm selection (same pattern as other filters).
 */
export function filterCatalogForSolar(products, solar, rateType, loanTerm) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const { blocksAgency } = evaluateSolarRules(solar || {});
  if (!blocksAgency) return products;

  const termYr = parseInt(String(loanTerm || '').trim(), 10);
  const rateKey = String(rateType || '').toLowerCase();

  const narrowed = products.filter((p) => {
    if (classifyMortgageProductText(p?.name || '') !== 'nonQm') return false;
    const name = String(p?.name || '').toLowerCase();
    if (rateKey && !name.includes(rateKey)) return false;
    if (Number.isFinite(termYr) && termYr > 0) {
      const termOk =
        name.includes(`${termYr} yr`) ||
        name.includes(`${termYr} year`) ||
        name.includes(`${termYr}yr`) ||
        name.includes(`${termYr}year`);
      if (!termOk) return false;
    }
    return true;
  });

  const allNonQm = products.filter(
    (p) => classifyMortgageProductText(p?.name || '') === 'nonQm'
  );
  return narrowed.length > 0 ? narrowed : allNonQm;
}

/**
 * Mortech payload additions for solar. Always returns a flat object; callers
 * should spread it on top of existing payloads. Existing flags (selfEmployed,
 * firstTimeHomeBuyer, waiveEscrow, amiIlpaWaiver, ruralFlag) MUST stay intact.
 */
export function solarMortechOverrides(solar, { baseLoanAmount } = {}) {
  if (!isSolarActive(solar)) return {};
  const e = evaluateSolarRules(solar);
  const payload = {
    paceLienExists: solar.hasPaceLien ? 1 : 0,
    paceLienPayoff: solar.pacePayoff || 'none',
    paceLienBalance: solar.hasPaceLien ? toNum(solar.paceLienBalance) : 0,
    solarLeaseAssumed: solar.hasLease && solar.leaseAssumed ? 1 : 0,
    solarLeaseMonthly: solar.hasLease && solar.leaseAssumed ? toNum(solar.monthlyLeasePayment) : 0,
    solarBlocksAgency: e.blocksAgency ? 1 : 0,
  };

  if (e.financedPaceAmount > 0) {
    const entered = toNum(baseLoanAmount);
    const noteIncludes = !!(solar && solar.noteIncludesFinancedPace);
    const totalNote = noteIncludes ? entered : entered + e.financedPaceAmount;
    payload.loan_amount = totalNote;
    payload.loanPurposeAdjustment = 'pace_payoff_financed';
    payload.paceFinanced = 1;
  }

  return payload;
}
