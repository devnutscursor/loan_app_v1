import React from 'react';
import { Edit } from 'lucide-react';
import { formatCurrency } from '../utils/LoanCalculationUtils';

/**
 * Component that displays income, debts, and assets summary cards
 */
const FinancialSummaryCards = ({ income, debts, assets }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Income</h4>
          <button className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xl font-semibold">{formatCurrency(income)} /Month</div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Debts</h4>
          <button className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xl font-semibold">{formatCurrency(debts)} /Month</div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Assets</h4>
          <button className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xl font-semibold">{formatCurrency(assets)}</div>
      </div>
    </div>
  );
};

export default FinancialSummaryCards;
