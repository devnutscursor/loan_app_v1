import React from 'react';
import { ArrowLeft } from 'lucide-react';

const CreditReportPageHeader = ({ loanId, onBack }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Report</h1>
          <p className="text-gray-600">Loan ID: {loanId}</p>
        </div>
      </div>
    </div>
  );
};

export default CreditReportPageHeader;
