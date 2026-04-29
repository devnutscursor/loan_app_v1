/**
 * Mortgage Insurance (MI) routing / estimator helpers (frontend).
 * Mirrors backend/src/utils/miRouting.js — keep in sync when changing rules.
 *
 * Per client SOP (Mortech MI Pricing):
 *   pmiCompany   -999 = best execution  |  specific vendor id (2,8,10,17,18,19627,19629)
 *   noMI         0 = standard,  2 = LPMI,  6|12|16|17|18|20|22|25|30|35 = rate-pct hit
 *   financeMI    0 = do not finance single-premium, 1 = finance into loan amount
 *   coverageType 1 = monthly,  16 = single premium,  19622 = split premium
 *
 * MI is only relevant on conventional (Conforming / Jumbo / HomeReady / HomePossible)
 * loans when LTV > 80. FHA has MIP, VA has no MI, USDA has the Guaranty Fee — those
 * are handled elsewhere and the MI panel is hidden for them.
 */

// Approved MI companies per the client's MI SOP. -999 = best execution.
export const MI_COMPANY_OPTIONS = [
  { value: -999, label: 'Best Execution (recommended)' },
  { value: 19629, label: 'Arch MI Live' },
  { value: 17, label: 'Essent' },
  { value: 2, label: 'Genworth (Enact)' },
  { value: 8, label: 'MGIC' },
  { value: 18, label: 'MGIC Live Pricing' },
  { value: 19627, label: 'National MI Live' },
  { value: 10, label: 'Radian Standard' },
];

// Coverage types as the LO sees them. Backend maps to Mortech numeric codes.
export const MI_COVERAGE_OPTIONS = [
  { value: 'monthly', label: 'BPMI – Monthly' },
  { value: 'single', label: 'Single Premium' },
  { value: 'split', label: 'Split Premium' },
];

// noMI buckets exposed in the UI. "standard" = normal MI, "lpmi" = lender-paid
// single premium (MI cost is in the rate). The reduced-coverage percentages are
// advanced options used on HomeReady / HomePossible where Fannie/Freddie allow
// lower coverage levels.
export const MI_NO_MI_MODE_OPTIONS = [
  { value: 'standard', label: 'Standard MI' },
  { value: 'lpmi', label: 'LPMI (Lender-Paid)' },
  { value: 'rate_pct_25', label: 'Reduced coverage 25% (HomeReady / HomePossible)' },
  { value: 'rate_pct_18', label: 'Reduced coverage 18%' },
  { value: 'rate_pct_12', label: 'Reduced coverage 12%' },
];

/** Default miDetails sub-state — shape matches backend/src/utils/miRouting.js. */
export const MI_INITIAL = Object.freeze({
  enabled: false,
  company: -999,
  coverageType: 'monthly',
  noMIMode: 'standard',
  financeMI: false,
  estimatedMonthlyPremium: 0,
});

/** Hydrate miDetails from a persisted loan.miDetails sub-document. */
export function hydrateMiFromLoan(src) {
  const d = src || {};
  return {
    enabled: !!d.enabled,
    company: Number.isFinite(Number(d.company)) ? Number(d.company) : -999,
    coverageType: typeof d.coverageType === 'string' ? d.coverageType : 'monthly',
    noMIMode: typeof d.noMIMode === 'string' ? d.noMIMode : 'standard',
    financeMI: !!d.financeMI,
    estimatedMonthlyPremium: Number(d.estimatedMonthlyPremium) || 0,
  };
}

const CONV_MORTGAGE_TYPES = new Set([
  'Conforming',
  'JUMBO',
  'Home Ready Program',
  'Home Possible Program',
  'Second Home',
]);

/**
 * Return true when the MI panel should be visible.
 * MI applies to conventional loans (incl. HomeReady / HomePossible / Jumbo)
 * when LTV > 80. Hidden for FHA (MIP), VA (no MI), USDA (Guaranty Fee),
 * and Non-QM (investor-specific).
 */
export function shouldShowMiFields(mortgageType, ltv) {
  const ltvNum = Number(ltv);
  if (!Number.isFinite(ltvNum) || ltvNum <= 80) return false;
  return CONV_MORTGAGE_TYPES.has(String(mortgageType || ''));
}

/**
 * Very rough BPMI monthly premium estimator used for the UI-side DTI preview.
 * Mortech returns the authoritative monthlyPremium in its response — this is
 * only a "good-enough" number so the LO can see the DTI move before pricing.
 *
 * Bands approximate Fannie Mae standard BPMI for FICO ≥ 740:
 *   LTV 80.01–85 → 0.38%  /  85.01–90 → 0.52%
 *   LTV 90.01–95 → 0.78%  /  95.01–97 → 0.90%  /  > 97 → 1.10%
 *
 * FICO adjustments:
 *   < 680 → +0.35%, 680–699 → +0.20%, 700–719 → +0.10%, 720–739 → +0.05%
 */
export function estimateBpmiMonthly({ baseLoanAmount, ltv, fico }) {
  const principal = Number(baseLoanAmount);
  const ltvN = Number(ltv);
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(ltvN) || ltvN <= 80) return 0;

  let annualPct;
  if (ltvN <= 85) annualPct = 0.38;
  else if (ltvN <= 90) annualPct = 0.52;
  else if (ltvN <= 95) annualPct = 0.78;
  else if (ltvN <= 97) annualPct = 0.9;
  else annualPct = 1.1;

  const ficoN = Number(fico);
  if (Number.isFinite(ficoN) && ficoN > 0) {
    if (ficoN < 680) annualPct += 0.35;
    else if (ficoN < 700) annualPct += 0.2;
    else if (ficoN < 720) annualPct += 0.1;
    else if (ficoN < 740) annualPct += 0.05;
  }

  return ((annualPct / 100) * principal) / 12;
}

/**
 * Map the LPMI / reduced-coverage mode string to the Mortech `noMI` int value.
 * Returns 0 for "standard" (regular monthly MI).
 */
export function mapNoMiModeToValue(noMIMode) {
  const m = String(noMIMode || '').toLowerCase();
  if (m === 'lpmi') return 2;
  if (m === 'standard' || m === '' || m === 'normal') return 0;
  const match = m.match(/^rate_pct_(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const direct = parseInt(m, 10);
  return Number.isFinite(direct) ? direct : 0;
}

/** Map UI coverage token to the Mortech `coverageType` int code. */
function mapCoverageTypeToValue(coverageType) {
  const c = String(coverageType || '').toLowerCase();
  if (c === 'monthly') return 1;
  if (c === 'single') return 16;
  if (c === 'split') return 19622;
  return 1;
}

/**
 * Validate miDetails for the currently shown panel. Returns `{ ok, errors }`.
 * Most combinations are valid — this mainly catches user-toggled inconsistencies
 * (e.g. LPMI + Finance MI, which doesn't make sense).
 */
export function validateMiDetails(miDetails, ltv) {
  const errors = {};
  const d = miDetails || {};
  if (!d.enabled) return { ok: true, errors };

  const ltvN = Number(ltv);
  if (!Number.isFinite(ltvN) || ltvN <= 80) {
    errors.enabled = 'MI is not required at this LTV.';
  }
  if (d.noMIMode === 'lpmi' && d.financeMI) {
    errors.financeMI = 'LPMI is built into the rate and cannot be financed.';
  }
  if (d.financeMI && d.coverageType !== 'single' && d.noMIMode !== 'lpmi') {
    errors.financeMI = 'Financed MI applies only to Single-Premium MI.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Build the Mortech payload overrides for the current miDetails.
 *
 * Returns a flat object containing ONLY the four MI params (some of which may
 * be omitted based on mode, e.g. coverageType is omitted for LPMI / reduced
 * coverage). Callers spread this into the top-level Mortech payload.
 */
export function miMortechOverrides(miDetails, { ltv, mortgageType } = {}) {
  const d = miDetails || {};
  if (!d.enabled) return {};
  if (!shouldShowMiFields(mortgageType, ltv)) return {};

  const out = {
    pmiCompany: Number(d.company) || -999,
    noMI: mapNoMiModeToValue(d.noMIMode),
    financeMI: d.financeMI ? 1 : 0,
  };
  // Only send coverageType for standard MI (noMI = 0). LPMI and reduced-coverage
  // modes use noMI alone.
  if (out.noMI === 0) {
    out.coverageType = mapCoverageTypeToValue(d.coverageType);
  }
  return out;
}

/** Helper: pretty label for a company value. */
export function miCompanyLabel(value) {
  const row = MI_COMPANY_OPTIONS.find((r) => r.value === Number(value));
  return row ? row.label : String(value);
}
