import React from 'react';

/**
 * Component for selecting which loan to view milestones for
 * Only shows when there are multiple loans available
 */
const LoanSelector = ({ loans, selectedLoanId, onLoanChange }) => {
  if (loans.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h3 className="text-base font-medium text-gray-900">Select Loan</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a loan to view its progress
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none w-full sm:w-1/3">
          <select
            id="loanId"
            name="loanId"
            value={selectedLoanId}
            onChange={onLoanChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            {loans.map(loan => (
              <option key={loan._id} value={loan._id}>
                {loan.loanDetails?.loanType} - {loan.loanNumber}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LoanSelector;
