/** @returns {'CONV'|'FHA'|'VA'|'NON_QM'} */
export function mapMortgageTypeToEscrowLoanType(mortgageType) {
  const s = String(mortgageType || '').toLowerCase();
  if (s.includes('fha')) return 'FHA';
  if (s.includes('va')) return 'VA';
  if (s.includes('non-qm') || s.includes('non conform')) return 'NON_QM';
  return 'CONV';
}

export function applyEscrowWaiverFilter(loanType, ltv, escrowWaived) {
  if (!escrowWaived) {
    return { eligible: true };
  }

  const ltvNum = Number(ltv);
  const ltvVal = Number.isFinite(ltvNum) ? ltvNum : 0;

  if (loanType === 'FHA') {
    return {
      eligible: false,
      reason: 'Escrow waiver is not allowed for FHA loans.',
      code: 'FHA_ESCROW',
    };
  }

  if ((loanType === 'CONV' || loanType === 'VA') && ltvVal > 80) {
    return {
      eligible: false,
      reason: 'Escrow waiver requires LTV ≤ 80% for Conventional/VA loans.',
      code: 'CONV_VA_LTV',
    };
  }

  if (loanType === 'NON_QM' && ltvVal > 90) {
    return {
      eligible: false,
      reason: 'Escrow waiver requires LTV ≤ 90% for Non-QM loans.',
      code: 'NON_QM_LTV',
    };
  }

  return { eligible: true };
}

export const ESCROW_WAIVER_HELP_TEXT =
  'Escrow Waiver Ineligible: FHA loans do not allow waivers; Conventional/VA require LTV ≤ 80%; Non-QM allows up to 90% LTV.';
