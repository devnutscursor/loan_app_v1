import api from './api';

export const meridianLinkService = {
  async getProviders() {
    try {
      const response = await api.get('/credit-vendor-credentials/meridianlink-providers');
      return response;
    } catch (error) {
      console.error('Error fetching MeridianLink providers:', error);
      throw error;
    }
  }
};
