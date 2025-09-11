import React from 'react';
import { ArrowRightCircle } from 'lucide-react';

// Borrower item component (reused from lender dashboard)
const BorrowerItem = ({ borrower, borrowerLoans }) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <span className="text-sm font-medium">
            {borrower.user?.firstName?.charAt(0)}{borrower.user?.lastName?.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {borrower.user?.firstName} {borrower.user?.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{borrower.user?.email}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
          {borrowerLoans[borrower._id] || 0} loans
        </span>
        <ArrowRightCircle className="ml-2 h-4 w-4 text-gray-500" />
      </div>
    </div>
  );
};

export default BorrowerItem;
