/**
 * Bankruptcy seasoning and hard-stop rules for Mortech products.
 * Mirrors frontend/src/utils/bankruptcySeasoning.js — keep in sync when changing rules.
 */

const { classifyMortgageProductText } = require('./housingEventSeasoning');

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function bankruptcyDischargeSeasoningYears(dischargeDate, asOf = new Date()) {
  if (dischargeDate == null || dischargeDate === '') return null;
  const d = dischargeDate instanceof Date ? dischargeDate : new Date(dischargeDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = asOf.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / MS_PER_YEAR;
}

function normalizeStatus(status) {
  return String(status || '').trim();
}

function isBankruptcyHardStopStatus(status) {
  const s = normalizeStatus(status).toLowerCase();
  return s === 'open' || s === 'pending';
}

function parseBankruptcyCount(raw) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function normalizeChapter(chapter) {
  const ch = String(chapter || '').toLowerCase().replace(/\s+/g, '');
  if (ch === 'chapter7' || ch === '7' || ch === 'ch7') return 'Chapter7';
  if (ch === 'chapter13' || ch === '13' || ch === 'ch13') return 'Chapter13';
  return '';
}

/**
 * @param {'Chapter7'|'Chapter13'|string} chapter
 * @param {number} bkCount
 * @returns {{ minConv: number, minGov: number, nonQm: 'always'|'gtZero'|'gt2' } | null}
 */
function getBankruptcyThresholds(chapter, bkCount) {
  const ch = normalizeChapter(chapter);
  const mult = bkCount > 1;

  let minConv;
  let minGov;
  /** @type {'always'|'gtZero'|'gt2'} */
  let nonQm;

  if (ch === 'Chapter7') {
    minConv = 4;
    minGov = 2;
    nonQm = 'gtZero';
  } else if (ch === 'Chapter13') {
    minConv = 2;
    minGov = 1;
    nonQm = 'always';
  } else {
    return null;
  }

  if (mult) {
    minConv = Math.max(minConv, 5);
    minGov = Math.max(minGov, 3);
    nonQm = 'gt2';
  }

  return { minConv, minGov, nonQm };
}

function isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx) {
  const { bankruptcyStatus, bankruptcyChapter, bankruptcyCount } = ctx;
  const status = normalizeStatus(bankruptcyStatus);

  if (isBankruptcyHardStopStatus(status)) {
    if (bucket === 'conventional' || bucket === 'government') return false;
    return true;
  }

  if (status !== 'Discharged' && status !== 'Dismissed') {
    return true;
  }

  const bkCount = parseBankruptcyCount(bankruptcyCount);
  const thresholds = getBankruptcyThresholds(bankruptcyChapter, bkCount);
  if (!thresholds) return true;

  if (seasoningYears === null) return true;

  const { minConv, minGov, nonQm } = thresholds;
  const dismissedOverrideConvMin = status === 'Dismissed' ? 4 : 0;

  if (bucket === 'conventional') return seasoningYears >= Math.max(minConv, dismissedOverrideConvMin);
  if (bucket === 'government') return seasoningYears >= minGov;
  if (bucket === 'nonQm') {
    if (nonQm === 'always') return true;
    if (nonQm === 'gtZero') return seasoningYears > 0;
    if (nonQm === 'gt2') return seasoningYears > 2;
  }
  return true;
}

function isMortechRateEligibleForBankruptcy(rate, ctx, seasoningYears) {
  const bucket = classifyMortgageProductText(`${rate.productName || ''} ${rate.loanProgram || ''}`);
  return isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx);
}

function isCatalogProductEligibleForBankruptcy(product, ctx, seasoningYears) {
  const bucket = classifyMortgageProductText(product.name || '');
  return isBucketEligibleForBankruptcy(bucket, seasoningYears, ctx);
}

function filterRatesByBankruptcy(rates, ctx) {
  if (!rates || rates.length === 0) return rates || [];
  if (!ctx || !ctx.bankruptcy) return rates;

  const seasoningYears = bankruptcyDischargeSeasoningYears(ctx.bankruptcyDischargeDate, ctx.asOf);

  return rates.filter((r) => isMortechRateEligibleForBankruptcy(r, ctx, seasoningYears));
}

function filterCatalogProductsByBankruptcy(products, ctx) {
  if (!products || products.length === 0) return products || [];
  if (!ctx || !ctx.bankruptcy) return products;

  const seasoningYears = bankruptcyDischargeSeasoningYears(ctx.bankruptcyDischargeDate, ctx.asOf);

  return products.filter((p) => isCatalogProductEligibleForBankruptcy(p, ctx, seasoningYears));
}

function isBankruptcyActive(body) {
  const v = body?.bankruptcy;
  return v === true || v === 'true' || v === 1 || v === '1';
}

function bankruptcyFilterContextFromBody(body, asOf = new Date()) {
  if (!isBankruptcyActive(body)) return null;
  return {
    bankruptcy: true,
    bankruptcyStatus: body.bankruptcyStatus,
    bankruptcyChapter: body.bankruptcyChapter,
    bankruptcyDischargeDate: body.bankruptcyDischargeDate,
    bankruptcyCount: parseBankruptcyCount(body.bankruptcyCount),
    asOf,
  };
}

module.exports = {
  bankruptcyDischargeSeasoningYears,
  isBankruptcyHardStopStatus,
  parseBankruptcyCount,
  getBankruptcyThresholds,
  isBucketEligibleForBankruptcy,
  isMortechRateEligibleForBankruptcy,
  isCatalogProductEligibleForBankruptcy,
  filterRatesByBankruptcy,
  filterCatalogProductsByBankruptcy,
  isBankruptcyActive,
  bankruptcyFilterContextFromBody,
};
