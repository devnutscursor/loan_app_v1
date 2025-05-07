import React from 'react';
import { formatCurrency } from '../utils/LoanCalculationUtils';

/**
 * Component that displays the payment breakdown and DTI information
 */
const PaymentBreakdown = ({ calculations }) => {
  const { 
    principalAndInterest, 
    taxes, 
    insurance, 
    mortgageInsurance, 
    hoa, 
    monthlyPayment,
    dti,
    isQualified
  } = calculations;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Breakdown</h3>
      <div className="grid grid-cols-5 gap-2 mb-2">
        <div className="text-sm font-medium">P&I: {formatCurrency(principalAndInterest)}</div>
        <div className="text-sm font-medium">Taxes: {formatCurrency(taxes)}</div>
        <div className="text-sm font-medium">Insurance: {formatCurrency(insurance)}</div>
        <div className="text-sm font-medium">MI: {formatCurrency(mortgageInsurance)}</div>
        <div className="text-sm font-medium">HOA: {formatCurrency(hoa)}</div>
      </div>

      {/* Progress bar for DTI visualization */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${isQualified ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(dti, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <div>DTI: {dti.toFixed(2)}%</div>
          <div>Total: {formatCurrency(monthlyPayment)}</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentBreakdown;
