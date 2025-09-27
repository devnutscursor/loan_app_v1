import React from 'react';

const ReportDetails = ({ loading, creditReport }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creditReport) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Report ID</p>
          <p className="font-medium">{creditReport.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">File Size</p>
          <p className="font-medium">{creditReport.reportFile?.fileSize ? `${(creditReport.reportFile.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
