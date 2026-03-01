import customAxios from '../utils/axios';

const API_BASE = '/api/v1';

/**
 * MCR Service — Frontend API service for MCR functionality
 */
class MCRService {
  // ===== Report Generation & Management =====

  async generateReport(year, period, states, reportType, loanOfficerId = null, lenderId = null) {
    const body = { year, period, states, reportType, loanOfficerId };
    if (lenderId) body.lenderId = lenderId;
    const response = await customAxios.post(`${API_BASE}/mcr/generate`, body);
    return response.data;
  }

  async getReports(lenderId = null) {
    const params = lenderId ? { lenderId } : {};
    const response = await customAxios.get(`${API_BASE}/mcr/reports`, { params });
    return response.data;
  }

  async getReport(id) {
    const response = await customAxios.get(`${API_BASE}/mcr/reports/${id}`);
    return response.data;
  }

  async updateReportStatus(id, status, notes = '') {
    const response = await customAxios.put(`${API_BASE}/mcr/reports/${id}`, { status, notes });
    return response.data;
  }

  async deleteReport(id) {
    const response = await customAxios.delete(`${API_BASE}/mcr/reports/${id}`);
    return response.data;
  }

  async exportReport(id, format = 'excel', state = 'all') {
    if (format === 'excel' || format === 'xml') {
      const response = await customAxios.get(`${API_BASE}/mcr/reports/${id}/export`, {
        params: { format, state },
        responseType: 'blob',
      });
      // Trigger browser download
      const ext = format === 'excel' ? 'xlsx' : 'xml';
      const mimeType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/xml';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MCR_Report_${id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { status: 'success' };
    }
    // JSON fallback
    const response = await customAxios.get(`${API_BASE}/mcr/reports/${id}/export`, {
      params: { format, state }
    });
    return response.data;
  }

  // ===== State Configuration =====

  async getStateConfigs() {
    const response = await customAxios.get(`${API_BASE}/mcr/states`);
    return response.data;
  }

  async updateStateConfig(stateCode, data) {
    const response = await customAxios.put(`${API_BASE}/mcr/states/${stateCode}`, data);
    return response.data;
  }

  // ===== Financial Condition =====

  async getFinancialCondition(year, quarter) {
    const response = await customAxios.get(`${API_BASE}/mcr/financial-condition/${year}/${quarter}`);
    return response.data;
  }

  async saveFinancialCondition(year, quarter, data) {
    const response = await customAxios.put(`${API_BASE}/mcr/financial-condition/${year}/${quarter}`, data);
    return response.data;
  }

  // ===== Admin — Lender list =====
  async getLendersForMCR() {
    const response = await customAxios.get(`${API_BASE}/mcr/lenders`);
    return response.data;
  }
}

/**
 * Loan Compensation Service — Frontend API for per-loan MCR data
 */
class LoanCompensationService {
  async getCompensation(loanId) {
    const response = await customAxios.get(`${API_BASE}/loan-compensation/${loanId}/compensation`);
    return response.data;
  }

  async updateCompensation(loanId, data) {
    const response = await customAxios.put(`${API_BASE}/loan-compensation/${loanId}/compensation`, data);
    return response.data;
  }

  async getStatusHistory(loanId) {
    const response = await customAxios.get(`${API_BASE}/loan-compensation/${loanId}/status-history`);
    return response.data;
  }

  async syncMCRDefaults(loanId) {
    const response = await customAxios.post(`${API_BASE}/loan-compensation/${loanId}/sync-mcr`);
    return response.data;
  }
}

export const mcrService = new MCRService();
export const loanCompensationService = new LoanCompensationService();
export { MCRService, LoanCompensationService };
export default mcrService;
