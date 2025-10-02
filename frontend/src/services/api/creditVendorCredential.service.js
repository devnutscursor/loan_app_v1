import api, { handleResponse } from '../api.service';

const CredentialService = {
  listForLender: async (userId, { scope } = {}) => {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return handleResponse(api.get(`/api/v1/credit-vendor-credentials/lender/${userId}${qs}`));
  },
  listForCompany: async (companyId) => {
    return handleResponse(api.get(`/api/v1/credit-vendor-credentials/company/${companyId}`));
  },
  create: async ({ ownerType, ownerId, vendorKey, vendorName, username, password }) => {
    return handleResponse(api.post('/api/v1/credit-vendor-credentials', {
      ownerType,
      ownerId,
      vendorKey,
      vendorName,
      username,
      password
    }));
  },
  update: async (id, { vendorKey, vendorName, username, password }) => {
    return handleResponse(api.put(`/api/v1/credit-vendor-credentials/${id}`, {
      vendorKey,
      vendorName,
      username,
      password
    }));
  },
  remove: async (id) => {
    return handleResponse(api.delete(`/api/v1/credit-vendor-credentials/${id}`));
  }
};

export default CredentialService;


