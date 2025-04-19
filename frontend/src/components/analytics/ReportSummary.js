import React from 'react';
import PropTypes from 'prop-types';

/**
 * Report Summary Component
 * 
 * Displays key summary metrics for the lender dashboard with
 * trend indicators and formatted values.
 */
const ReportSummary = ({ summaryData }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get trend icon and class based on percentage change
  const getTrendIndicator = (change) => {
    if (change > 0) {
      return {
        icon: (
          <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ),
        class: 'text-green-600'
      };
    } else if (change < 0) {
      return {
        icon: (
          <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        class: 'text-red-600'
      };
    } else {
      return {
        icon: (
          <svg className="self-center flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ),
        class: 'text-gray-600'
      };
    }
  };

  // Metrics to display in cards
  const metricsData = [
    {
      id: 'applications',
      title: 'Applications',
      value: summaryData.applications.total,
      change: summaryData.applications.change,
      icon: (
        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-blue-500'
    },
    {
      id: 'loans',
      title: 'Active Loans',
      value: summaryData.loans.total,
      change: summaryData.loans.change,
      subtext: formatCurrency(summaryData.loans.volume),
      icon: (
        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-500'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: `${summaryData.conversion.rate}%`,
      change: summaryData.conversion.change,
      icon: (
        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-purple-500'
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: formatCurrency(summaryData.revenue.total),
      change: summaryData.revenue.change,
      icon: (
        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric) => {
        const trend = getTrendIndicator(metric.change);
        
        return (
          <div key={metric.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${metric.bgColor}`}>
                  {metric.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{metric.title}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metric.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${trend.class}`}>
                        {trend.icon}
                        <span className="sr-only">{metric.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                        {Math.abs(metric.change)}%
                      </div>
                    </dd>
                    {metric.subtext && (
                      <dd className="text-sm text-gray-500 mt-1">
                        {metric.subtext}
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

ReportSummary.propTypes = {
  summaryData: PropTypes.shape({
    applications: PropTypes.shape({
      total: PropTypes.number.isRequired,
      change: PropTypes.number.isRequired
    }).isRequired,
    loans: PropTypes.shape({
      total: PropTypes.number.isRequired,
      volume: PropTypes.number.isRequired,
      change: PropTypes.number.isRequired
    }).isRequired,
    conversion: PropTypes.shape({
      rate: PropTypes.number.isRequired,
      change: PropTypes.number.isRequired
    }).isRequired,
    revenue: PropTypes.shape({
      total: PropTypes.number.isRequired,
      change: PropTypes.number.isRequired
    }).isRequired
  }).isRequired
};

export default ReportSummary;
