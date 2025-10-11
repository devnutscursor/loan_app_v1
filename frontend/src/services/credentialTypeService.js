import api from './api';

export const credentialTypeService = {
  getAvailableTypes: async () => {
    const response = await api.get('/credit-vendor-credentials/types');
    return response;
  }
};
