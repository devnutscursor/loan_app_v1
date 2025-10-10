import React from 'react';
import { RefreshCw, Eye, FileText, ArrowUpCircle } from 'lucide-react';

const CreditReportActions = ({ 
  loading, 
  reportStatus, 
  fileLoading, 
  onRefreshReport,
  onUpgradeReport, 
  onViewReport, 
  onCreateReport 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
      
      {reportStatus?.hasActiveReport ? (
        <div className="space-y-4">
          {/* View Report Button - Only shown when completed */}
          {reportStatus.status === 'Completed' && (
            <button
              onClick={onViewReport}
              disabled={fileLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-black border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className={`h-4 w-4 ${fileLoading ? 'animate-pulse' : ''}`} />
              {fileLoading ? 'Loading...' : 'View Credit Report'}
            </button>
          )}
          
          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onCreateReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
              Re-Order Credit Report
            </button>
            
            <button
              onClick={onRefreshReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-black border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Credit Report
            </button>
            
            <button
              onClick={onUpgradeReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-black border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowUpCircle className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
              Upgrade Credit Report
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onCreateReport}
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Create Credit Report
        </button>
      )}
    </div>
  );
};

export default CreditReportActions;
