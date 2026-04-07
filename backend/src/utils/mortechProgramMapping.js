/**
 * Aligns with loan-officer-platform PROGRAM_TERM_PRODUCT_IDS + normalizeProgramKey / parseLoanTermYears.
 * Mortech product IDs per program bucket and loan term (years).
 */

const PROGRAM_TERM_PRODUCT_IDS = {
  // Match RateCaddy mapping: use base Conf product ids only.
  // Mortech may still return related family rows (e.g. FHLMC) in the same response.
  conv: { 10: 1, 20: 3, 25: 40, 30: 4 },
  fha: { 10: 635, 20: 209, 25: 1877, 30: 23 },
  va: { 10: 636, 20: 189, 25: 1878, 30: 26 },
  jumbo: { 10: 1662, 20: 1681, 25: 2406, 30: 1307 },
  second_home: { 20: 2868, 30: 2869 },
  home_ready: { 10: 2416, 20: 2418, 30: 2420 },
  home_possible: { 10: 2440, 20: 970, 30: 971 },
};

/**
 * @param {unknown} rawTerm e.g. "30", "30 year fixed", loanProduct1 string
 * @returns {10|20|25|30}
 */
function parseLoanTermYears(rawTerm) {
  const asString = String(rawTerm ?? '')
    .toLowerCase()
    .trim();
  if (asString.includes('10')) return 10;
  if (asString.includes('20')) return 20;
  if (asString.includes('25')) return 25;
  return 30;
}

/**
 * Maps UI product category values to internal program keys.
 * @param {string} categoryRaw
 * @returns {string|undefined}
 */
function normalizeProgramKey(categoryRaw) {
  const c = categoryRaw.toLowerCase().trim();
  if (!c) return undefined;

  if (c.startsWith('conv_') || c === 'conforming' || c === 'conf' || c === 'conventional') return 'conv';
  if (c.startsWith('fha_') || c === 'fha') return 'fha';
  if (c.startsWith('va_') || c === 'va') return 'va';
  if (c.startsWith('jumbo_') || c === 'jumbo') return 'jumbo';
  if (c.startsWith('second_home_') || c.includes('second home')) return 'second_home';
  if (c.startsWith('home_ready_') || c.includes('home ready')) return 'home_ready';
  if (c.startsWith('home_possible_') || c.includes('home possible') || c.includes('home poss')) {
    return 'home_possible';
  }

  return undefined;
}

/**
 * @param {string|undefined} categoryRaw
 * @param {unknown} loanTermHint loanTerm or loanProduct1 for year resolution
 * @returns {{ productList: string|undefined, programKey: string|undefined }}
 */
function deriveProductListFromCategory(categoryRaw, loanTermHint) {
  if (typeof categoryRaw !== 'string' || categoryRaw.trim() === '') {
    return { productList: undefined, programKey: undefined };
  }
  const trimmed = categoryRaw.trim();
  const programKey = normalizeProgramKey(trimmed);
  if (!programKey) {
    return { productList: undefined, programKey: undefined };
  }
  const loanTermYears = parseLoanTermYears(loanTermHint);
  const byTerm = PROGRAM_TERM_PRODUCT_IDS[programKey]?.[loanTermYears];
  if (Array.isArray(byTerm) && byTerm.length > 0) {
    const ids = byTerm
      .filter((id) => typeof id === 'number' && Number.isFinite(id))
      .map((id) => String(id));
    if (ids.length > 0) {
      return { productList: ids.join(','), programKey };
    }
  }
  if (typeof byTerm === 'number') {
    return { productList: String(byTerm), programKey };
  }
  return { productList: undefined, programKey };
}

module.exports = {
  PROGRAM_TERM_PRODUCT_IDS,
  parseLoanTermYears,
  normalizeProgramKey,
  deriveProductListFromCategory,
};
