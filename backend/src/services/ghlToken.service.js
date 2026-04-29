const axios = require('axios');
const Company = require('../models/company.model');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const { encryptToken, decryptToken } = require('../utils/ghlTokenCrypto');
const { getGhlConfig } = require('../config/ghl.config');

function safeParseResponseData(data) {
  if (typeof data !== 'string') return data;
  const trimmed = data.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return data;
  }
}

function normalizeErrorMessage(value, fallback = 'Unknown error') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join('; ');
    return joined || fallback;
  }
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === 'object') {
    if (typeof value.message === 'string' && value.message) return value.message;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return fallback;
    }
  }
  return String(value);
}

function getCompanyTokenFieldsQuery() {
  return '+ghlIntegration.accessTokenEnc +ghlIntegration.accessTokenIv +ghlIntegration.accessTokenAuthTag +ghlIntegration.refreshTokenEnc +ghlIntegration.refreshTokenIv +ghlIntegration.refreshTokenAuthTag';
}

function getDecryptedAccessToken(company) {
  const integration = company?.ghlIntegration;
  if (!integration?.accessTokenEnc || !integration?.accessTokenIv || !integration?.accessTokenAuthTag) {
    return null;
  }

  return decryptToken(
    integration.accessTokenEnc,
    integration.accessTokenIv,
    integration.accessTokenAuthTag
  );
}

function getDecryptedRefreshToken(company) {
  const integration = company?.ghlIntegration;
  if (!integration?.refreshTokenEnc || !integration?.refreshTokenIv || !integration?.refreshTokenAuthTag) {
    return null;
  }

  return decryptToken(
    integration.refreshTokenEnc,
    integration.refreshTokenIv,
    integration.refreshTokenAuthTag
  );
}

function isTokenExpired(company) {
  const expiresAt = company?.ghlIntegration?.tokenExpiresAt;
  if (!expiresAt) {
    return true;
  }
  return new Date(expiresAt).getTime() <= Date.now();
}

async function exchangeAuthorizationCode({ code }) {
  const cfg = getGhlConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: cfg.locationClientId,
    client_secret: cfg.locationClientSecret,
    redirect_uri: cfg.oauthRedirectUri,
    user_type: 'Location'
  });
  try {
    const { data } = await axios.post(`${cfg.baseUrl}/oauth/token`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      timeout: 30000,
      transitional: {
        forcedJSONParsing: false,
        silentJSONParsing: true
      }
    });

    return safeParseResponseData(data);
  } catch (error) {
    const remote = safeParseResponseData(error?.response?.data);
    const remoteMessage =
      remote?.message ||
      remote?.error_description ||
      remote?.error ||
      error.message ||
      'Authorization code exchange failed';
    throw new ApiError(`GHL OAuth token exchange failed: ${remoteMessage}`, error?.response?.status || 500);
  }
}

async function storeTokenPair(companyId, tokenPayload) {
  const company = await Company.findById(companyId)
    .select(getCompanyTokenFieldsQuery());

  if (!company) {
    throw new ApiError('Company not found', 404);
  }

  const accessEncrypted = encryptToken(tokenPayload.access_token);
  const refreshEncrypted = encryptToken(tokenPayload.refresh_token);
  const expiresAt = new Date(Date.now() + (Number(tokenPayload.expires_in) || 0) * 1000);

  company.ghlIntegration = company.ghlIntegration || {};
  company.ghlIntegration.connected = true;
  company.ghlIntegration.locationId = tokenPayload.locationId || tokenPayload.location_id || company.ghlIntegration.locationId;
  company.ghlIntegration.ghlCompanyId = tokenPayload.companyId || tokenPayload.company_id || company.ghlIntegration.ghlCompanyId;
  company.ghlIntegration.scope = tokenPayload.scope || company.ghlIntegration.scope;
  company.ghlIntegration.accessTokenEnc = accessEncrypted.enc;
  company.ghlIntegration.accessTokenIv = accessEncrypted.iv;
  company.ghlIntegration.accessTokenAuthTag = accessEncrypted.authTag;
  company.ghlIntegration.refreshTokenEnc = refreshEncrypted.enc;
  company.ghlIntegration.refreshTokenIv = refreshEncrypted.iv;
  company.ghlIntegration.refreshTokenAuthTag = refreshEncrypted.authTag;
  company.ghlIntegration.tokenExpiresAt = expiresAt;
  company.ghlIntegration.lastTokenRefreshAt = new Date();
  company.ghlIntegration.connectedAt = company.ghlIntegration.connectedAt || new Date();
  company.ghlIntegration.lastSyncError = undefined;
  company.ghlIntegration.lastSyncErrorAt = undefined;

  await company.save();
  logger.info(
    `GHL tokens stored for company ${company._id} (encrypted at rest). locationId=${company.ghlIntegration.locationId || 'n/a'} expiresAt=${company.ghlIntegration.tokenExpiresAt?.toISOString?.() || 'n/a'}`
  );
  return company;
}

async function refreshCompanyToken(companyId, options = {}) {
  const { force = false } = options;
  const cfg = getGhlConfig();

  const company = await Company.findById(companyId)
    .select(getCompanyTokenFieldsQuery());

  if (!company) {
    throw new ApiError('Company not found', 404);
  }

  if (!company.ghlIntegration?.connected) {
    throw new ApiError('GHL integration is not connected for this company', 400);
  }

  if (!force && !isTokenExpired(company)) {
    return {
      refreshed: false,
      companyId: company._id.toString(),
      tokenExpiresAt: company.ghlIntegration.tokenExpiresAt
    };
  }

  const refreshToken = getDecryptedRefreshToken(company);
  if (!refreshToken) {
    throw new ApiError('Missing refresh token for company integration', 400);
  }

  const body = new URLSearchParams({
    client_id: cfg.locationClientId,
    client_secret: cfg.locationClientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  try {
    const { data } = await axios.post(`${cfg.baseUrl}/oauth/token`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      timeout: 30000,
      transitional: {
        forcedJSONParsing: false,
        silentJSONParsing: true
      }
    });

    await storeTokenPair(company._id, safeParseResponseData(data));
    logger.info(`GHL token refresh completed for company ${company._id}`);

    return {
      refreshed: true,
      companyId: company._id.toString(),
      tokenExpiresAt: new Date(Date.now() + (Number(safeParseResponseData(data)?.expires_in) || 0) * 1000)
    };
  } catch (error) {
    const remote = safeParseResponseData(error?.response?.data);
    const message = normalizeErrorMessage(
      remote?.message ||
      remote?.error_description ||
      remote?.error ||
      error.message ||
      'Token refresh failed'
    );
    company.ghlIntegration.lastSyncError = message;
    company.ghlIntegration.lastSyncErrorAt = new Date();

    if (error?.response?.status === 400 || error?.response?.status === 401) {
      company.ghlIntegration.connected = false;
    }

    await company.save();
    throw new ApiError(`GHL token refresh failed: ${message}`, 401);
  }
}

async function refreshAllCompanyTokens(options = {}) {
  const { onlyExpired = false, force = false } = options;
  const query = { 'ghlIntegration.connected': true };
  if (onlyExpired) {
    query.$or = [
      { 'ghlIntegration.tokenExpiresAt': { $exists: false } },
      { 'ghlIntegration.tokenExpiresAt': { $lte: new Date() } }
    ];
  }

  const companies = await Company.find(query).select('_id name ghlIntegration.tokenExpiresAt');
  const summary = {
    total: companies.length,
    refreshed: 0,
    skipped: 0,
    failed: 0,
    failures: []
  };

  for (const company of companies) {
    try {
      const result = await refreshCompanyToken(company._id, { force });
      if (result.refreshed) {
        summary.refreshed += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({
        companyId: company._id.toString(),
        message: error.message
      });
      logger.error(`GHL token refresh failed for company ${company._id}: ${error.message}`);
    }
  }

  return summary;
}

async function getValidAccessToken(companyId) {
  const company = await Company.findById(companyId)
    .select(getCompanyTokenFieldsQuery());

  if (!company || !company.ghlIntegration?.connected) {
    throw new ApiError('Company is not connected to GHL', 400);
  }

  if (isTokenExpired(company)) {
    await refreshCompanyToken(companyId, { force: true });
    const refreshedCompany = await Company.findById(companyId).select(getCompanyTokenFieldsQuery());
    const token = getDecryptedAccessToken(refreshedCompany);
    if (!token) {
      throw new ApiError('Unable to resolve access token after refresh', 500);
    }
    return token;
  }

  const accessToken = getDecryptedAccessToken(company);
  if (!accessToken) {
    throw new ApiError('Missing access token for company integration', 400);
  }

  return accessToken;
}

async function markSyncError(companyId, message) {
  await Company.findByIdAndUpdate(companyId, {
    $set: {
      'ghlIntegration.lastSyncError': normalizeErrorMessage(message),
      'ghlIntegration.lastSyncErrorAt': new Date()
    }
  });
}

module.exports = {
  exchangeAuthorizationCode,
  storeTokenPair,
  refreshCompanyToken,
  refreshAllCompanyTokens,
  getValidAccessToken,
  markSyncError
};
