/**
 * FNMA B2-2-04 style non-occupant co-borrower checks (mirrors backend/src/utils/nonOccupantCoBorrower.js).
 */

function normOcc(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/_/g, ' ');
}

function isPrimaryBorrower(b) {
  const o = normOcc(b?.occupancyType);
  return o === 'primary' || o === 'primary resident' || o === 'occupant';
}

function isNonOccupantBorrower(b) {
  const o = normOcc(b?.occupancyType);
  return (
    o === 'non-occupant' ||
    o === 'non occupant' ||
    o.includes('non-occupant co') ||
    o.includes('non occupant co')
  );
}

export function hasCoBorrowerOnLoan(loan) {
  const cob = loan?.coBorrowers;
  if (cob == null) return false;
  if (Array.isArray(cob)) return cob.length > 0;
  return true;
}

/**
 * Pricing tab: use the explicit "Non-Occupant Co-Borrower" checkbox (not a second occupancy dropdown).
 * Property occupancy stays in loan/property fields (Primary Residence / Second Home / Investment).
 */
export function buildBorrowersForNonOccupantValidation(form, loan) {
  if (form?.nonOccupantCoBorrower) {
    return [{ occupancyType: 'Primary' }, { occupancyType: 'Non-Occupant' }];
  }
  const out = [{ occupancyType: 'Primary' }];
  if (hasCoBorrowerOnLoan(loan)) {
    out.push({ occupancyType: 'Primary' });
  }
  return out;
}

export function shouldApplyFnmaNonOccupantRules(mortgageType) {
  const k = String(mortgageType || '').toLowerCase();
  if (k.includes('fha')) return false;
  if (k.includes('va')) return false;
  if (k.includes('non-qm') || k.includes('non conform')) return false;
  return true;
}

export function detectNonOccupantCoBorrowerScenario(borrowers) {
  if (!borrowers || borrowers.length === 0) return false;
  const hasPrimary = borrowers.some(isPrimaryBorrower);
  const hasNonOccupant = borrowers.some(isNonOccupantBorrower);
  return hasPrimary && hasNonOccupant;
}

export function validateNonOccupantCoBorrower(ltv, unitCount, borrowers) {
  if (!borrowers || borrowers.length === 0) {
    return { eligible: true };
  }

  const hasPrimary = borrowers.some(isPrimaryBorrower);
  const hasNonOccupant = borrowers.some(isNonOccupantBorrower);

  if (hasNonOccupant && !hasPrimary) {
    return {
      eligible: false,
      reason: 'At least one borrower must occupy the property.',
      code: 'NO_PRIMARY_OCCUPANT',
    };
  }

  const hasNonOccupantCoBorrower = hasPrimary && hasNonOccupant;
  if (!hasNonOccupantCoBorrower) {
    return { eligible: true };
  }

  const units = Number(unitCount);
  const u = Number.isFinite(units) && units > 0 ? Math.floor(units) : 1;

  if (u > 1) {
    return {
      eligible: false,
      reason: 'Non-occupant co-borrowers are not allowed for multi-unit properties.',
      code: 'MULTI_UNIT',
    };
  }

  const ltvNum = Number(ltv);
  const ltvVal = Number.isFinite(ltvNum) ? ltvNum : 0;
  if (ltvVal > 95) {
    return {
      eligible: false,
      reason: 'Max LTV is 95% for 1-unit properties with a non-occupant co-borrower.',
      code: 'LTV_OVER_95',
    };
  }

  return { eligible: true };
}

export function validateNonOccupantForPricing(ltv, unitCount, borrowers, mortgageType) {
  if (!shouldApplyFnmaNonOccupantRules(mortgageType)) {
    return { eligible: true, skipped: true };
  }
  return validateNonOccupantCoBorrower(ltv, unitCount, borrowers);
}

export const NON_OCCUPANT_FNMA_HELP_TEXT =
  'Non-Occupant Co-Borrower restriction (FNMA B2-2-04): Max LTV 95% for 1-unit properties; not allowed for multi-unit (2–4) properties.';
