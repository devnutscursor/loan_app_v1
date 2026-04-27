const crypto = require('crypto');
const Company = require('../models/company.model');
const Lender = require('../models/lender.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { getGhlConfig } = require('../config/ghl.config');
const { request } = require('../services/ghlApiClient.service');
const {
  exchangeAuthorizationCode,
  storeTokenPair,
  refreshCompanyToken
} = require('../services/ghlToken.service');
const {
  ensureCompanyAdminUser,
  getCompanyAdminLinkStatus,
  syncLoanOfficerToGhl
} = require('../services/ghlUserProvisioning.service');
const { resolveOrCreateBorrowerContact } = require('../services/ghlContact.service');
const { getPipelines, resolveOpportunityConfig, syncOpportunityForLoanManual } = require('../services/ghlOpportunity.service');
const GhlUserMap = require('../models/ghlUserMap.model');
const GhlContactMap = require('../models/ghlContactMap.model');
const Borrower = require('../models/borrower.model');
const Loan = require('../models/loan.model');

function encodeState(payload, secret) {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function decodeState(state, secret) {
  if (!state || !state.includes('.')) {
    throw new ApiError('Invalid OAuth state', 400);
  }

  const [data, sig] = state.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expectedSig) {
    throw new ApiError('Invalid OAuth state signature', 400);
  }

  const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  if (!decoded.companyId || !decoded.userId || !decoded.ts) {
    throw new ApiError('Malformed OAuth state payload', 400);
  }

  return decoded;
}

async function resolveAuthorizedCompanyId(req) {
  const companyId = req.query.companyId || req.body.companyId;
  if (!companyId) {
    throw new ApiError('companyId is required', 400);
  }

  if (req.user.role === 'admin') {
    return companyId;
  }

  if (req.user.role === 'company') {
    if (!req.user.company || req.user.company.toString() !== companyId) {
      throw new ApiError('You are not authorized for this company', 403);
    }
    return companyId;
  }

  if (req.user.role === 'lender') {
    const lender = await Lender.findOne({ user: req.user._id }).select('company');
    if (!lender || lender.company.toString() !== companyId) {
      throw new ApiError('You are not authorized for this company', 403);
    }
    return companyId;
  }

  throw new ApiError('Role not authorized to manage GHL integration', 403);
}

async function resolveCompanyIdOptional(req) {
  const companyId = req.query.companyId || req.body.companyId;
  if (companyId) {
    return resolveAuthorizedCompanyId(req);
  }

  if (req.user.role === 'admin') {
    throw new ApiError('companyId is required', 400);
  }

  if (req.user.role === 'company') {
    if (!req.user.company) {
      throw new ApiError('companyId is required', 400);
    }
    return req.user.company.toString();
  }

  if (req.user.role === 'lender') {
    const lender = await Lender.findOne({ user: req.user._id }).select('company');
    if (lender?.company) {
      return lender.company.toString();
    }
    // Fallback: infer from existing provisioned GHL user mapping
    const anyMap = await GhlUserMap.findOne({
      appUserId: req.user._id,
      provisionStatus: 'provisioned'
    })
      .select('companyId')
      .lean();
    if (anyMap?.companyId) {
      return anyMap.companyId.toString();
    }
    throw new ApiError('Unable to resolve company for lender', 400);
  }

  throw new ApiError('Role not authorized to manage GHL integration', 403);
}

exports.getConnectUrl = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const cfg = getGhlConfig();

    const state = encodeState(
      {
        companyId,
        userId: req.user._id.toString(),
        ts: Date.now()
      },
      cfg.oauthStateSecret
    );

    const connectUrl = new URL('/oauth/chooselocation', cfg.marketplaceUrl);
    connectUrl.searchParams.set('response_type', 'code');
    connectUrl.searchParams.set('redirect_uri', cfg.oauthRedirectUri);
    connectUrl.searchParams.set('client_id', cfg.locationClientId);
    connectUrl.searchParams.set('scope', cfg.oauthScopes);
    connectUrl.searchParams.set('state', state);

    res.status(200).json({
      status: 'success',
      data: {
        connectUrl: connectUrl.toString()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.oauthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return next(new ApiError('Missing OAuth authorization code', 400));
    }
    if (!state) {
      return next(new ApiError('Missing OAuth state', 400));
    }

    const cfg = getGhlConfig();
    const parsedState = decodeState(state, cfg.oauthStateSecret);

    const company = await Company.findById(parsedState.companyId);
    if (!company) {
      return next(new ApiError('Company not found for OAuth callback', 404));
    }

    const tokenPayload = await exchangeAuthorizationCode({ code });
    await storeTokenPair(company._id, tokenPayload);

    logger.info(`GHL OAuth connection completed for company ${company._id}`);
    const responsePayload = {
      companyId: company._id,
      locationId: tokenPayload.locationId || tokenPayload.location_id || null,
      expiresIn: tokenPayload.expires_in || null
    };

    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
    if (acceptsHtml) {
      const safePayload = JSON.stringify(responsePayload).replace(/</g, '\\u003c');
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const successRedirectUrl = `${frontendUrl}/company/profile?ghlConnected=success`;

      // Keep opener access available for the OAuth popup even though frontend and backend
      // are on different origins in production.
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');

      return res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GHL Connected</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
      .card { max-width: 560px; margin: 60px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
      .title { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #16a34a; }
      .desc { font-size: 14px; color: #475569; margin-bottom: 12px; }
      .small { font-size: 12px; color: #64748b; }
      .btn { margin-top: 14px; display: inline-block; padding: 8px 14px; border-radius: 8px; background: #2563eb; color: white; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">GoHighLevel connected successfully</div>
      <p class="desc">Your company is now connected. Returning you to the app...</p>
      <p class="small">If this window does not close automatically, use the button below.</p>
      <button class="btn" onclick="returnToApp()">Return to app</button>
    </div>
    <script>
      (function () {
        var appUrl = ${JSON.stringify(successRedirectUrl)};
        var notified = false;
        window.returnToApp = function () {
          try {
            window.close();
          } catch (e) {}
          setTimeout(function () {
            window.location.replace(appUrl);
          }, 250);
        };

        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: 'GHL_OAUTH_CONNECTED', payload: ${safePayload} },
              ${JSON.stringify(frontendUrl)}
            );
            notified = true;
          }
        } catch (e) {}

        try {
          window.close();
        } catch (e) {}

        if (notified) {
          setTimeout(function () {
            window.close();
          }, 800);
        } else {
          setTimeout(function () {
            window.location.replace(appUrl);
          }, 1000);
        }
      })();
    </script>
  </body>
</html>`);
    }

    res.status(200).json({
      status: 'success',
      message: 'GHL account connected successfully',
      data: responsePayload
    });
  } catch (error) {
    next(error);
  }
};

exports.getIntegrationStatus = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const company = await Company.findById(companyId).select('name ghlIntegration');

    if (!company) {
      return next(new ApiError('Company not found', 404));
    }

    const adminUser = await getCompanyAdminLinkStatus(companyId, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        companyId: company._id,
        companyName: company.name,
        ghlIntegration: company.ghlIntegration || { connected: false },
        adminUser
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTokenStorageStatus = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const company = await Company.findById(companyId).select(
      'name ghlIntegration.connected ghlIntegration.locationId ghlIntegration.tokenExpiresAt ghlIntegration.lastTokenRefreshAt +ghlIntegration.accessTokenEnc +ghlIntegration.accessTokenIv +ghlIntegration.accessTokenAuthTag +ghlIntegration.refreshTokenEnc +ghlIntegration.refreshTokenIv +ghlIntegration.refreshTokenAuthTag'
    );

    if (!company) {
      return next(new ApiError('Company not found', 404));
    }

    const integration = company.ghlIntegration || {};
    const tokenStorage = {
      hasAccessTokenParts: Boolean(
        integration.accessTokenEnc &&
          integration.accessTokenIv &&
          integration.accessTokenAuthTag
      ),
      hasRefreshTokenParts: Boolean(
        integration.refreshTokenEnc &&
          integration.refreshTokenIv &&
          integration.refreshTokenAuthTag
      )
    };

    res.status(200).json({
      status: 'success',
      data: {
        companyId: company._id,
        companyName: company.name,
        connected: Boolean(integration.connected),
        locationId: integration.locationId || null,
        tokenExpiresAt: integration.tokenExpiresAt || null,
        lastTokenRefreshAt: integration.lastTokenRefreshAt || null,
        tokenStorage
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshIntegrationToken = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const result = await refreshCompanyToken(companyId, { force: true });
    res.status(200).json({
      status: 'success',
      message: 'GHL token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.disconnectIntegration = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const company = await Company.findById(companyId).select('+ghlIntegration.accessTokenEnc +ghlIntegration.refreshTokenEnc');

    if (!company) {
      return next(new ApiError('Company not found', 404));
    }

    company.ghlIntegration = {
      connected: false,
      connectedAt: company.ghlIntegration?.connectedAt
    };

    await company.save();

    res.status(200).json({
      status: 'success',
      message: 'GHL integration disconnected'
    });
  } catch (error) {
    next(error);
  }
};

exports.healthCheck = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const company = await Company.findById(companyId).select('ghlIntegration');
    if (!company || !company.ghlIntegration?.connected) {
      return next(new ApiError('Company is not connected to GHL', 400));
    }

    const locationId = company.ghlIntegration.locationId;
    if (!locationId) {
      return next(new ApiError('Connected company is missing GHL locationId', 400));
    }

    await request(companyId, 'GET', '/contacts/', {
      params: {
        locationId,
        limit: 1
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        healthy: true
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createAdminUser = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const result = await ensureCompanyAdminUser(companyId, req.user);
    res.status(200).json({
      status: 'success',
      message: 'GHL admin user is ready',
      data: result
    });
  } catch (error) {
    logger.error(`GHL create-admin-user failed: ${error.message}`, {
      stack: error.stack,
      statusCode: error.statusCode,
      responseData: error.response?.data
    });
    next(error);
  }
};

exports.linkLoanOfficerUser = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const appUserId = req.body?.appUserId || req.query?.appUserId;
    if (!appUserId) {
      throw new ApiError('appUserId is required', 400);
    }

    const user = await User.findById(appUserId).select(
      'firstName lastName email phone isActive role company'
    );
    if (!user || !user.isActive) {
      throw new ApiError('User not found or inactive', 404);
    }
    if (user.role !== 'lender') {
      throw new ApiError('Only lender users can be linked as loan officers', 400);
    }
    // Some lender users may not have `user.company` set; the canonical link is via Lender.company.
    if (user.company && user.company.toString() !== String(companyId)) {
      throw new ApiError('User does not belong to this company', 403);
    }
    if (!user.company) {
      const lender = await Lender.findOne({ user: user._id }).select('company');
      if (!lender || !lender.company || lender.company.toString() !== String(companyId)) {
        throw new ApiError('User does not belong to this company', 403);
      }
    }

    const result = await syncLoanOfficerToGhl({
      companyId,
      appUser: user
    });

    res.status(200).json({
      status: 'success',
      message: 'Loan officer linked to GHL',
      data: {
        appUserId: String(user._id),
        email: user.email,
        ...result
      }
    });
  } catch (error) {
    logger.error(`GHL link-loan-officer failed: ${error.message}`, {
      stack: error.stack,
      statusCode: error.statusCode,
      responseData: error.response?.data
    });
    next(error);
  }
};

exports.linkBorrowerContact = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyIdOptional(req);
    const borrowerId = req.body?.borrowerId || req.query?.borrowerId;
    if (!borrowerId) {
      throw new ApiError('borrowerId is required', 400);
    }

    const borrower = await Borrower.findById(borrowerId).populate('lender', 'company').select('lender');
    if (!borrower) {
      throw new ApiError('Borrower not found', 404);
    }

    const borrowerCompanyId = borrower?.lender?.company?.toString();
    if (!borrowerCompanyId || borrowerCompanyId !== String(companyId)) {
      throw new ApiError('Borrower does not belong to this company', 403);
    }

    let assignedToGhlUserId = null;
    if (req.user.role === 'lender') {
      const map = await GhlUserMap.findOne({ companyId, appUserId: req.user._id })
        .select('ghlUserId')
        .lean();
      assignedToGhlUserId = map?.ghlUserId || null;
    }

    const result = await resolveOrCreateBorrowerContact({
      companyId,
      borrowerId,
      assignedToGhlUserId
    });

    res.status(200).json({
      status: 'success',
      message: 'Borrower linked to GHL',
      data: result
    });
  } catch (error) {
    logger.error(`GHL link-borrower-contact failed: ${error.message}`, {
      stack: error.stack,
      statusCode: error.statusCode,
      responseData: error.response?.data
    });
    next(error);
  }
};

exports.getOpportunityPipelines = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyIdOptional(req);
    const { connected, locationId, pipelines } = await getPipelines(companyId);
    res.status(200).json({
      status: 'success',
      data: { connected, locationId, pipelines }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOpportunityConfig = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const company = await Company.findById(companyId).select('ghlIntegration').lean();
    if (!company) throw new ApiError('Company not found', 404);

    res.status(200).json({
      status: 'success',
      data: {
        connected: Boolean(company.ghlIntegration?.connected),
        locationId: company.ghlIntegration?.locationId || null,
        opportunityConfig: company.ghlIntegration?.opportunityConfig || { pipelineId: null, stageByStatus: {} }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.setOpportunityConfig = async (req, res, next) => {
  try {
    const companyId = await resolveAuthorizedCompanyId(req);
    const { pipelineId, stageByStatus, opportunityStatusByLoanStatus } = req.body || {};
    if (!pipelineId) throw new ApiError('pipelineId is required', 400);

    await Company.findByIdAndUpdate(
      companyId,
      {
        $set: {
          'ghlIntegration.opportunityConfig.pipelineId': String(pipelineId).trim(),
          'ghlIntegration.opportunityConfig.stageByStatus': stageByStatus || {},
          'ghlIntegration.opportunityConfig.opportunityStatusByLoanStatus': opportunityStatusByLoanStatus || {}
        }
      },
      { new: true }
    );

    // Validate config is readable / connected (throws helpful errors)
    const cfg = await resolveOpportunityConfig(companyId);

    res.status(200).json({
      status: 'success',
      message: 'GHL opportunity configuration saved',
      data: cfg
    });
  } catch (error) {
    next(error);
  }
};

async function resolveCompanyIdForLoan(req, loanId) {
  // admin/company can pass explicit companyId in query/body
  const explicit = req.query.companyId || req.body.companyId;
  if (explicit) return resolveAuthorizedCompanyId(req);

  // lender: infer companyId from lender profile or existing mapping
  if (req.user.role === 'lender') {
    const lender = await Lender.findOne({ user: req.user._id }).select('company').lean();
    if (lender?.company) return lender.company;
    const anyMap = await GhlUserMap.findOne({ appUserId: req.user._id, provisionStatus: 'provisioned' })
      .select('companyId')
      .lean();
    if (anyMap?.companyId) return anyMap.companyId;
  }

  // fallback: infer from loan's lender -> company
  const loan = await Loan.findById(loanId).select('lender').lean();
  if (loan?.lender) {
    const lender = await Lender.findById(loan.lender).select('company').lean();
    if (lender?.company) return lender.company;
  }

  throw new ApiError('Unable to resolve companyId for this operation', 400);
}

exports.syncLoanOpportunity = async (req, res, next) => {
  try {
    const { loanId, pipelineId, pipelineStageId, opportunityStatus, assignedToGhlUserId, contactId } = req.body || {};
    if (!loanId) throw new ApiError('loanId is required', 400);

    const companyId = await resolveCompanyIdForLoan(req, loanId);

    // If lender is syncing, never trust/require assignedTo input: assign to that loan officer in service.
    const assignedOverride = req.user.role === 'lender' ? null : (assignedToGhlUserId || null);

    const result = await syncOpportunityForLoanManual({
      companyId,
      loanId,
      pipelineId,
      pipelineStageId,
      opportunityStatus,
      assignedToGhlUserId: assignedOverride,
      contactId: contactId || null
    });

    res.status(200).json({
      status: 'success',
      message: `GHL opportunity ${result.action}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.getLoanOfficerGhlContacts = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyIdOptional(req);

    // Lender: only their own contacts
    if (req.user.role === 'lender') {
      const lender = await Lender.findOne({ user: req.user._id }).select('_id').lean();
      if (!lender?._id) throw new ApiError('Lender profile not found', 404);

      const borrowers = await Borrower.find({ lender: lender._id })
        .populate('user', 'firstName lastName email phone')
        .select('_id user')
        .lean();

      const borrowerIds = borrowers.map((b) => b._id);
      const maps = await GhlContactMap.find({ companyId, borrowerId: { $in: borrowerIds } })
        .select('borrowerId ghlContactId')
        .lean();

      const mapByBorrower = new Map(maps.map((m) => [String(m.borrowerId), m.ghlContactId]));

      const contacts = borrowers
        .map((b) => {
          const ghlContactId = mapByBorrower.get(String(b._id)) || null;
          if (!ghlContactId) return null;
          const name = `${b?.user?.firstName || ''} ${b?.user?.lastName || ''}`.trim();
          return {
            borrowerId: b._id,
            ghlContactId,
            name: name || b?.user?.email || ghlContactId,
            email: b?.user?.email || null,
            phone: b?.user?.phone || null
          };
        })
        .filter(Boolean);

      res.status(200).json({ status: 'success', data: { contacts } });
      return;
    }

    throw new ApiError('Only lenders can use this endpoint currently', 403);
  } catch (error) {
    next(error);
  }
};
