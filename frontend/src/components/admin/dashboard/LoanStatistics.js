import React from "react";

const LoanStatistics = ({ loanStats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Statistics</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Total Applications</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{loanStats.totalApplications}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-green-600 text-center sm:text-start">{loanStats.approved}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600 text-center sm:text-start">{loanStats.pending}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Rejected</p>
            <p className="mt-1 text-2xl font-semibold text-red-600 text-center sm:text-start">{loanStats.rejected}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Total Loan Volume</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{formatCurrency(loanStats.totalVolume)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Average Loan Amount</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{formatCurrency(loanStats.averageAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanStatistics;