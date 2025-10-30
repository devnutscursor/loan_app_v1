import React from 'react';
import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';

const LoansHeader = ({ 
  filter, 
  onFilterChange, 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          My Loans
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all your loan applications
        </p>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-start flex-wrap gap-3 sm:gap-4">
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            id="filter"
            name="filter"
            value={filter}
            onChange={onFilterChange}
            className="block w-full pl-10 pr-10 py-2 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Loans</option>
            <option value="Application Submitted">Application Submitted</option>
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <Link
          href="/borrower/apply"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all text-sm w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Apply for Loan
        </Link>
      </div>
    </div>
  );
};

export default LoansHeader;
