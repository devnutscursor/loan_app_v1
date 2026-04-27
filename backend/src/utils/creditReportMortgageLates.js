/**
 * Extract mortgage late-count summary from SmartAPI raw MISMO XML.
 *
 * Client-confirmed mapping:
 * - Use CreditLiability30/60/90DaysLateCount tags as the source of truth.
 * - Omit 120+ (anything > 90 is already disqualifying).
 */

function toInt(v) {
  const n = parseInt(String(v || '').trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function extractTag(block, tagName) {
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const m = String(block || '').match(re);
  return m ? String(m[1]).trim() : '';
}

function extractCreditLiabilityBlocks(rawXml) {
  const xml = String(rawXml || '');
  const re = new RegExp('<CREDIT_LIABILITY[\\s\\S]*?<\\/CREDIT_LIABILITY>', 'g');
  return xml.match(re) || [];
}

function isMortgageLiability(block) {
  const acct = extractTag(block, 'CreditLiabilityAccountType').toLowerCase();
  const loanType = extractTag(block, 'CreditLoanType').toLowerCase();
  return acct.includes('mortgage') || loanType.includes('mortgage');
}

function extractLateCountsFromLiability(block) {
  const c30 = toInt(extractTag(block, 'CreditLiability30DaysLateCount'));
  const c60 = toInt(extractTag(block, 'CreditLiability60DaysLateCount'));
  const c90 = toInt(extractTag(block, 'CreditLiability90DaysLateCount'));
  return { c30, c60, c90 };
}

/**
 * @param {string} rawXml
 * @returns {{
 *  found: boolean,
 *  mortgageLiabilityCount: number,
 *  total30: number,
 *  total60: number,
 *  total90: number,
 *  max30: number,
 *  max60: number,
 *  max90: number,
 * }}
 */
function extractMortgageLatesSummaryFromRawXml(rawXml) {
  const blocks = extractCreditLiabilityBlocks(rawXml);
  if (blocks.length === 0) {
    return {
      found: false,
      mortgageLiabilityCount: 0,
      total30: 0,
      total60: 0,
      total90: 0,
      max30: 0,
      max60: 0,
      max90: 0,
    };
  }

  const mortgageBlocks = blocks.filter(isMortgageLiability);
  if (mortgageBlocks.length === 0) {
    return {
      found: false,
      mortgageLiabilityCount: 0,
      total30: 0,
      total60: 0,
      total90: 0,
      max30: 0,
      max60: 0,
      max90: 0,
    };
  }

  let total30 = 0;
  let total60 = 0;
  let total90 = 0;
  let max30 = 0;
  let max60 = 0;
  let max90 = 0;

  for (const b of mortgageBlocks) {
    const { c30, c60, c90 } = extractLateCountsFromLiability(b);
    total30 += c30;
    total60 += c60;
    total90 += c90;
    if (c30 > max30) max30 = c30;
    if (c60 > max60) max60 = c60;
    if (c90 > max90) max90 = c90;
  }

  return {
    found: true,
    mortgageLiabilityCount: mortgageBlocks.length,
    total30,
    total60,
    total90,
    max30,
    max60,
    max90,
  };
}

module.exports = {
  extractCreditLiabilityBlocks,
  extractMortgageLatesSummaryFromRawXml,
};

