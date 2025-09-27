import React from 'react';
import { CreditCard, Search, Plus, X } from 'lucide-react';

const LoansEmptyState = ({ 
  type, 
  borrowerId, 
  onNewLoan, 
  onClearFilters 
}) => {
  if (type === 'no-loans') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No active loans</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          {borrowerId
            ? "This borrower doesn't have any active loans. You can create a new loan application for them."
            : 'Get started by creating a new loan application for your borrowers.'}
        </p>
        <div className="mt-6">
          <button
            onClick={onNewLoan}
            className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
            Create Loan Application
          </button>
        </div>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
          <Search className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
        <p className="mt-2 text-sm text-gray-500">
          No loans match your search criteria. Try adjusting your search or filters.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="h-5 w-5 mr-2" aria-hidden="true" />
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LoansEmptyState;
