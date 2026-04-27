/**
 * Solar Panel (PACE / HERO lien + Solar Lease) routing helpers (backend).
 * Mirrors frontend/src/utils/solarRouting.js — keep in sync when changing rules.
 */

const { classifyMortgageProductText } = require('./housingEventSeasoning');

const PACE_PAYOFF_VALUES = ['new_loan', 'other_funds', 'none'];

function toNum(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toBool(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'yes';
}

/**
 * Normalize a raw request body (or persisted loan.solar) into the canonical
 * solar shape used by the rule engine.
 */
function solarRoutingFromBody(body) {
  if (!body || typeof body !== 'object') return null;
  const raw = body.solar && typeof body.solar === 'object' ? body.solar : null;
  if (!raw) return null;
  return {
    hasSolar: toBool(raw.hasSolar),
    hasPaceLien: toBool(raw.hasPaceLien),
    paceLienBalance: toNum(raw.paceLienBalance),
    pacePayoff: PACE_PAYOFF_VALUES.includes(raw.pacePayoff) ? raw.pacePayoff : '',
    noteIncludesFinancedPace: toBool(raw.noteIncludesFinancedPace),
    hasLease: toBool(raw.hasLease),
    leaseAssumed: toBool(raw.leaseAssumed),
    monthlyLeasePayment: toNum(raw.monthlyLeasePayment),
  };
}

function isSolarActive(solar) {
  return !!(solar && (solar.hasSolar || solar.hasPaceLien || solar.hasLease));
}

function validateSolarDetails(solar) {
  const errors = {};
  if (!solar) return { ok: true, errors };
  if (solar.hasPaceLien) {
    if (!solar.pacePayoff) errors.pacePayoff = 'Select a payoff option.';
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

function evaluateSolarRules(solar) {
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
      blocksAgency = true;
      banners.push({
        tone: 'red',
        text:
          'Agency / Government loans require 1st lien position. ' +
          'PACE liens must be paid off for Conventional/Gov eligibility.',
      });
    } else if (payoff === 'new_loan') {
      financedPaceAmount = balance > 0 ? balance : 0;
      processorTasks.push('Request PACE assessment payoff statement and UCC-1 status.');
    } else if (payoff === 'other_funds') {
      processorTasks.push('Verify PACE payoff (funded by other sources) on CD / title.');
    }
  }

  if (solar.hasLease) {
    if (solar.leaseAssumed) {
      dtiAddBack = toNum(solar.monthlyLeasePayment);
      processorTasks.push('Request Solar Lease Agreement; verify assumability and monthly payment.');
    } else {
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

function applySolarDtiAddBack(monthlyDebts, solar) {
  const base = toNum(monthlyDebts);
  const { dtiAddBack } = evaluateSolarRules(solar);
  return base + dtiAddBack;
}

function applySolarLtvAdjustment({ baseLoanAmount, purchasePrice, solar } = {}) {
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

function filterCatalogForSolar(products, solar, rateType, loanTerm) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const { blocksAgency } = evaluateSolarRules(solar || {});
  if (!blocksAgency) return products;

  const termYr = parseInt(String(loanTerm || '').trim(), 10);
  const rateKey = String(rateType || '').toLowerCase();

  const narrowed = products.filter((p) => {
    if (classifyMortgageProductText(p && p.name ? p.name : '') !== 'nonQm') return false;
    const name = String(p && p.name ? p.name : '').toLowerCase();
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
    (p) => classifyMortgageProductText(p && p.name ? p.name : '') === 'nonQm'
  );
  return narrowed.length > 0 ? narrowed : allNonQm;
}

/**
 * Filter already-priced Mortech rate rows when RULE S1 is active.
 */
function filterRatesBySolarBlocksAgency(rates, solar) {
  if (!Array.isArray(rates)) return [];
  const { blocksAgency } = evaluateSolarRules(solar || {});
  if (!blocksAgency) return rates;
  return rates.filter((r) => {
    const label = `${(r && r.productName) || ''} ${(r && r.loanProgram) || ''}`;
    return classifyMortgageProductText(label) === 'nonQm';
  });
}

/**
 * Resolve Non-QM productIds from the Mortech catalog (used when RULE S1 is
 * active and we must restrict the `productList` sent to Mortech).
 */
async function resolveNonQmProductIds(MortechProduct) {
  if (!MortechProduct) return [];
  const rows = await MortechProduct.find({ isActive: true }, { productId: 1, name: 1, _id: 0 }).lean();
  return (rows || []).filter((p) => classifyMortgageProductText(p.name || '') === 'nonQm');
}

/**
 * Mutate a Mortech request in-place for Solar rules.
 *   - S1  → restrict productList to Non-QM only (caller must pass the resolved IDs).
 *   - S2  → replace loan_amount with effective (base + paceLienBalance),
 *           annotate with pace_payoff_financed custom fields.
 *
 * Returns a `searchParams.solar` summary block for traceability.
 */
function adjustMortechRequestForSolar(mortechRequest, solar, ctx = {}) {
  const e = evaluateSolarRules(solar || {});
  const summary = {
    blocksAgency: e.blocksAgency,
    financedPaceAmount: e.financedPaceAmount,
    dtiAddBack: e.dtiAddBack,
    processorTasks: e.processorTasks,
  };

  if (!mortechRequest || !solar || !isSolarActive(solar)) return summary;

  // Always tag custom fields so Mortech receives traceable metadata.
  mortechRequest.customFields = Object.assign({}, mortechRequest.customFields || {}, {
    paceLienExists: solar.hasPaceLien ? 1 : 0,
    paceLienPayoff: solar.pacePayoff || 'none',
    paceLienBalance: solar.hasPaceLien ? toNum(solar.paceLienBalance) : 0,
    solarLeaseAssumed: solar.hasLease && solar.leaseAssumed ? 1 : 0,
    solarLeaseMonthly:
      solar.hasLease && solar.leaseAssumed ? toNum(solar.monthlyLeasePayment) : 0,
  });

  if (e.financedPaceAmount > 0) {
    const incoming = toNum(mortechRequest.loan_amount);
    const noteIncludes = !!(solar && solar.noteIncludesFinancedPace);
    // New UI sends total note on `loan_amount` when noteIncludesFinancedPace; legacy sends first lien only.
    mortechRequest.loan_amount = noteIncludes ? incoming : incoming + e.financedPaceAmount;
    mortechRequest.loanPurposeAdjustment = 'pace_payoff_financed';
    mortechRequest.paceFinanced = 1;
    summary.effectiveLoanAmount = mortechRequest.loan_amount;
  }

  if (Array.isArray(ctx.nonQmProductIds) && e.blocksAgency && ctx.nonQmProductIds.length > 0) {
    mortechRequest.productList = ctx.nonQmProductIds.join(',');
    delete mortechRequest.loanProduct1;
    summary.productListRestricted = true;
    summary.nonQmProductCount = ctx.nonQmProductIds.length;
  }

  return summary;
}

module.exports = {
  PACE_PAYOFF_VALUES,
  solarRoutingFromBody,
  isSolarActive,
  validateSolarDetails,
  evaluateSolarRules,
  applySolarDtiAddBack,
  applySolarLtvAdjustment,
  filterCatalogForSolar,
  filterRatesBySolarBlocksAgency,
  resolveNonQmProductIds,
  adjustMortechRequestForSolar,
};
