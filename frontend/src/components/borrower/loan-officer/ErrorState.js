import React from 'react';

/**
 * Component for displaying error state when loan officer details cannot be loaded
 * Shows error message with guidance for users
 */
const ErrorState = ({ error }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
      <div className="text-red-700 font-medium">{error}</div>
      <div className="text-sm text-gray-600 mt-1">If this seems wrong, please contact support or your lender.</div>
    </div>
  );
};

export default ErrorState;
