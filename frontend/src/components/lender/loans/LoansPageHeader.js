import React from 'react';
import { Plus } from 'lucide-react';

const LoansPageHeader = ({ 
  borrowerId, 
  user, 
  onNewLoan 
}) => {
  return (
    <div className="mb-8 flex justify-between items-start sm:items-center flex-col sm:flex-row">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {borrowerId ? 'Borrower Loans' : 'Active Loans'}
        </h1>
        <p className="mt-2 text-gray-600">
          {borrowerId
            ? "Manage this borrower's loan applications"
            : 'List of active loan applications from all your borrowers'}
        </p>
      </div>
      {user?.role === 'lender' && (
        <div className="flex space-x-2 sm:mt-0 mt-3">
          <button
            onClick={onNewLoan}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Loan
          </button>
        </div>
      )}
    </div>
  );
};

export default LoansPageHeader;
