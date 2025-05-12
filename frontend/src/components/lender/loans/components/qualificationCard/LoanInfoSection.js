import React from 'react';
import { formatCurrency } from './LoanQualificationUtils';

/**
 * Loan Info Section component - displays loan amount and program details
 */
const LoanInfoSection = ({ loanAmount, programName }) => {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-gray-500 text-sm">Loan Amount</div>
        <div className="font-medium">{formatCurrency(loanAmount)}</div>
      </div>
      <div>
        <div className="text-gray-500 text-sm">Loan Program</div>
        <div className="font-medium">{programName || 'Conventional'}</div>
      </div>
    </div>
  );
};

export default LoanInfoSection;
