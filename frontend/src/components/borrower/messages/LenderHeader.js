import React from 'react';

/**
 * Component displaying lender information in the messages header
 * Shows lender's name, title, and avatar
 */
const LenderHeader = ({ lender }) => {
  if (!lender) return null;

  return (
    <div className="border-b p-4 flex items-center">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
        {lender.user?.firstName?.[0] || 'L'}
      </div>
      <div className="ml-3">
        <p className="font-medium text-gray-900">
          {lender.user?.firstName} {lender.user?.lastName}
        </p>
        <p className="text-sm text-gray-500">{lender.title || 'Loan Officer'}</p>
      </div>
    </div>
  );
};

export default LenderHeader;
