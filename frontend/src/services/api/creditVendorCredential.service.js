import api, { handleResponse } from '../api.service';

const CredentialService = {
  listForLender: async (userId, { scope } = {}) => {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return handleResponse(api.get(`/api/v1/credit-vendor-credentials/lender/${userId}${qs}`));
  },
  listForCompany: async (companyId) => {
    return handleResponse(api.get(`/api/v1/credit-vendor-credentials/company/${companyId}`));
  },
  create: async ({ ownerType, ownerId, vendorKey, vendorName, username, password, credentialType, smartApiUrl, creditApiUrl, mclInterface, mlcId }) => {
    return handleResponse(api.post('/api/v1/credit-vendor-credentials', {
      ownerType,
      ownerId,
      vendorKey,
      vendorName,
      username,
      password,
      credentialType,
      smartApiUrl,
      creditApiUrl,
      mclInterface,
      mlcId
    }));
  },
  update: async (id, payload) => {
    const { vendorKey, username, password, credentialType } = payload || {};
    return handleResponse(api.put(`/api/v1/credit-vendor-credentials/${id}`, {
      vendorKey,
      username,
      password,
      credentialType
    }));
  },
  remove: async (id) => {
    return handleResponse(api.delete(`/api/v1/credit-vendor-credentials/${id}`));
  }
};

export default CredentialService;


