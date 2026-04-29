import { classifyMortgageProductText } from './housingEventSeasoning';

export function computeIsSelfEmployed(isSelfEmployed, ownershipPercentage) {
  const own = Number(ownershipPercentage);
  return Boolean(isSelfEmployed) || (Number.isFinite(own) && own >= 25);
}

export function shouldPivotToNonQmDocs(isSelfEmployed, ownershipPercentage, canProvideTaxReturns) {
  if (!computeIsSelfEmployed(isSelfEmployed, ownershipPercentage)) return false;
  return canProvideTaxReturns === 'No' || canProvideTaxReturns === false;
}

export function validateSelfEmployedNonQmBankStatementLtv(ltv, pivotActive) {
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

export function getEligibleProductCategories(isSelfEmployed, ownershipPercentage, canProvideTaxReturns) {
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

export function filterCatalogSelfEmployedNonQmPivot(products, rateType, loanTerm) {
  if (!products || products.length === 0) return [];
  const termYr = parseInt(String(loanTerm || '').trim(), 10);
  const rateKey = String(rateType || '').toLowerCase();
  return products.filter((p) => {
    if (!matchesSelfEmployedNonQmPivotName(p?.name || '')) return false;
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
}
