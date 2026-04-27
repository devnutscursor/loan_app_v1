const Loan = require('../models/loan.model');
const GhlOpportunityMap = require('../models/ghlOpportunityMap.model');
const ApiError = require('../utils/apiError');

/**
 * Client rule: a GHL contact may have at most one loan in the pipeline at a time.
 * Another loan for the same contact may be synced only after the prior synced loan
 * reaches Closed/Funded/Rejected (per client).
 */
const PIPELINE_RELEASE_STATUSES = new Set(['Closed', 'Funded', 'Rejected']);

/**
 * @returns {Promise<{
 *   allowed: boolean,
 *   blockingLoanId: string|null,
 *   blockingLoanNumber: string|null,
 *   blockingStatus: string|null
 * }>}
 */
async function getPipelineSlotState({ companyId, ghlContactId, requestingLoanId }) {
  if (!companyId || !ghlContactId || !requestingLoanId) {
    return { allowed: true, blockingLoanId: null, blockingLoanNumber: null, blockingStatus: null };
  }

  const maps = await GhlOpportunityMap.find({
    companyId,
    ghlContactId: String(ghlContactId).trim(),
    loanId: { $ne: requestingLoanId }
  })
    .select('loanId')
    .lean();

  if (!maps.length) {
    return { allowed: true, blockingLoanId: null, blockingLoanNumber: null, blockingStatus: null };
  }

  const loanIds = maps.map((m) => m.loanId);
  const loans = await Loan.find({ _id: { $in: loanIds } })
    .select('status loanNumber')
    .lean();

  for (const l of loans) {
    const status = l?.status;
    if (!PIPELINE_RELEASE_STATUSES.has(status)) {
      return {
        allowed: false,
        blockingLoanId: String(l._id),
        blockingLoanNumber: l.loanNumber || null,
        blockingStatus: status || null
      };
    }
  }

  return { allowed: true, blockingLoanId: null, blockingLoanNumber: null, blockingStatus: null };
}

function buildBlockMessage({ blockingLoanNumber, blockingStatus }) {
  const num = blockingLoanNumber ? `Loan ${blockingLoanNumber}` : 'Another loan';
  return `${num} for this contact is already active in the GHL pipeline (status: ${blockingStatus || 'unknown'}). A new loan can be added only after the previous loan is Closed, Funded, or Rejected.`;
}

async function assertPipelineSlotAvailableForContact({ companyId, ghlContactId, requestingLoanId }) {
  const state = await getPipelineSlotState({ companyId, ghlContactId, requestingLoanId });
  if (!state.allowed) {
    throw new ApiError(buildBlockMessage(state), 409);
  }
}

module.exports = {
  PIPELINE_RELEASE_STATUSES,
  getPipelineSlotState,
  assertPipelineSlotAvailableForContact,
  buildBlockMessage
};
