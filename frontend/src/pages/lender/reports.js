import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import AnalyticsService from '../../services/analytics.service';
import LenderLayout from '../../components/layouts/LenderLayout';
import ReportSummary from '../../components/analytics/ReportSummary';
import LoanPipelineChart from '../../components/analytics/LoanPipelineChart';
import LoanDistributionChart from '../../components/analytics/LoanDistributionChart';
import PerformanceTrendChart from '../../components/analytics/PerformanceTrendChart';
import { useAuth } from '../../contexts/AuthContext';


// Time period options for filtering data
const TIME_PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' }
];

/**
 * Reports and Analytics Dashboard for Lenders
 * 
 * Provides comprehensive analytics and reporting capabilities including:
 * - Summary metrics (applications, loans, conversion rates, revenue)
 * - Loan pipeline visualization
 * - Loan type distribution
 * - Performance trends over time
 * - Filtering by time period
 */
const Reports = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [summaryData, setSummaryData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch data based on selected timeframe
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get summary metrics
        const summaryResponse = await AnalyticsService.getSummaryMetrics(timeframe);
        if (summaryResponse.success) {
          setSummaryData(summaryResponse.data);
        } else {
          toast.error('Failed to load summary metrics');
        }

        // Get pipeline data
        const pipelineResponse = await AnalyticsService.getPipelineData(timeframe);
        if (pipelineResponse.success) {
          setPipelineData(pipelineResponse.data);
        } else {
          toast.error('Failed to load pipeline data');
        }

        // Get loan distribution data
        const distributionResponse = await AnalyticsService.getDistributionData(timeframe);
        if (distributionResponse.success) {
          setDistributionData(distributionResponse.data);
        } else {
          toast.error('Failed to load distribution data');
        }

        // Get performance trend data
        const performanceResponse = await AnalyticsService.getPerformanceTrends(timeframe);
        if (performanceResponse.success) {
          setPerformanceData(performanceResponse.data);
        } else {
          toast.error('Failed to load performance data');
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, timeframe]);

  // Handle exporting reports to CSV
  const handleExportReport = async (reportType) => {
    setExportLoading(true);
    try {
      const result = await AnalyticsService.exportReport(reportType, timeframe);
      
      if (result.success) {
        toast.success(`${reportType} report exported successfully`);
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // Fallback for mock data during development or API unavailability
  const getMockData = () => {
    // Mock summary data
    const mockSummary = {
      applications: { total: 125, change: 8.2 },
      loans: { total: 78, volume: 15750000, change: 5.6 },
      conversion: { rate: 62, change: -2.1 },
      revenue: { total: 387500, change: 12.4 }
    };
    
    // Mock pipeline data
    const mockPipeline = [
      { stage: 'Initial Application', count: 45, amount: 9800000 },
      { stage: 'Document Review', count: 32, amount: 7500000 },
      { stage: 'Underwriting', count: 24, amount: 5600000 },
      { stage: 'Approval', count: 18, amount: 4200000 },
      { stage: 'Closing', count: 6, amount: 1500000 }
    ];
    
    // Mock distribution data
    const mockDistribution = [
      { type: 'Conventional', percentage: 42, count: 33 },
      { type: 'FHA', percentage: 28, count: 22 },
      { type: 'VA', percentage: 15, count: 12 },
      { type: 'USDA', percentage: 10, count: 8 },
      { type: 'Jumbo', percentage: 5, count: 3 }
    ];
    
    // Mock performance data
    const mockPerformance = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      applications: [28, 32, 36, 29],
      approvals: [15, 18, 24, 21],
      volumes: [3.2, 3.8, 4.5, 4.2]
    };
    
    return { mockSummary, mockPipeline, mockDistribution, mockPerformance };
  };

  // Use mock data if real data is not available
  const { mockSummary, mockPipeline, mockDistribution, mockPerformance } = getMockData();
  const displaySummary = summaryData || mockSummary;
  const displayPipeline = pipelineData || mockPipeline;
  const displayDistribution = distributionData || mockDistribution;
  const displayPerformance = performanceData || mockPerformance;

  return (
    <LenderLayout>
      <Head>
        <title>Analytics & Reports | Loan Management System</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reports</h1>
            <div className="flex space-x-3">
              {/* Time period filter */}
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={loading}
              >
                {TIME_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>

              {/* Export report button */}
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  id="export-options"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                  <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div
                  id="export-dropdown"
                  className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="export-options"
                >
                  <div className="py-1" role="none">
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => handleExportReport('summary')}
                    >
                      Summary Report
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => handleExportReport('pipeline')}
                    >
                      Pipeline Report
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => handleExportReport('distribution')}
                    >
                      Loan Distribution Report
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => handleExportReport('performance')}
                    >
                      Performance Report
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => handleExportReport('all')}
                    >
                      Full Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Show loading state */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary metrics */}
              <div className="mt-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Summary Metrics</h2>
                <ReportSummary summaryData={displaySummary} />
              </div>

              {/* Charts section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Loan pipeline chart */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Loan Pipeline</h2>
                  <LoanPipelineChart pipelineData={displayPipeline} timeframe={timeframe} />
                </div>

                {/* Loan distribution chart */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Loan Distribution</h2>
                  <LoanDistributionChart distributionData={displayDistribution} />
                </div>
              </div>

              {/* Performance trend chart - full width */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Performance Trends</h2>
                <PerformanceTrendChart trendData={displayPerformance} timeframe={timeframe} />
              </div>

              {/* Report explanation section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Report Insights</h2>
                <div className="prose max-w-none">
                  <p>
                    This dashboard provides analytics on your loan portfolio performance across different dimensions. 
                    Use the time period selector to adjust the analysis window, and the export functionality to share 
                    reports with your team or include in presentations.
                  </p>
                  <h3>Key Insights</h3>
                  <ul>
                    <li>
                      <strong>Application to Approval Ratio:</strong> {displaySummary.conversion.rate}% of applications are being approved, 
                      which is {displaySummary.conversion.change >= 0 ? 'up' : 'down'} {Math.abs(displaySummary.conversion.change)}% from the previous period.
                    </li>
                    <li>
                      <strong>Loan Portfolio:</strong> Currently managing {displaySummary.loans.total} active loans with a total volume of {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(displaySummary.loans.volume)}.
                    </li>
                    <li>
                      <strong>Pipeline Health:</strong> {displayPipeline[0].count} new applications are currently in the pipeline, 
                      with {displayPipeline[displayPipeline.length - 1].count} approaching closing.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LenderLayout>
  );
};

export default Reports;
