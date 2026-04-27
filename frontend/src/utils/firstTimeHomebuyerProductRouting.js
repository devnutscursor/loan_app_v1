/** HomeReady / HomePossible naming in vendor catalogs */
const FTHB_ENHANCED_PROGRAM_KEYWORDS = [
  'home ready',
  'homeready',
  'home possible',
  'home poss',
  'homepossible',
];

/**
 * Spec-aligned product bucket hints (UI / Mortech search metadata).
 * When not FTHB, returns the standard set (Affordable-only routing is handled separately in the app).
 */
export function applyFthbLogic(isFirstTimeBuyer, affordableFlag) {
  const products = ['CONV', 'FHA', 'VA', 'USDA'];
  if (!isFirstTimeBuyer) {
    return { products, note: 'Standard borrower' };
  }
  const withHrHp = [...products, 'HOMEREADY', 'HOMEPOSSIBLE'];
  if (affordableFlag) {
    return {
      products: ['HOMEREADY', 'HOMEPOSSIBLE'],
      note: 'FTHB + Affordable → Only affordable programs shown',
    };
  }
  return {
    products: withHrHp,
    note: 'First-Time Buyer benefits applied',
  };
}

function nameMatchesFthbEnhancedPrograms(name) {
  const n = String(name || '').toLowerCase();
  return FTHB_ENHANCED_PROGRAM_KEYWORDS.some((kw) => n.includes(kw));
}

/**
 * Merges HomeReady / HomePossible catalog rows into the current list (deduped by productId).
 * Used when "Conforming" would otherwise exclude these names from the mortgage-type filter.
 */
export function mergeFthbEnhancedProgramsIntoCatalog(baseProducts, fullCatalog, rateType, loanTerm) {
  if (!Array.isArray(baseProducts)) return [];
  if (!Array.isArray(fullCatalog) || fullCatalog.length === 0) return baseProducts;

  const termYr = parseInt(String(loanTerm || '').trim(), 10);
  const rateKey = String(rateType || '').toLowerCase();

  const extras = fullCatalog.filter((p) => {
    if (!nameMatchesFthbEnhancedPrograms(p?.name)) return false;
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

  const seen = new Set(baseProducts.map((p) => String(p.productId)));
  const merged = baseProducts.slice();
  for (const p of extras) {
    const id = String(p.productId);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(p);
    }
  }
  return merged;
}
