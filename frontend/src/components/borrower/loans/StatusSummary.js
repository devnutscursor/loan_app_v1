import React from 'react';

const StatusSummary = ({ 
  filter, 
  loansList, 
  statusGroups, 
  loading 
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-blue-800">
          Loan Status Summary
        </h3>
        {loading ? (
          <span className="text-xs text-blue-600">Loading...</span>
        ) : (
          <span className="text-xs text-blue-600">
            {filter === "all" ? `Showing all ${loansList.length} loans` : `Showing ${loansList.length} ${filter} loans`}
          </span>
        )}
      </div>
      <p className="text-xs text-blue-700">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mr-2">
          Total: {loansList.length}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 mr-2 ">
          Processing: {statusGroups.processing.length}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 mr-2">
          Approved: {statusGroups.approved.length}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 mr-2">
          Rejected: {statusGroups.rejected.length}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 mr-2">
          Closed: {statusGroups.closed.length}
        </span>
      </p>
    </div>
  );
};

export default StatusSummary;
