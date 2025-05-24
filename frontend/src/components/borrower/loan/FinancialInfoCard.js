import React from 'react';

/**
 * FinancialInfoCard component displays financial information in a visually appealing card
 * @param {Object} financialData - The financial data object from the loan
 * @param {Function} formatCurrency - Function to format currency values
 */
const FinancialInfoCard = ({ loan, formatCurrency }) => {
  if (!loan) return null;
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Financial Information</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Income, assets, and debt information</p>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Information */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Monthly Income</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Base Income</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.income?.baseIncome || 0)}</span>
              </div>
              
              {loan.income?.overtime > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Overtime</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.income?.overtime || 0)}</span>
                </div>
              )}
              
              {loan.income?.bonuses > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Bonuses</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.income?.bonuses || 0)}</span>
                </div>
              )}
              
              {loan.income?.commissions > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Commissions</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.income?.commissions || 0)}</span>
                </div>
              )}
              
              {loan.income?.militaryEntitlements > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Military Entitlements</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.income?.militaryEntitlements || 0)}</span>
                </div>
              )}
              
              {Array.isArray(loan.income?.otherIncome) && loan.income?.otherIncome.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-2">Other Income Sources</p>
                  {loan.income.otherIncome.map((item, index) => (
                    <div key={index} className="flex justify-between ml-3 text-sm">
                      <span className="font-medium text-gray-500">{item.description || 'Other'}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                <span className="text-sm font-medium text-amber-600">Total Monthly Income</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(loan.financialCalculations?.totalIncome || 0)}</span>
              </div>
            </div>
          </div>
          
          {/* Financial Ratios */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Financial Analysis</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-500">Debt-to-Income Ratio</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {loan.financialCalculations?.dti ? `${loan.financialCalculations.dti}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (loan.financialCalculations?.dti || 0) > 43 ? 'bg-red-500' : 
                      (loan.financialCalculations?.dti || 0) > 36 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((loan.financialCalculations?.dti || 0), 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of income that goes toward paying debts
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-500">Housing Ratio</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {loan.financialCalculations?.housingRatio ? `${loan.financialCalculations.housingRatio}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (loan.financialCalculations?.housingRatio || 0) > 32 ? 'bg-red-500' : 
                      (loan.financialCalculations?.housingRatio || 0) > 28 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((loan.financialCalculations?.housingRatio || 0), 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of income that goes toward housing costs
                </p>
              </div>
              
              <div className="pt-2 mt-1 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-2">Monthly Debts</p>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Monthly Debt</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.financialCalculations?.totalDebts || 0)}</span>
                </div>
              </div>
              
              {Array.isArray(loan.expenses) && loan.expenses.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-2">Monthly Expenses</p>
                  {loan.expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between ml-3 text-sm">
                      <span className="font-medium text-gray-500">{expense.expenseType || 'Expense'}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(expense.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInfoCard;
