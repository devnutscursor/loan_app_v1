/**
 * Rural & USDA RD routing / eligibility helpers.
 * Mirrors backend/src/utils/ruralUsdaRouting.js — keep in sync when changing rules.
 *
 * Core rules (USDA Guaranteed):
 *  - Occupancy MUST be Primary Residence.
 *  - Borrower household income MUST be <= 115% of county AMI.
 *  - When eligible, pivot to USDA-only products, 0% down, allow LTV up to 101.01%
 *    to finance the upfront Guaranty Fee.
 */

export const USDA_AMI_CAP_FACTOR = 1.15;
export const USDA_MAX_LTV = 101.01;

/** Keywords used to identify USDA RD products in Mortech catalog names. */
const USDA_PRODUCT_KEYWORDS = [
  'usda',
  'rural',
  'fmha',
  'rural development',
  'govt rd',
];
const USDA_PRODUCT_RD_REGEX = /\brd\b/i;

export function matchesRuralUsdaProductName(name) {
  const t = String(name || '').toLowerCase();
  if (!t) return false;
  if (USDA_PRODUCT_KEYWORDS.some((kw) => t.includes(kw))) return true;
  return USDA_PRODUCT_RD_REGEX.test(t);
}

function isPrimaryResidence(occupancy) {
  return String(occupancy || '').toLowerCase().includes('primary');
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Evaluate USDA eligibility from the given inputs.
 * @param {object} args
 * @param {boolean} args.rural
 * @param {string}  args.occupancy
 * @param {number|string} args.annualIncome
 * @param {number|string} args.countyLimit  Raw county AMI (NOT the 115% cap)
 * @returns {{
 *   eligible: boolean,
 *   reasons: string[],
 *   countyLimit: (number|null),
 *   cap: (number|null),
 *   borrowerIncome: (number|null),
 *   occupancyOk: boolean,
 *   incomeOk: (boolean|null),
 *   missingInputs: string[]
 * }}
 */
export function computeUsdaEligibility({ rural, occupancy, annualIncome, countyLimit } = {}) {
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
 * Mortech payload overrides applied only when rural eligibility has passed.
 * These MUST NOT override existing borrower flags (firstTimeHomeBuyer,
 * selfEmployed, waiveEscrow, amiIlpaWaiver) — they are merged on top.
 */
export function usdaMortechOverrides() {
  return {
    ruralFlag: 1,
    productGroups: ['USDA'],
    downPayment: 0,
    includeLTVOver100: true,
  };
}

/**
 * Narrow the catalog to USDA / RD / FmHA products only, honoring the user's
 * rate type and loan term selection when possible.
 */
export function filterCatalogRuralUsdaOnly(products, rateType, loanTerm) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const termYr = parseInt(String(loanTerm || '').trim(), 10);
  const rateKey = String(rateType || '').toLowerCase();

  const usdaOnly = products.filter((p) => matchesRuralUsdaProductName(p?.name || ''));

  const narrowed = usdaOnly.filter((p) => {
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

  // If strict rate/term filter removes everything, return the full USDA set so
  // the user can still proceed (vendor naming is inconsistent).
  return narrowed.length > 0 ? narrowed : usdaOnly;
}
