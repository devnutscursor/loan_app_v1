const { classifyMortgageProductText } = require('./housingEventSeasoning');

function computeIsSelfEmployed(isSelfEmployed, ownershipPercentage) {
  const own = Number(ownershipPercentage);
  return Boolean(isSelfEmployed) || (Number.isFinite(own) && own >= 25);
}

function shouldPivotToNonQmDocs(isSelfEmployed, ownershipPercentage, canProvideTaxReturns) {
  if (!computeIsSelfEmployed(isSelfEmployed, ownershipPercentage)) return false;
  return canProvideTaxReturns === 'No' || canProvideTaxReturns === false;
}

function shouldPivotToNonQmDocsFromBody(body) {
  const se = body.selfEmployed === true || body.selfEmployed === 1;
  return shouldPivotToNonQmDocs(se, body.ownershipPercentage, body.canProvideTaxReturns);
}

function validateSelfEmployedNonQmBankStatementLtv(ltv, pivotActive) {
  if (!pivotActive) return { eligible: true };
  const n = Number(ltv);
  const v = Number.isFinite(n) ? n : 0;
  if (v > 80) {
    return {
      eligible: false,
      reason: 'Non-QM Bank Statement loans typically require LTV ≤ 80%.',
      code: 'SE_NON_QM_LTV',
    };
  }
  return { eligible: true };
}

function getEligibleProductCategories(isSelfEmployed, ownershipPercentage, canProvideTaxReturns) {
  const isSE = computeIsSelfEmployed(isSelfEmployed, ownershipPercentage);
  const categories = ['CONV', 'FHA', 'VA', 'USDA'];
  if (isSE && (canProvideTaxReturns === 'No' || canProvideTaxReturns === false)) {
    return {
      categories: ['NON_QM', 'BANK_STATEMENT', 'DSCR'],
      note: 'Standard Agency products hidden due to lack of tax returns.',
    };
  }
  return { categories, note: 'Standard underwriting applies.' };
}

function matchesSelfEmployedNonQmPivotName(name) {
  const text = String(name || '');
  const t = text.toLowerCase();
  if (classifyMortgageProductText(text) === 'nonQm') return true;
  if (t.includes('bank statement') || t.includes('bank stmt')) return true;
  if (t.includes('dscr')) return true;
  return false;
}

function filterRatesBySelfEmployedNonQmPivot(rates) {
  if (!Array.isArray(rates)) return [];
  return rates.filter((r) => {
    const label = `${r.productName || ''} ${r.loanProgram || ''}`.trim();
    return matchesSelfEmployedNonQmPivotName(label);
  });
}

module.exports = {
  computeIsSelfEmployed,
  shouldPivotToNonQmDocs,
  shouldPivotToNonQmDocsFromBody,
  validateSelfEmployedNonQmBankStatementLtv,
  getEligibleProductCategories,
  filterRatesBySelfEmployedNonQmPivot,
  matchesSelfEmployedNonQmPivotName,
};
