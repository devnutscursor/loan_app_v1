import api, { handleResponse } from './api.service';
import { createAuditLog } from '../utils/auditLogger';

/**
 * Analytics Service
 * 
 * Handles all API calls related to analytics and reporting features
 */
const AnalyticsService = {
  /**
   * Get summary metrics for the lender dashboard
   * 
   * @param {string} timeframe - Time period for metrics (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing summary metrics
   */
  getSummaryMetrics: (timeframe = 'month') => {
    return handleResponse(
      api.get('/lender/analytics/summary', {
        params: { timeframe }
      })
    ).then(response => {
      // Log analytics view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_summary',
          `Viewed summary analytics for ${timeframe}`,
          { timeframe }
        );
      }
      return response;
    });
  },

  /**
   * Get loan pipeline data for visualization
   * 
   * @param {string} timeframe - Time period for data (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing pipeline data
   */
  getPipelineData: (timeframe = 'month') => {
    return handleResponse(
      api.get('/lender/analytics/pipeline', {
        params: { timeframe }
      })
    ).then(response => {
      // Log pipeline view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_pipeline',
          `Viewed loan pipeline analytics for ${timeframe}`,
          { timeframe }
        );
      }
      return response;
    });
  },

  /**
   * Get loan distribution data by type
   * 
   * @param {string} timeframe - Time period for data (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing distribution data
   */
  getDistributionData: (timeframe = 'month') => {
    return handleResponse(
      api.get('/lender/analytics/distribution', {
        params: { timeframe }
      })
    ).then(response => {
      // Log distribution view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_distribution',
          `Viewed loan distribution analytics for ${timeframe}`,
          { timeframe }
        );
      }
      return response;
    });
  },

  /**
   * Get performance trend data over time
   * 
   * @param {string} timeframe - Time period for data (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing performance data
   */
  getPerformanceTrends: (timeframe = 'month') => {
    return handleResponse(
      api.get('/lender/analytics/performance', {
        params: { timeframe }
      })
    ).then(response => {
      // Log performance trend view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_performance',
          `Viewed performance trend analytics for ${timeframe}`,
          { timeframe }
        );
      }
      return response;
    });
  },

  /**
   * Export analytics report as CSV
   * 
   * @param {string} reportType - Type of report to export (summary, pipeline, distribution, performance, all)
   * @param {string} timeframe - Time period for data (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing file blob
   */
  exportReport: (reportType, timeframe = 'month') => {
    return api
      .get('/lender/analytics/export', {
        params: { type: reportType, timeframe },
        responseType: 'blob'
      })
      .then(response => {
        // Create a download link for the file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report_${timeframe}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Log export for auditing
        createAuditLog(
          'analytics:export',
          `Exported ${reportType} analytics report for ${timeframe}`,
          { reportType, timeframe }
        );
        
        return {
          success: true,
          message: 'Report exported successfully'
        };
      })
      .catch(error => {
        return {
          success: false,
          error: error.response?.data || { message: 'Failed to export report' },
          status: error.response?.status || 0
        };
      });
  },

  /**
   * Get loan performance metrics for a specific loan
   * 
   * @param {string} loanId - ID of the loan
   * @returns {Promise} Promise object containing loan performance data
   */
  getLoanPerformance: (loanId) => {
    return handleResponse(
      api.get(`/lender/analytics/loans/${loanId}/performance`)
    ).then(response => {
      // Log loan performance view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_loan_performance',
          `Viewed performance analytics for specific loan`,
          { loanId }
        );
      }
      return response;
    });
  },

  /**
   * Get lender portfolio metrics
   * 
   * @param {string} timeframe - Time period for data (day, week, month, quarter, year)
   * @returns {Promise} Promise object containing portfolio data
   */
  getPortfolioMetrics: (timeframe = 'month') => {
    return handleResponse(
      api.get('/lender/analytics/portfolio', {
        params: { timeframe }
      })
    ).then(response => {
      // Log portfolio view for auditing if successful
      if (response.success) {
        createAuditLog(
          'analytics:view_portfolio',
          `Viewed portfolio metrics for ${timeframe}`,
          { timeframe }
        );
      }
      return response;
    });
  }
};

export default AnalyticsService;
