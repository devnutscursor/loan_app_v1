const Company = require('../models/company.model');
const Loan = require('../models/loan.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const GhlUserMap = require('../models/ghlUserMap.model');
const GhlContactMap = require('../models/ghlContactMap.model');
const GhlOpportunityMap = require('../models/ghlOpportunityMap.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { assertPipelineSlotAvailableForContact } = require('./ghlPipelineEligibility.service');
const { request } = require('./ghlApiClient.service');

function getPipelinesArray(response) {
  if (Array.isArray(response?.pipelines)) return response.pipelines;
  if (Array.isArray(response?.data?.pipelines)) return response.data.pipelines;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getOpportunitiesArray(response) {
  if (Array.isArray(response?.opportunities)) return response.opportunities;
  if (Array.isArray(response?.data?.opportunities)) return response.data.opportunities;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return '';
}

function normalizeText(s) {
  return String(s || '').trim();
}

function isDuplicateOpportunityError(err) {
  if (!err) return false;
  const status = err.statusCode || err?.originalError?.response?.status;
  if (status !== 400 && status !== 409 && status !== 422) return false;
  const msg = String(err.message || '').toLowerCase();
  const rdMsg = String(err?.responseData?.message || '').toLowerCase();
  return (
    msg.includes('duplicate opportunity') ||
    rdMsg.includes('duplicate opportunity') ||
    msg.includes('cannot create duplicate opportunity') ||
    rdMsg.includes('cannot create duplicate opportunity')
  );
}

function extractDuplicateOpportunityId(err) {
  const rd = err?.responseData;
  if (!rd) return null;
  return (
    rd?.meta?.opportunityId ||
    rd?.meta?.opportunity?.id ||
    rd?.meta?.opportunity?._id ||
    rd?.opportunityId ||
    rd?.data?.opportunityId ||
    null
  );
}

function mapLoanStatusToOpportunityStatus(loanStatus, overrides = {}) {
  const override = overrides?.[loanStatus];
  if (override === 'open' || override === 'won' || override === 'lost') return override;

  if (loanStatus === 'Closed' || loanStatus === 'Funded') return 'won';
  if (loanStatus === 'Declined' || loanStatus === 'Withdrawn' || loanStatus === 'Closed-Incomplete') return 'lost';
  return 'open';
}

async function resolveCompanyLocation(companyId) {
  const company = await Company.findById(companyId).select('name ghlIntegration');
  if (!company) throw new ApiError('Company not found', 404);
  if (!company.ghlIntegration?.connected) return { company, connected: false, locationId: null };
  if (!company.ghlIntegration?.locationId) return { company, connected: false, locationId: null };
  return { company, connected: true, locationId: company.ghlIntegration.locationId };
}

async function getPipelines(companyId) {
  const { connected, locationId } = await resolveCompanyLocation(companyId);
  if (!connected) return { connected: false, pipelines: [] };

  const res = await request(companyId, 'GET', '/opportunities/pipelines', {
    params: { locationId }
  });
  return { connected: true, locationId, pipelines: getPipelinesArray(res) };
}

async function resolveOpportunityConfig(companyId) {
  const company = await Company.findById(companyId).select('ghlIntegration');
  if (!company) throw new ApiError('Company not found', 404);
  const cfg = company.ghlIntegration?.opportunityConfig || {};
  if (!company.ghlIntegration?.connected || !company.ghlIntegration?.locationId) {
    throw new ApiError('GHL not connected for this company', 400);
  }
  if (!cfg?.pipelineId) {
    throw new ApiError('GHL opportunity pipeline is not configured for this company', 400);
  }
  return {
    locationId: company.ghlIntegration.locationId,
    pipelineId: cfg.pipelineId,
    stageByStatus: cfg.stageByStatus || {},
    opportunityStatusByLoanStatus: cfg.opportunityStatusByLoanStatus || {}
  };
}

// Manual sync only needs the location context; pipeline is selected by the user in the UI.
async function resolveOpportunityManualContext(companyId) {
  const company = await Company.findById(companyId).select('ghlIntegration');
  if (!company) throw new ApiError('Company not found', 404);
  if (!company.ghlIntegration?.connected || !company.ghlIntegration?.locationId) {
    throw new ApiError('GHL not connected for this company', 400);
  }
  const cfg = company.ghlIntegration?.opportunityConfig || {};
  return {
    locationId: company.ghlIntegration.locationId,
    opportunityStatusByLoanStatus: cfg.opportunityStatusByLoanStatus || {}
  };
}

async function resolveFallbackAssignedTo(companyId) {
  const admin = await GhlUserMap.findOne({
    companyId,
    role: 'admin',
    provisionStatus: 'provisioned'
  })
    .select('ghlUserId')
    .lean();
  return admin?.ghlUserId || null;
}

async function resolveAssignedToGhlUserId(companyId, lenderId) {
  if (!lenderId) return null;
  const lender = await Lender.findById(lenderId).select('user').lean();
  if (!lender?.user) return null;
  const map = await GhlUserMap.findOne({
    companyId,
    appUserId: lender.user,
    role: 'loan_officer',
    provisionStatus: 'provisioned'
  })
    .select('ghlUserId')
    .lean();
  return map?.ghlUserId || null;
}

async function resolveContactIdForBorrower(companyId, borrowerId) {
  const map = await GhlContactMap.findOne({ companyId, borrowerId }).select('ghlContactId').lean();
  return map?.ghlContactId || null;
}

async function createOpportunity(companyId, payload) {
  try {
    const res = await request(companyId, 'POST', '/opportunities/', {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });
    const created = res?.opportunity || res?.data?.opportunity || res?.data || res;
    const ghlOpportunityId = created?._id || created?.id;
    if (!ghlOpportunityId) throw new ApiError('GHL opportunity create did not return an ID', 500);
    return { ghlOpportunityId, created, duplicate: false };
  } catch (err) {
    if (isDuplicateOpportunityError(err)) {
      const existingId = extractDuplicateOpportunityId(err);
      if (existingId) {
        logger.info(
          `GHL duplicate opportunity detected during create (companyId=${companyId}); reusing existing opportunity ${existingId}`
        );
        return { ghlOpportunityId: existingId, created: null, duplicate: true };
      }
    }
    throw err;
  }
}

async function updateOpportunity(companyId, ghlOpportunityId, payload) {
  // GHL rejects `locationId` on PUT /opportunities/{id} for this API version.
  // Keep accepting it from callers for compatibility, but strip it before sending.
  const { locationId: _ignoredLocationId, ...updatePayload } = payload || {};
  await request(companyId, 'PUT', `/opportunities/${ghlOpportunityId}`, {
    data: updatePayload,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function syncOpportunityForLoan({ companyId, loanId }) {
  const { locationId, pipelineId, stageByStatus, opportunityStatusByLoanStatus } =
    await resolveOpportunityConfig(companyId);

  const loan = await Loan.findById(loanId)
    .populate('borrower', 'user')
    .select('loanNumber borrower lender status property loanDetails createdAt updatedAt')
    .lean();
  if (!loan) throw new ApiError('Loan not found', 404);

  const borrower = await Borrower.findById(loan.borrower)
    .populate('user', 'firstName lastName email phone')
    .select('user')
    .lean();

  const borrowerName = pickFirstNonEmpty(
    `${borrower?.user?.firstName || ''} ${borrower?.user?.lastName || ''}`.trim(),
    borrower?.user?.email,
    'Borrower'
  );

  const propertyName = pickFirstNonEmpty(
    loan?.property?.address?.streetAddress,
    loan?.property?.streetAddress,
    loan?.property?.propertyAddress?.streetAddress,
    loan?.property?.addressLine1
  );

  // Ensure the opportunity name is unique per loan to avoid location-level
  // "duplicate opportunity" restrictions for the same contact.
  const baseName = pickFirstNonEmpty(propertyName, 'Loan');
  const suffix = loan.loanNumber ? `#${loan.loanNumber}` : String(loan._id);
  const name = normalizeText(`${baseName} ${suffix}`);

  const monetaryValue =
    loan?.loanDetails?.loanAmount ||
    loan?.loanDetails?.requestedLoanAmount ||
    loan?.property?.propertyValue ||
    undefined;

  // Contact must exist for opportunity
  const contactId = await resolveContactIdForBorrower(companyId, loan.borrower);
  if (!contactId) {
    throw new ApiError('Cannot create opportunity: borrower contact is not linked to GHL', 400);
  }

  // Assignment: prefer loan officer, else fallback admin
  let assignedTo = await resolveAssignedToGhlUserId(companyId, loan.lender);
  if (!assignedTo) {
    assignedTo = await resolveFallbackAssignedTo(companyId);
    if (!assignedTo) {
      logger.warn(`No GHL loan officer/admin user mapped for company ${companyId}; creating opportunity unassigned`);
    }
  }

  const pipelineStageId = stageByStatus?.[loan.status] || null;
  if (!pipelineStageId) {
    logger.warn(`No pipelineStageId configured for loan.status="${loan.status}" (companyId=${companyId}); opportunity will be created/updated without stage`);
  }

  const oppStatus = mapLoanStatusToOpportunityStatus(loan.status, opportunityStatusByLoanStatus);

  const existingMap = await GhlOpportunityMap.findOne({ companyId, loanId }).select('ghlOpportunityId').lean();
  if (existingMap?.ghlOpportunityId) {
    await updateOpportunity(companyId, existingMap.ghlOpportunityId, {
      locationId,
      name,
      pipelineId,
      ...(pipelineStageId ? { pipelineStageId } : {}),
      contactId,
      ...(assignedTo ? { assignedTo } : {}),
      status: oppStatus,
      ...(monetaryValue ? { monetaryValue } : {})
    });

    await GhlOpportunityMap.findOneAndUpdate(
      { companyId, loanId },
      {
        $set: {
          ghlContactId: contactId,
          assignedToGhlUserId: assignedTo,
          pipelineId,
          pipelineStageId: pipelineStageId || undefined,
          lastSyncedAt: new Date()
        }
      },
      { new: true }
    );
    return { action: 'updated', ghlOpportunityId: existingMap.ghlOpportunityId };
  }

  const { ghlOpportunityId } = await createOpportunity(companyId, {
    locationId,
    name,
    pipelineId,
    ...(pipelineStageId ? { pipelineStageId } : {}),
    contactId,
    ...(assignedTo ? { assignedTo } : {}),
    status: oppStatus,
    ...(monetaryValue ? { monetaryValue } : {})
  });

  await GhlOpportunityMap.create({
    companyId,
    loanId,
    ghlOpportunityId,
    ghlContactId: contactId,
    assignedToGhlUserId: assignedTo,
    pipelineId,
    pipelineStageId: pipelineStageId || undefined,
    lastSyncedAt: new Date()
  });

  logger.info(`GHL opportunity synced for loan ${loanId}: action=created opportunityId=${ghlOpportunityId}`);
  return { action: 'created', ghlOpportunityId };
}

async function syncOpportunityForLoanManual({
  companyId,
  loanId,
  pipelineId,
  pipelineStageId,
  opportunityStatus,
  assignedToGhlUserId = null,
  contactId: contactIdOverride = null
}) {
  const { locationId, opportunityStatusByLoanStatus } = await resolveOpportunityManualContext(companyId);

  if (!pipelineId) throw new ApiError('pipelineId is required', 400);
  if (!pipelineStageId) throw new ApiError('pipelineStageId is required', 400);
  if (!opportunityStatus) throw new ApiError('opportunityStatus is required', 400);
  if (!['open', 'won', 'lost'].includes(opportunityStatus)) {
    throw new ApiError('opportunityStatus must be one of: open, won, lost', 400);
  }

  const loan = await Loan.findById(loanId)
    .select('loanNumber borrower lender status property loanDetails createdAt updatedAt')
    .lean();
  if (!loan) throw new ApiError('Loan not found', 404);

  const borrower = await Borrower.findById(loan.borrower)
    .populate('user', 'firstName lastName email phone')
    .select('user')
    .lean();

  const propertyName = pickFirstNonEmpty(
    loan?.property?.address?.streetAddress,
    loan?.property?.streetAddress,
    loan?.property?.propertyAddress?.streetAddress,
    loan?.property?.addressLine1
  );

  // Ensure the opportunity name is unique per loan to avoid location-level
  // "duplicate opportunity" restrictions for the same contact.
  const baseName = pickFirstNonEmpty(propertyName, 'Loan');
  const suffix = loan.loanNumber ? `#${loan.loanNumber}` : String(loan._id);
  const name = normalizeText(`${baseName} ${suffix}`);

  const monetaryValue =
    loan?.loanDetails?.loanAmount ||
    loan?.loanDetails?.requestedLoanAmount ||
    loan?.property?.propertyValue ||
    undefined;

  const contactId = contactIdOverride || (await resolveContactIdForBorrower(companyId, loan.borrower));
  if (!contactId) {
    throw new ApiError('Borrower does not have a linked GHL contact ID', 400);
  }

  await assertPipelineSlotAvailableForContact({
    companyId,
    ghlContactId: contactId,
    requestingLoanId: loanId
  });

  let assignedTo = assignedToGhlUserId;
  if (!assignedTo) {
    // Default assignment: loan officer if possible, else admin
    assignedTo = await resolveAssignedToGhlUserId(companyId, loan.lender);
    if (!assignedTo) assignedTo = await resolveFallbackAssignedTo(companyId);
  }

  // Allow optional automatic status mapping override if caller passes null
  const finalStatus =
    opportunityStatus || mapLoanStatusToOpportunityStatus(loan.status, opportunityStatusByLoanStatus);

  const existingMap = await GhlOpportunityMap.findOne({ companyId, loanId }).select('ghlOpportunityId').lean();
  if (existingMap?.ghlOpportunityId) {
    await updateOpportunity(companyId, existingMap.ghlOpportunityId, {
      locationId,
      name,
      pipelineId,
      pipelineStageId,
      contactId,
      ...(assignedTo ? { assignedTo } : {}),
      status: finalStatus,
      ...(monetaryValue ? { monetaryValue } : {})
    });

    await GhlOpportunityMap.findOneAndUpdate(
      { companyId, loanId },
      {
        $set: {
          ghlContactId: contactId,
          assignedToGhlUserId: assignedTo,
          pipelineId,
          pipelineStageId,
          lastSyncedAt: new Date()
        }
      },
      { new: true }
    );
    return { action: 'updated', ghlOpportunityId: existingMap.ghlOpportunityId };
  }

  let createResult;
  try {
    createResult = await createOpportunity(companyId, {
      locationId,
      name,
      pipelineId,
      pipelineStageId,
      contactId,
      ...(assignedTo ? { assignedTo } : {}),
      status: finalStatus,
      ...(monetaryValue ? { monetaryValue } : {})
    });
  } catch (err) {
    // Strong fallback: if GHL blocks creating multiple opportunities for the same contact,
    // reuse an existing opportunity for the contact and update it.
    if (isDuplicateOpportunityError(err)) {
      const existingOpps = await searchOpportunitiesByContact(companyId, { locationId, contactId, limit: 50 });
      const match =
        existingOpps.find((o) => String(o?.pipelineId) === String(pipelineId)) ||
        existingOpps[0] ||
        null;
      const existingId = match?._id || match?.id || null;
      if (existingId) {
        await updateOpportunity(companyId, existingId, {
          locationId,
          name,
          pipelineId,
          pipelineStageId,
          contactId,
          ...(assignedTo ? { assignedTo } : {}),
          status: finalStatus,
          ...(monetaryValue ? { monetaryValue } : {})
        });
        createResult = { ghlOpportunityId: existingId, created: null, duplicate: true };
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const { ghlOpportunityId, duplicate } = createResult;

  // If we recovered an existing opportunity id from a duplicate error,
  // update it to our selected pipeline/stage/status and then map it to this loan.
  if (duplicate) {
    await updateOpportunity(companyId, ghlOpportunityId, {
      locationId,
      name,
      pipelineId,
      pipelineStageId,
      contactId,
      ...(assignedTo ? { assignedTo } : {}),
      status: finalStatus,
      ...(monetaryValue ? { monetaryValue } : {})
    });
  }

  await GhlOpportunityMap.create({
    companyId,
    loanId,
    ghlOpportunityId,
    ghlContactId: contactId,
    assignedToGhlUserId: assignedTo,
    pipelineId,
    pipelineStageId,
    lastSyncedAt: new Date()
  });

  return { action: duplicate ? 'reused_duplicate' : 'created', ghlOpportunityId };
}

async function updateOpportunityStageForLoan({ companyId, loanId, loanStatus }) {
  const { locationId, pipelineId, stageByStatus, opportunityStatusByLoanStatus } =
    await resolveOpportunityConfig(companyId);

  const map = await GhlOpportunityMap.findOne({ companyId, loanId }).select('ghlOpportunityId').lean();
  if (!map?.ghlOpportunityId) return { skipped: true, reason: 'not_mapped' };

  const pipelineStageId = stageByStatus?.[loanStatus] || null;
  const oppStatus = mapLoanStatusToOpportunityStatus(loanStatus, opportunityStatusByLoanStatus);

  await updateOpportunity(companyId, map.ghlOpportunityId, {
    locationId,
    pipelineId,
    ...(pipelineStageId ? { pipelineStageId } : {}),
    status: oppStatus
  });

  await GhlOpportunityMap.findOneAndUpdate(
    { companyId, loanId },
    {
      $set: {
        pipelineId,
        pipelineStageId: pipelineStageId || undefined,
        lastSyncedAt: new Date()
      }
    }
  );

  return { action: 'stage_updated', ghlOpportunityId: map.ghlOpportunityId };
}

async function searchOpportunitiesByContact(companyId, { locationId, contactId, limit = 50 }) {
  const res = await request(companyId, 'GET', '/opportunities/search', {
    params: { locationId, contactId, limit }
  });
  return getOpportunitiesArray(res);
}

module.exports = {
  getPipelines,
  resolveOpportunityConfig,
  resolveOpportunityManualContext,
  syncOpportunityForLoan,
  syncOpportunityForLoanManual,
  updateOpportunityStageForLoan,
  searchOpportunitiesByContact
};

