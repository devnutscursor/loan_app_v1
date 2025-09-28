import React from 'react';

/**
 * Component displayed when the borrower has no loans
 * Shows an empty state with a call-to-action to start a new application
 */
const NoLoansState = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No loans found</h3>
      <p className="mt-1 text-sm text-gray-500">
        You don't have any active loan applications yet.
      </p>
      <div className="mt-6">
        <a
          href="/borrower/apply"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Start New Application
        </a>
      </div>
    </div>
  );
};

export default NoLoansState;
