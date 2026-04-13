/** FSA/RHS-Guaranteed (USDA SFH Guaranteed / RHS). Legacy DB value may be `usda`. */
export const FSA_RHS_PROGRAM_TYPE = 'fsa_rhs';
export const LEGACY_USDA_PROGRAM_TYPE = 'usda';

export function isFsaRhsGuaranteed(programType) {
  if (programType === undefined || programType === null) return false;
  const t = String(programType).toLowerCase();
  return t === FSA_RHS_PROGRAM_TYPE || t === LEGACY_USDA_PROGRAM_TYPE;
}

/**
 * `loanParameters.selectedProgramId` may be a string id or a populated `{ _id, displayName, ... }`.
 * Use before comparing to `loanPrograms[].id`.
 */
export function normalizeSelectedProgramId(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && raw._id != null) return String(raw._id);
  return String(raw);
}

/**
 * Label for pickers and lists: use MCR-aligned name for FSA/RHS (`fsa_rhs` / legacy `usda`),
 * otherwise the stored display name (avoids stale e.g. "USDA Rural Development" in Mongo).
 */
export function getLoanProgramDisplayLabel(program) {
  if (!program) return "—";
  if (isFsaRhsGuaranteed(program.programType)) {
    return formatProgramTypeLabel(program.programType);
  }
  return program.displayName || program.programName || "—";
}

/** Short label for MCR/UI when only `programType` is available (stored enum value). */
export function formatProgramTypeLabel(programType) {
  if (programType === undefined || programType === null || programType === "") return "—";
  const t = String(programType).toLowerCase();
  if (t === FSA_RHS_PROGRAM_TYPE || t === LEGACY_USDA_PROGRAM_TYPE) return "FSA/RHS-Guaranteed";
  if (t === "conventional") return "Conventional";
  if (t === "fha") return "FHA";
  if (t === "va") return "VA";
  if (t === "jumbo") return "Jumbo";
  return String(programType).replace(/_/g, " ");
}
