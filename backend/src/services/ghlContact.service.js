const Company = require('../models/company.model');
const Borrower = require('../models/borrower.model');
const Lender = require('../models/lender.model');
const GhlContactMap = require('../models/ghlContactMap.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { request } = require('./ghlApiClient.service');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.trim();
}

// Returns the last 10 digits of the phone number for loose matching across
// different stored formats (e.g. "+11234567890" vs "1234567890").
function phoneTail(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  return digits.slice(-10);
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return '';
}

function getContactsArray(response) {
  if (Array.isArray(response?.contacts)) return response.contacts;
  if (Array.isArray(response?.data?.contacts)) return response.data.contacts;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

async function searchContacts(companyId, locationId, query) {
  if (!query) return [];
  const res = await request(companyId, 'GET', '/contacts/', {
    params: {
      locationId,
      limit: 50,
      query
    }
  });
  return getContactsArray(res);
}

function matchContactByEmail(contacts, emailNorm) {
  if (!emailNorm) return null;
  return contacts.find((c) => normalizeEmail(c?.email) === emailNorm) || null;
}

function matchContactByPhone(contacts, phoneNorm) {
  if (!phoneNorm) return null;
  const tail = phoneNorm.slice(-10);
  return (
    contacts.find((c) => {
      const cDigits = normalizePhone(c?.phone);
      if (!cDigits) return false;
      if (cDigits === phoneNorm) return true;
      // Loose match on the last 10 digits to tolerate country-code differences
      return cDigits.slice(-10) === tail;
    }) || null
  );
}

function extractDuplicateContactId(err) {
  const rd = err?.responseData;
  if (!rd) return null;
  return (
    rd?.meta?.contactId ||
    rd?.meta?.contact?.id ||
    rd?.meta?.contact?._id ||
    rd?.contactId ||
    rd?.data?.contactId ||
    null
  );
}

function isDuplicateContactError(err) {
  if (!err) return false;
  const status = err.statusCode || err?.originalError?.response?.status;
  if (status !== 400 && status !== 409 && status !== 422) return false;
  const msg = String(err.message || '').toLowerCase();
  const rdMsg = String(err?.responseData?.message || '').toLowerCase();
  return (
    msg.includes('duplicate') ||
    rdMsg.includes('duplicate') ||
    msg.includes('duplicated contacts') ||
    rdMsg.includes('duplicated contacts')
  );
}

async function createContact(companyId, locationId, payload) {
  try {
    const res = await request(companyId, 'POST', '/contacts/', {
      data: {
        locationId,
        ...payload
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const created = res?.contact || res?.data?.contact || res?.data || res;
    const ghlContactId = created?._id || created?.id;
    if (!ghlContactId) {
      throw new ApiError('GHL contact create did not return an ID', 500);
    }
    return { ghlContactId, created, duplicate: false };
  } catch (err) {
    if (isDuplicateContactError(err)) {
      const existingId = extractDuplicateContactId(err);
      if (existingId) {
        logger.info(
          `GHL duplicate contact detected during create (companyId=${companyId}); reusing existing contact ${existingId}`
        );
        return { ghlContactId: existingId, created: null, duplicate: true };
      }
      logger.warn(
        `GHL duplicate contact error but no contactId in response for companyId=${companyId}: ${JSON.stringify(err?.responseData || {})}`
      );
    }
    throw err;
  }
}

async function updateContact(companyId, ghlContactId, payload) {
  await request(companyId, 'PUT', `/contacts/${ghlContactId}`, {
    data: payload,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

async function resolveCompanyLocation(companyId) {
  const company = await Company.findById(companyId).select('name ghlIntegration');
  if (!company) throw new ApiError('Company not found', 404);
  if (!company.ghlIntegration?.connected) return { company, connected: false, locationId: null };
  if (!company.ghlIntegration?.locationId) return { company, connected: false, locationId: null };
  return { company, connected: true, locationId: company.ghlIntegration.locationId };
}

async function resolveOrCreateBorrowerContact({ companyId, borrowerId, assignedToGhlUserId = null }) {
  const borrower = await Borrower.findById(borrowerId)
    .populate('user', 'firstName lastName email phone isActive')
    .populate('lender', 'company')
    .select('user lender')
    .lean();

  if (!borrower) throw new ApiError('Borrower not found', 404);
  if (!borrower.user || !borrower.user.isActive) throw new ApiError('Borrower user not found or inactive', 400);

  // Validate borrower belongs to same company via lender.company
  const lenderCompanyId = borrower?.lender?.company;
  if (!lenderCompanyId || String(lenderCompanyId) !== String(companyId)) {
    // Fallback: some borrower docs might not have lender populated with company
    const lender = await Lender.findById(borrower.lender).select('company').lean();
    if (!lender?.company || String(lender.company) !== String(companyId)) {
      throw new ApiError('Borrower does not belong to this company', 403);
    }
  }

  const { connected, locationId } = await resolveCompanyLocation(companyId);
  if (!connected) {
    return { skipped: true, reason: 'GHL not connected', ghlContactId: null, action: 'skipped' };
  }

  const emailNorm = normalizeEmail(borrower.user.email);
  const phoneNorm = normalizePhone(borrower.user.phone);

  // Reuse mapping if present
  const existingMap = await GhlContactMap.findOne({
    companyId,
    $or: [{ borrowerId }, { borrowerUserId: borrower.user._id }]
  })
    .select('ghlContactId')
    .lean();

  if (existingMap?.ghlContactId) {
    // Ensure ownership if requested (best-effort)
    if (assignedToGhlUserId) {
      try {
        await updateContact(companyId, existingMap.ghlContactId, { assignedTo: assignedToGhlUserId });
      } catch (e) {
        logger.warn(`GHL contact ownership update failed for mapped contact ${existingMap.ghlContactId}: ${e.message}`);
      }
    }
    return { ghlContactId: existingMap.ghlContactId, action: 'mapped' };
  }

  // Search by email
  let contacts = [];
  if (emailNorm) {
    contacts = await searchContacts(companyId, locationId, emailNorm);
    const match = matchContactByEmail(contacts, emailNorm);
    if (match) {
      const ghlContactId = match._id || match.id;
      if (assignedToGhlUserId) {
        try {
          await updateContact(companyId, ghlContactId, { assignedTo: assignedToGhlUserId });
        } catch (e) {
          logger.warn(`GHL contact ownership update failed for contact ${ghlContactId}: ${e.message}`);
        }
      }
      await GhlContactMap.findOneAndUpdate(
        { companyId, borrowerId },
        {
          $set: {
            borrowerUserId: borrower.user._id,
            ghlContactId,
            emailNorm,
            phoneNorm,
            lastSyncedAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return { ghlContactId, action: 'reused_email' };
    }
  }

  // Search by phone
  if (phoneNorm) {
    const phoneContacts = await searchContacts(companyId, locationId, phoneNorm);
    const match = matchContactByPhone(phoneContacts, phoneNorm);
    if (match) {
      const ghlContactId = match._id || match.id;
      if (assignedToGhlUserId) {
        try {
          await updateContact(companyId, ghlContactId, { assignedTo: assignedToGhlUserId });
        } catch (e) {
          logger.warn(`GHL contact ownership update failed for contact ${ghlContactId}: ${e.message}`);
        }
      }
      await GhlContactMap.findOneAndUpdate(
        { companyId, borrowerId },
        {
          $set: {
            borrowerUserId: borrower.user._id,
            ghlContactId,
            emailNorm,
            phoneNorm,
            lastSyncedAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return { ghlContactId, action: 'reused_phone' };
    }
  }

  // Fallback create (name + whatever fields we have)
  const firstName = pickFirstNonEmpty(borrower.user.firstName, 'Borrower');
  const lastName = pickFirstNonEmpty(borrower.user.lastName, 'Contact');

  const { ghlContactId, duplicate } = await createContact(companyId, locationId, {
    firstName,
    lastName,
    email: emailNorm || undefined,
    phone: borrower.user.phone || undefined,
    // Assign contact owner to loan officer in GHL (if available)
    assignedTo: assignedToGhlUserId || undefined
  });

  // If the contact already existed in GHL and we recovered it from the duplicate
  // response, best-effort push ownership onto it so the loan officer still owns it.
  if (duplicate && assignedToGhlUserId) {
    try {
      await updateContact(companyId, ghlContactId, { assignedTo: assignedToGhlUserId });
    } catch (e) {
      logger.warn(
        `GHL contact ownership update failed for recovered duplicate contact ${ghlContactId}: ${e.message}`
      );
    }
  }

  await GhlContactMap.findOneAndUpdate(
    { companyId, borrowerId },
    {
      $set: {
        borrowerUserId: borrower.user._id,
        ghlContactId,
        emailNorm,
        phoneNorm,
        lastSyncedAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const action = duplicate ? 'reused_duplicate' : 'created';
  logger.info(`GHL contact resolved for borrower ${borrowerId}: action=${action} contactId=${ghlContactId}`);
  return { ghlContactId, action };
}

module.exports = {
  resolveOrCreateBorrowerContact
};

