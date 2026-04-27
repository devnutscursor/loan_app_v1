/**
 * Loan program type: FSA/RHS-Guaranteed (USDA Single Family Housing Guaranteed / RHS)
 * Stored as `fsa_rhs`. Legacy records may still have `usda`.
 */
const FSA_RHS_PROGRAM_TYPE = 'fsa_rhs';
const LEGACY_USDA_PROGRAM_TYPE = 'usda';

function isFsaRhsGuaranteed(programType) {
  if (programType === undefined || programType === null) return false;
  const t = String(programType).toLowerCase();
  return t === FSA_RHS_PROGRAM_TYPE || t === LEGACY_USDA_PROGRAM_TYPE;
}

module.exports = {
  FSA_RHS_PROGRAM_TYPE,
  LEGACY_USDA_PROGRAM_TYPE,
  isFsaRhsGuaranteed,
};
