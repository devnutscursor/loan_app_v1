import React from 'react';
import { formatCurrency } from './LoanQualificationUtils';

/**
 * Payment Info Section component - displays payment details
 */
const PaymentInfoSection = ({ monthlyPayment, downPayment }) => {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-gray-500 text-sm">Monthly Payment</div>
        <div className="font-medium">{formatCurrency(monthlyPayment)}</div>
      </div>
      <div>
        <div className="text-gray-500 text-sm">Down Payment</div>
        <div className="font-medium">{formatCurrency(downPayment)}</div>
      </div>
    </div>
  );
};

export default PaymentInfoSection;
