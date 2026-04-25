const Company = require('../models/company.model');
const User = require('../models/user.model');
const Lender = require('../models/lender.model');
const GhlUserMap = require('../models/ghlUserMap.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { request } = require('./ghlApiClient.service');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function safeNamePart(name, fallback) {
  const value = String(name || '').trim();
  return value || fallback;
}

async function getCompanyOwner(companyId, companyDoc, actorUserId) {
  if (companyDoc?.primaryContact) {
    const primary = await User.findById(companyDoc.primaryContact).select(
      'firstName lastName email phone isActive'
    );
    if (primary && primary.isActive && primary.email) {
      return primary;
    }
  }

  const companyUser = await User.findOne({
    company: companyId,
    role: 'company',
    isActive: true,
    email: { $exists: true, $ne: '' }
  }).select('firstName lastName email phone');
  if (companyUser) return companyUser;

  if (actorUserId) {
    const actor = await User.findById(actorUserId).select(
      'firstName lastName email phone isActive'
    );
    if (actor && actor.isActive && actor.email) {
      return actor;
    }
  }

  if (Array.isArray(companyDoc?.users) && companyDoc.users.length > 0) {
    const linkedUser = await User.findOne({
      _id: { $in: companyDoc.users },
      isActive: true,
      email: { $exists: true, $ne: '' }
    }).select('firstName lastName email phone');
    if (linkedUser) return linkedUser;
  }

  return null;
}

async function getLoanOfficerUsers(companyId) {
  const lenders = await Lender.find({ company: companyId, isActive: true })
    .populate({
      path: 'user',
      select: 'firstName lastName email phone isActive role'
    })
    .select('user')
    .lean();

  return lenders
    .map((l) => l.user)
    .filter((u) => u && u.isActive && u.email)
    .reduce((acc, user) => {
      if (!acc.find((x) => String(x._id) === String(user._id))) {
        acc.push(user);
      }
      return acc;
    }, []);
}

function buildUserCandidate({ user, role }) {
  return {
    appUserId: user._id,
    firstName: safeNamePart(user.firstName, 'User'),
    lastName: safeNamePart(user.lastName, 'Account'),
    email: normalizeEmail(user.email),
    phone: user.phone || '',
    role
  };
}

async function listGhlUsers(companyId, locationId) {
  let response;
  try {
    response = await request(companyId, 'GET', '/users/', {
      params: { locationId }
    });
  } catch (error) {
    logger.warn(
      `Unable to fetch existing GHL users for company ${companyId}. Continuing with create-first flow. Reason: ${error.message}`
    );
    return [];
  }

  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function findExistingGhlUser(ghlUsers, email) {
  const target = normalizeEmail(email);
  return ghlUsers.find((u) => normalizeEmail(u.email) === target);
}

function extractGhlUserIdFromPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return null;
  const directId =
    payload.id ||
    payload._id ||
    payload.userId ||
    payload.user_id ||
    payload.contactId ||
    payload.contact_id;
  if (typeof directId === 'string' && directId.trim()) return directId.trim();

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedId = extractGhlUserIdFromPayload(item);
      if (nestedId) return nestedId;
    }
    return null;
  }

  if (typeof payload === 'object') {
    const nestedCandidates = [payload.user, payload.data, payload.meta, payload.error];
    for (const item of nestedCandidates) {
      const nestedId = extractGhlUserIdFromPayload(item);
      if (nestedId) return nestedId;
    }
  }

  return null;
}

async function createGhlUser(companyId, companyIntegration, candidate) {
  const payload = {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    type: 'account',
    role: candidate.role === 'owner_admin' ? 'admin' : 'user',
    locationIds: companyIntegration.locationId ? [companyIntegration.locationId] : undefined
  };
  if (companyIntegration.ghlCompanyId) {
    payload.companyId = companyIntegration.ghlCompanyId;
  }

  let response;
  try {
    response = await request(companyId, 'POST', '/users/', {
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    const message = String(error?.message || '').toLowerCase();
    const looksLikeExists =
      statusCode === 409 ||
      (statusCode === 400 && message.includes('exist')) ||
      (statusCode === 422 && message.includes('exist'));
    if (looksLikeExists) {
      const recoveredId = extractGhlUserIdFromPayload(error?.responseData);
      if (recoveredId) {
        return { _id: recoveredId, recoveredFromExisting: true };
      }
    }
    throw error;
  }

  const created =
    response?.user ||
    response?.data?.user ||
    response?.data ||
    response;

  if (!created?._id && !created?.id) {
    throw new ApiError('GHL user create did not return an ID', 500);
  }

  return created;
}

async function upsertUserMap({ companyId, appUserId, ghlUserId, role, provisionStatus, lastError }) {
  await GhlUserMap.findOneAndUpdate(
    { companyId, appUserId },
    {
      $set: {
        ghlUserId,
        role,
        provisionStatus,
        lastProvisionedAt: new Date(),
        lastError: lastError || null
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getConnectedCompany(companyId) {
  const company = await Company.findById(companyId).select('name ghlIntegration primaryContact users');
  if (!company) {
    throw new ApiError('Company not found', 404);
  }
  if (!company.ghlIntegration?.connected) {
    throw new ApiError('GHL is not connected for this company', 400);
  }
  if (!company.ghlIntegration?.locationId) {
    throw new ApiError('Connected company is missing GHL location ID', 400);
  }
  return company;
}

async function ensureCompanyAdminUser(companyId, actorUser) {
  const company = await getConnectedCompany(companyId);
  const ownerUser = await getCompanyOwner(companyId, company, actorUser?._id);
  if (!ownerUser) {
    throw new ApiError(
      'No active company owner found. Set company primary contact or ensure the logged-in company user has a valid email.',
      400
    );
  }

  const candidate = buildUserCandidate({ user: ownerUser, role: 'owner_admin' });
  const existingUsers = await listGhlUsers(companyId, company.ghlIntegration.locationId);
  const existing = findExistingGhlUser(existingUsers, candidate.email);

  let action = 'reused';
  let ghlUserId = existing?._id || existing?.id;
  if (!ghlUserId) {
    const created = await createGhlUser(companyId, company.ghlIntegration, candidate);
    ghlUserId = created._id || created.id;
    action = 'created';
  }

  await upsertUserMap({
    companyId,
    appUserId: candidate.appUserId,
    ghlUserId,
    role: candidate.role,
    provisionStatus: 'provisioned'
  });

  return {
    companyId: String(company._id),
    companyName: company.name,
    email: candidate.email,
    role: candidate.role,
    action,
    ghlUserId,
    adminExists: true
  };
}

async function getCompanyAdminLinkStatus(companyId, actorUser) {
  const company = await getConnectedCompany(companyId);
  const ownerUser = await getCompanyOwner(companyId, company, actorUser?._id);
  if (!ownerUser) {
    return {
      ownerEmail: null,
      linked: false,
      ghlUserId: null
    };
  }

  const mapping = await GhlUserMap.findOne({
    companyId,
    appUserId: ownerUser._id,
    role: 'owner_admin',
    provisionStatus: 'provisioned'
  })
    .select('ghlUserId')
    .lean();

  return {
    ownerEmail: normalizeEmail(ownerUser.email),
    linked: Boolean(mapping?.ghlUserId),
    ghlUserId: mapping?.ghlUserId || null
  };
}

async function syncLoanOfficerToGhl({ companyId, appUser }) {
  const company = await getConnectedCompany(companyId);
  const candidate = buildUserCandidate({ user: appUser, role: 'loan_officer' });
  const existingUsers = await listGhlUsers(companyId, company.ghlIntegration.locationId);
  const existing = findExistingGhlUser(existingUsers, candidate.email);

  let ghlUserId = existing?._id || existing?.id;
  let action = 'reused';
  if (!ghlUserId) {
    const created = await createGhlUser(companyId, company.ghlIntegration, candidate);
    ghlUserId = created._id || created.id;
    action = 'created';
  }

  await upsertUserMap({
    companyId,
    appUserId: candidate.appUserId,
    ghlUserId,
    role: candidate.role,
    provisionStatus: 'provisioned'
  });

  return { action, ghlUserId };
}

async function provisionCompanyUsers(companyId, actorUser) {
  const company = await Company.findById(companyId).select('name ghlIntegration primaryContact users');
  if (!company) {
    throw new ApiError('Company not found', 404);
  }
  if (!company.ghlIntegration?.connected) {
    throw new ApiError('GHL is not connected for this company', 400);
  }
  if (!company.ghlIntegration?.locationId) {
    throw new ApiError('Connected company is missing GHL location ID', 400);
  }

  const ownerUser = await getCompanyOwner(companyId, company, actorUser?._id);
  if (!ownerUser) {
    throw new ApiError(
      'No active company owner found for provisioning. Set company primary contact or ensure the logged-in company user has a valid email.',
      400
    );
  }

  const loanOfficerUsers = await getLoanOfficerUsers(companyId);

  const candidates = [
    buildUserCandidate({ user: ownerUser, role: 'owner_admin' }),
    ...loanOfficerUsers.map((u) => buildUserCandidate({ user: u, role: 'loan_officer' }))
  ].reduce((acc, c) => {
    if (!acc.find((x) => normalizeEmail(x.email) === normalizeEmail(c.email))) {
      acc.push(c);
    }
    return acc;
  }, []);

  const existingUsers = await listGhlUsers(companyId, company.ghlIntegration.locationId);
  const summary = {
    companyId: String(company._id),
    companyName: company.name,
    totalCandidates: candidates.length,
    provisioned: 0,
    reused: 0,
    failed: 0,
    details: []
  };

  for (const candidate of candidates) {
    try {
      const existing = findExistingGhlUser(existingUsers, candidate.email);
      let ghlUserId;
      let action;

      if (existing) {
        ghlUserId = existing._id || existing.id;
        action = 'reused';
        summary.reused += 1;
      } else {
        const created = await createGhlUser(companyId, company.ghlIntegration, candidate);
        ghlUserId = created._id || created.id;
        action = 'created';
        summary.provisioned += 1;

        existingUsers.push({
          _id: ghlUserId,
          email: candidate.email
        });
      }

      await upsertUserMap({
        companyId,
        appUserId: candidate.appUserId,
        ghlUserId,
        role: candidate.role,
        provisionStatus: 'provisioned'
      });

      summary.details.push({
        email: candidate.email,
        role: candidate.role,
        action,
        ghlUserId
      });
    } catch (error) {
      summary.failed += 1;
      try {
        if (candidate.appUserId) {
          await upsertUserMap({
            companyId,
            appUserId: candidate.appUserId,
            ghlUserId: `failed-${candidate.appUserId}`,
            role: candidate.role,
            provisionStatus: 'failed',
            lastError: error.message
          });
        }
      } catch (mapError) {
        logger.error(
          `Failed to persist provisioning failure map for company ${companyId} email ${candidate.email}: ${mapError.message}`
        );
      }
      summary.details.push({
        email: candidate.email,
        role: candidate.role,
        action: 'failed',
        error: error.message
      });
      logger.error(
        `GHL user provisioning failed for company ${companyId} email ${candidate.email}: ${error.message}`
      );
    }
  }

  logger.info(
    `GHL user provisioning complete for company ${companyId}: created=${summary.provisioned}, reused=${summary.reused}, failed=${summary.failed}`
  );

  return summary;
}

module.exports = {
  provisionCompanyUsers,
  ensureCompanyAdminUser,
  syncLoanOfficerToGhl,
  getCompanyAdminLinkStatus
};
