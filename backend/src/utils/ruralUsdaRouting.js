/**
 * Rural & USDA RD routing / eligibility helpers (backend).
 * Mirrors frontend/src/utils/ruralUsdaRouting.js — keep in sync when changing rules.
 */

const USDA_AMI_CAP_FACTOR = 1.15;
const USDA_MAX_LTV = 101.01;

const USDA_PRODUCT_KEYWORDS = [
  'usda',
  'rural',
  'fmha',
  'rural development',
  'govt rd',
];
const USDA_PRODUCT_RD_REGEX = /\brd\b/i;

function matchesRuralUsdaProductName(name) {
  const t = String(name || '').toLowerCase();
  if (!t) return false;
  if (USDA_PRODUCT_KEYWORDS.some((kw) => t.includes(kw))) return true;
  return USDA_PRODUCT_RD_REGEX.test(t);
}

function isPrimaryResidence(occupancy) {
  if (occupancy === undefined || occupancy === null) return false;
  if (typeof occupancy === 'number') return occupancy === 0;
  return String(occupancy).toLowerCase().includes('primary');
}

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function computeUsdaEligibility({ rural, occupancy, annualIncome, countyLimit } = {}) {
  if (!rural) {
    return {
      eligible: false,
      reasons: [],
      countyLimit: null,
      cap: null,
      borrowerIncome: null,
      occupancyOk: true,
      incomeOk: null,
      missingInputs: [],
    };
  }

  const reasons = [];
  const missingInputs = [];

  const income = toFiniteNumber(annualIncome);
  const ami = toFiniteNumber(countyLimit);
  const occOk = isPrimaryResidence(occupancy);

  if (!occOk) reasons.push('USDA requires primary residence.');
  if (income == null || income <= 0) missingInputs.push('annualIncome');
  if (ami == null || ami <= 0) missingInputs.push('countyLimit');

  const cap = ami != null && ami > 0 ? ami * USDA_AMI_CAP_FACTOR : null;
  let incomeOk = null;
  if (income != null && income > 0 && cap != null) {
    incomeOk = income <= cap;
    if (!incomeOk) {
      reasons.push('Borrower income exceeds USDA RD limits (115% AMI). 0% Down lane closed.');
    }
  }

  const eligible =
    reasons.length === 0 && missingInputs.length === 0 && occOk && incomeOk === true;

  return {
    eligible,
    reasons,
    countyLimit: ami,
    cap,
    borrowerIncome: income,
    occupancyOk: occOk,
    incomeOk,
    missingInputs,
  };
}

/**
 * Convenience: extract the boolean/flag from the client payload.
 * Accepts both truthy booleans and 0/1 integers.
 */
function isRuralActive(body) {
  if (!body) return false;
  const v = body.rural;
  return v === true || v === 1 || v === '1' || v === 'true';
}

function usdaMortechOverrides() {
  return {
    ruralFlag: 1,
    productGroups: ['USDA'],
    downPayment: 0,
    includeLTVOver100: true,
  };
}

function filterRatesByRuralUsda(rates) {
  if (!Array.isArray(rates)) return [];
  return rates.filter((r) => {
    const label = `${r.productName || ''} ${r.loanProgram || ''}`.trim();
    return matchesRuralUsdaProductName(label);
  });
}

/**
 * Resolve USDA RD productIds from the MortechProduct catalog.
 * @param {import('mongoose').Model} MortechProduct
 * @returns {Promise<Array<{ productId: string, name: string }>>}
 */
async function resolveUsdaProductIds(MortechProduct) {
  if (!MortechProduct) return [];
  const rx = /rural|usda|fmha|\brd\b|govt\s*rd/i;
  const rows = await MortechProduct.find(
    { isActive: true, name: rx },
    { productId: 1, name: 1, _id: 0 }
  ).lean();
  return rows || [];
}

module.exports = {
  USDA_AMI_CAP_FACTOR,
  USDA_MAX_LTV,
  matchesRuralUsdaProductName,
  computeUsdaEligibility,
  isRuralActive,
  usdaMortechOverrides,
  filterRatesByRuralUsda,
  resolveUsdaProductIds,
};
