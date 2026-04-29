/**
 * Mortgage Insurance (MI) routing / Mortech-mapping helpers (backend).
 * Mirrors frontend/src/utils/miRouting.js — keep in sync when changing rules.
 *
 * Per client SOP (Mortech MI Pricing):
 *   pmiCompany   -999 = best execution  |  specific vendor id (2,8,10,17,18,19627,19629)
 *   noMI         0 = standard,  2 = LPMI,  6|12|16|17|18|20|22|25|30|35 = rate-pct hit
 *   financeMI    0 = do not finance single-premium, 1 = finance into loan amount
 *   coverageType 1 = monthly,  16 = single premium,  19622 = split premium
 */

const CONV_MORTGAGE_TYPES = new Set([
  'Conforming',
  'JUMBO',
  'Home Ready Program',
  'Home Possible Program',
  'Second Home',
]);

function toFiniteNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === 'string') return /^(true|1|yes|y|on)$/i.test(v.trim());
  return false;
}

/** True when the MI panel is in-scope (conv + LTV > 80). */
function shouldShowMiFields(mortgageType, ltv) {
  const n = toFiniteNumber(ltv);
  if (n == null || n <= 80) return false;
  return CONV_MORTGAGE_TYPES.has(String(mortgageType || ''));
}

function mapNoMiModeToValue(noMIMode) {
  const m = String(noMIMode || '').toLowerCase();
  if (m === 'lpmi') return 2;
  if (m === 'standard' || m === '' || m === 'normal') return 0;
  const match = m.match(/^rate_pct_(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const direct = parseInt(m, 10);
  return Number.isFinite(direct) ? direct : 0;
}

function mapCoverageTypeToValue(coverageType) {
  const c = String(coverageType || '').toLowerCase();
  if (c === 'monthly') return 1;
  if (c === 'single') return 16;
  if (c === 'split') return 19622;
  return 1;
}

/**
 * Parse the `miDetails` object from an inbound Mortech search body.
 * Returns null when MI is disabled / absent / not applicable, otherwise a
 * normalized `{ enabled, company, coverageType, noMIMode, financeMI }` shape.
 */
function miRoutingFromBody(body) {
  const raw = body && body.miDetails ? body.miDetails : null;
  if (!raw) return null;
  if (!toBool(raw.enabled)) return null;
  return {
    enabled: true,
    company: toFiniteNumber(raw.company) != null ? toFiniteNumber(raw.company) : -999,
    coverageType: typeof raw.coverageType === 'string' ? raw.coverageType : 'monthly',
    noMIMode: typeof raw.noMIMode === 'string' ? raw.noMIMode : 'standard',
    financeMI: toBool(raw.financeMI),
    estimatedMonthlyPremium: toFiniteNumber(raw.estimatedMonthlyPremium) || 0,
  };
}

/** Validate parsed miDetails. Mirrors the frontend's `validateMiDetails`. */
function validateMiDetails(mi, { ltv } = {}) {
  const errors = {};
  if (!mi || !mi.enabled) return { ok: true, errors };
  const n = toFiniteNumber(ltv);
  if (n == null || n <= 80) errors.enabled = 'MI is not required at this LTV.';
  if (mi.noMIMode === 'lpmi' && mi.financeMI) {
    errors.financeMI = 'LPMI is built into the rate and cannot be financed.';
  }
  if (mi.financeMI && mi.coverageType !== 'single' && mi.noMIMode !== 'lpmi') {
    errors.financeMI = 'Financed MI applies only to Single-Premium MI.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Build the Mortech overrides object for the given miDetails. */
function miMortechOverrides(mi, { ltv, mortgageType } = {}) {
  if (!mi || !mi.enabled) return {};
  if (!shouldShowMiFields(mortgageType, ltv)) return {};
  const out = {
    pmiCompany: Number(mi.company) || -999,
    noMI: mapNoMiModeToValue(mi.noMIMode),
    financeMI: mi.financeMI ? 1 : 0,
  };
  if (out.noMI === 0) {
    out.coverageType = mapCoverageTypeToValue(mi.coverageType);
  }
  return out;
}

/**
 * Mutates `mortechRequest` in-place with MI fields when applicable.
 * Returns a diagnostic block (or null) suitable for inclusion in
 * searchParams for traceability.
 */
function adjustMortechRequestForMi(mortechRequest, mi, { ltv, mortgageType } = {}) {
  if (!mi || !mi.enabled) return null;
  const overrides = miMortechOverrides(mi, { ltv, mortgageType });
  if (!overrides || Object.keys(overrides).length === 0) return null;
  if (overrides.pmiCompany !== undefined) mortechRequest.pmiCompany = overrides.pmiCompany;
  if (overrides.noMI !== undefined) mortechRequest.noMI = overrides.noMI;
  if (overrides.financeMI !== undefined) mortechRequest.financeMI = overrides.financeMI;
  if (overrides.coverageType !== undefined) mortechRequest.coverageType = overrides.coverageType;
  return {
    enabled: true,
    company: overrides.pmiCompany,
    coverageType: overrides.coverageType ?? null,
    noMI: overrides.noMI,
    financeMI: overrides.financeMI,
  };
}

module.exports = {
  CONV_MORTGAGE_TYPES,
  shouldShowMiFields,
  mapNoMiModeToValue,
  mapCoverageTypeToValue,
  miRoutingFromBody,
  validateMiDetails,
  miMortechOverrides,
  adjustMortechRequestForMi,
};
