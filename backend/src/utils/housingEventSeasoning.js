/**
 * Housing-event seasoning: years since event date and eligibility by product bucket.
 * Mirrors frontend/src/utils/housingEventSeasoning.js — keep in sync when changing rules.
 */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** @typedef {'Foreclosure'|'ShortSale'|'DeedInLieu'} HousingEventType */

/**
 * @param {string|Date|undefined|null} eventDate
 * @param {Date} [asOf]
 * @returns {number|null} Fractional years, or null if date invalid / missing
 */
function housingSeasoningYears(eventDate, asOf = new Date()) {
  if (eventDate == null || eventDate === '') return null;
  const d = eventDate instanceof Date ? eventDate : new Date(eventDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = asOf.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / MS_PER_YEAR;
}

/**
 * Classify a Mortech-style product name / program string.
 * @returns {'conventional'|'government'|'nonQm'|'unknown'}
 */
function classifyMortgageProductText(text) {
  const t = String(text || '').toLowerCase();
  if (
    /\bnon[\s-]?qm\b/.test(t) ||
    /\bnon[\s-]?conf\b/.test(t) ||
    t.includes('non-qm') ||
    t.includes('non qm') ||
    t.includes('non-conf') ||
    t.includes('non conf') ||
    t.includes('nonconf') ||
    /\bdscr\b/.test(t) ||
    t.includes('non-conforming') ||
    t.includes('non conforming') ||
    t.includes('nonconforming') ||
    t.includes('non-conform') ||
    t.includes('non conform') ||
    t.includes('nonconform')
  ) {
    return 'nonQm';
  }
  if (/\bfha\b/.test(t) || /\bva\b/.test(t) || /\busda\b/.test(t)) {
    return 'government';
  }
  if (
    t.includes('conf') ||
    t.includes('jumbo') ||
    t.includes('home ready') ||
    t.includes('home poss') ||
    t.includes('conventional')
  ) {
    return 'conventional';
  }
  return 'unknown';
}

/**
 * @param {number} seasoningYears
 * @param {string} eventType
 * @param {'conventional'|'government'|'nonQm'|'unknown'} bucket
 */
function isBucketEligibleForHousingSeasoning(seasoningYears, eventType, bucket) {
  if (bucket === 'conventional' && seasoningYears < 4) return false;

  const isForeclosure = eventType === 'Foreclosure';
  const isShortSale = eventType === 'ShortSale';
  const isDeedInLieu = eventType === 'DeedInLieu';
  const minConv = isForeclosure ? 7 : 4;
  const minGov = 3;
  // Client matrix:
  // - Foreclosure: Non-QM 1-2 years (minimum 1 year)
  // - Short Sale / Deed-in-Lieu: Non-QM 0-1 year (minimum 0 years)
  const minNqm = isForeclosure ? 1 : (isShortSale || isDeedInLieu ? 0 : 1);

  if (bucket === 'conventional') return seasoningYears >= minConv;
  if (bucket === 'government') return seasoningYears >= minGov;
  if (bucket === 'nonQm') return seasoningYears >= minNqm;
  return true;
}

/**
 * @param {{ productName?: string, loanProgram?: string }} rate
 * @param {number} seasoningYears
 * @param {string} eventType
 */
function isMortechRateEligibleForHousingSeasoning(rate, seasoningYears, eventType) {
  const bucket = classifyMortgageProductText(`${rate.productName || ''} ${rate.loanProgram || ''}`);
  return isBucketEligibleForHousingSeasoning(seasoningYears, eventType, bucket);
}

/**
 * @param {{ name?: string }} product
 * @param {number} seasoningYears
 * @param {string} eventType
 */
function isCatalogProductEligibleForHousingSeasoning(product, seasoningYears, eventType) {
  const bucket = classifyMortgageProductText(product.name || '');
  return isBucketEligibleForHousingSeasoning(seasoningYears, eventType, bucket);
}

/**
 * @param {Array<{ productName?: string, loanProgram?: string }>} rates
 * @param {{ eventType?: string, eventDate?: string|Date, asOf?: Date }} ctx
 */
function filterRatesByHousingEvent(rates, ctx) {
  if (!rates || rates.length === 0) return rates || [];
  const { eventType, eventDate, asOf } = ctx || {};
  if (!eventType) return rates;
  const years = housingSeasoningYears(eventDate, asOf);
  if (years === null) return rates;
  return rates.filter((r) => isMortechRateEligibleForHousingSeasoning(r, years, eventType));
}

/**
 * @param {Array<{ name?: string }>} products
 * @param {{ eventType?: string, eventDate?: string|Date, asOf?: Date }} ctx
 */
function filterCatalogProductsByHousingSeasoning(products, ctx) {
  if (!products || products.length === 0) return products || [];
  const { eventType, eventDate, asOf } = ctx || {};
  if (!eventType) return products;
  const years = housingSeasoningYears(eventDate, asOf);
  if (years === null) return products;
  return products.filter((p) => isCatalogProductEligibleForHousingSeasoning(p, years, eventType));
}

/**
 * @param {object} body request body
 * @returns {boolean}
 */
function isHousingEventActive(body) {
  const v = body?.housingEvent;
  return v === true || v === 'true' || v === 1 || v === '1';
}

module.exports = {
  MS_PER_YEAR,
  housingSeasoningYears,
  classifyMortgageProductText,
  isBucketEligibleForHousingSeasoning,
  isMortechRateEligibleForHousingSeasoning,
  isCatalogProductEligibleForHousingSeasoning,
  filterRatesByHousingEvent,
  filterCatalogProductsByHousingSeasoning,
  isHousingEventActive,
};
