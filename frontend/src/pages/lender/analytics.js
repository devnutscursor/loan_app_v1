import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';

/**
 * Lender Analytics Dashboard
 * 
 * Provides comprehensive reporting and analytics capabilities for lenders
 * to track loan performance, conversion metrics, and portfolio analysis.
 */
const LenderAnalytics = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // day, week, month, quarter, year
  const [dashboardData, setDashboardData] = useState(null);
  
  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);
  
  // Mock function to fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call with timeframe
      // const response = await api.get(`/analytics?timeframe=${timeframe}`);
      // setDashboardData(response.data);
      
      // For demo purposes, using mock data
      setTimeout(() => {
        const mockData = generateMockData();
        setDashboardData(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setLoading(false);
    }
  };
  
  // Generate mock data based on selected timeframe
  const generateMockData = () => {
    // Values would vary based on timeframe in a real app
    return {
      summary: {
        applications: {
          total: 87,
          change: 12.5,
          byStatus: {
            new: 23,
            inReview: 18,
            approved: 31,
            rejected: 8,
            withdrawn: 7
          }
        },
        loans: {
          total: 42,
          volume: 12750000,
          avgAmount: 303571,
          change: 8.3
        },
        revenue: {
          total: 625000,
          change: 5.2
        },
        conversion: {
          rate: 48.3,
          change: -2.1
        }
      },
      pipelineData: [
        { stage: 'Application Submitted', count: 23, amount: 6900000 },
        { stage: 'Document Verification', count: 14, amount: 4200000 },
        { stage: 'Processing', count: 9, amount: 2700000 },
        { stage: 'Underwriting', count: 11, amount: 3300000 },
        { stage: 'Approved', count: 18, amount: 5400000 },
        { stage: 'Closing', count: 12, amount: 3600000 }
      ],
      trendData: {
        applications: [42, 38, 45, 50, 55, 60, 58, 62, 65, 70, 75, 87],
        approvals: [22, 20, 25, 28, 32, 30, 34, 36, 38, 42, 40, 42],
        volumes: [6.5, 6.2, 7.1, 7.8, 8.5, 8.0, 9.2, 10.1, 10.5, 11.2, 11.8, 12.75]
      },
      loanTypeDistribution: [
        { type: 'Conventional', percentage: 45, count: 19 },
        { type: 'FHA', percentage: 22, count: 9 },
        { type: 'VA', percentage: 15, count: 6 },
        { type: 'USDA', percentage: 8, count: 3 },
        { type: 'Jumbo', percentage: 10, count: 5 }
      ],
      topPerformers: [
        { id: 1, name: 'Sarah Johnson', applications: 15, closedLoans: 8, volume: 2400000 },
        { id: 2, name: 'Michael Chen', applications: 12, closedLoans: 7, volume: 2100000 },
        { id: 3, name: 'Jessica Williams', applications: 10, closedLoans: 6, volume: 1800000 },
        { id: 4, name: 'David Rodriguez', applications: 9, closedLoans: 5, volume: 1500000 },
        { id: 5, name: 'Amanda Lee', applications: 8, closedLoans: 4, volume: 1200000 }
      ]
    };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Time Range Selector */}
          <div className="mt-4 mb-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  Comprehensive analytics for loan performance and application metrics.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <div className="inline-flex shadow-sm rounded-md">
                  <select
                    id="timeframe"
                    name="timeframe"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            // Loading state
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            // Dashboard Content
            <div className="space-y-6">
              {/* Summary Stats Section */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Applications Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Applications</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {dashboardData.summary.applications.total}
                            </div>
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              dashboardData.summary.applications.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dashboardData.summary.applications.change >= 0 ? (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="sr-only">{dashboardData.summary.applications.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                              {Math.abs(dashboardData.summary.applications.change)}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loans Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Loans</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {dashboardData.summary.loans.total}
                            </div>
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              dashboardData.summary.loans.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dashboardData.summary.loans.change >= 0 ? (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="sr-only">{dashboardData.summary.loans.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                              {Math.abs(dashboardData.summary.loans.change)}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm text-right">
                      <div className="font-medium text-gray-700">
                        {formatCurrency(dashboardData.summary.loans.volume)} total volume
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Conversion Rate Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {dashboardData.summary.conversion.rate}%
                            </div>
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              dashboardData.summary.conversion.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dashboardData.summary.conversion.change >= 0 ? (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="sr-only">{dashboardData.summary.conversion.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                              {Math.abs(dashboardData.summary.conversion.change)}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {formatCurrency(dashboardData.summary.revenue.total)}
                            </div>
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              dashboardData.summary.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dashboardData.summary.revenue.change >= 0 ? (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="sr-only">{dashboardData.summary.revenue.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                              {Math.abs(dashboardData.summary.revenue.change)}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LenderAnalytics;
