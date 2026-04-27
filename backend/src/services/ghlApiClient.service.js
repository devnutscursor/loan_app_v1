const axios = require('axios');
const ApiError = require('../utils/apiError');
const { getGhlConfig } = require('../config/ghl.config');
const { getValidAccessToken, refreshCompanyToken, markSyncError } = require('./ghlToken.service');

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

async function request(companyId, method, path, options = {}) {
  const cfg = getGhlConfig();
  const {
    params,
    data,
    headers = {},
    retryOnUnauthorized = true
  } = options;

  const token = await getValidAccessToken(companyId);
  const requestConfig = {
    method,
    url: `${cfg.baseUrl}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: cfg.version,
      Accept: 'application/json',
      ...headers
    },
    params,
    data,
    timeout: 30000,
    transitional: {
      forcedJSONParsing: false,
      silentJSONParsing: true
    }
  };

  try {
    const response = await axios(requestConfig);
    return safeParseResponseData(response.data);
  } catch (error) {
    if (retryOnUnauthorized && error?.response?.status === 401) {
      await refreshCompanyToken(companyId, { force: true });
      return request(companyId, method, path, {
        params,
        data,
        headers,
        retryOnUnauthorized: false
      });
    }

    const responseData = safeParseResponseData(error?.response?.data);
    const remoteMessage =
      responseData?.message ||
      responseData?.error_description ||
      responseData?.error;
    const message = remoteMessage || error.message || 'Unknown GHL API error';
    await markSyncError(companyId, message);
    const apiError = new ApiError(`GHL API request failed: ${message}`, error?.response?.status || 500);
    apiError.responseData = responseData;
    apiError.originalError = error;
    throw apiError;
  }
}

module.exports = {
  request
};
