import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

/**
 * Debts Form Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.debts - Array of debt objects
 * @param {Array} props.expenses - Array of expense objects
 * @param {Function} props.onChange - Function to handle changes to debts and expenses
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Debts form component
 */
const Debts = ({ debts = [], expenses = [], onChange, borrower = {}, errors = {} }) => {
  // Local state for immediate UI updates
  const [localDebts, setLocalDebts] = useState(debts);
  const [localExpenses, setLocalExpenses] = useState(expenses);

  // Update local state when props change
  useEffect(() => {
    setLocalDebts(debts);
  }, [debts]);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  // Get borrower's first name for display
  const getBorrowerFirstName = () => {
    return borrower.firstName || 'the borrower';
  };

  // Add a new debt
  const addDebt = () => {
    const newDebt = {
      id: `debt-${Date.now()}`,
      creditor: '',
      monthlyPayment: '',
      balance: '',
      paidAtClosing: false
    };
    // Update local state for immediate feedback
    setLocalDebts([...localDebts, newDebt]);
    // Update parent component - use original debts as base
    onChange('debts', [...debts, newDebt]);
  };

  // Handle change for a specific debt field
  const handleDebtChange = (id, field, value) => {
    // Update local state for immediate feedback
    const updatedLocalDebts = localDebts.map(debt => {
      if (debt.id === id) {
        return { ...debt, [field]: value };
      }
      return debt;
    });
    setLocalDebts(updatedLocalDebts);

    // Update parent component - use original debts as base
    const updatedDebts = debts.map(debt => {
      if (debt.id === id) {
        return { ...debt, [field]: value };
      }
      return debt;
    });
    onChange('debts', updatedDebts);
  };

  // Remove a debt
  const removeDebt = (id) => {
    // Update local state for immediate feedback
    const updatedLocalDebts = localDebts.filter(debt => debt.id !== id);
    setLocalDebts(updatedLocalDebts);

    // Update parent component - use original debts as base
    const updatedDebts = debts.filter(debt => debt.id !== id);
    onChange('debts', updatedDebts);
  };

  // Add a new expense
  const addExpense = () => {
    const newExpense = {
      id: `expense-${Date.now()}`,
      type: '',
      amount: ''
    };
    // Update local state for immediate feedback
    setLocalExpenses([...localExpenses, newExpense]);
    // Update parent component - use original expenses as base
    onChange('expenses', [...expenses, newExpense]);
  };

  // Handle change for a specific expense field
  const handleExpenseChange = (id, field, value) => {
    // Map 'type' field to 'expenseType' for database compatibility
    const dbField = field === 'type' ? 'expenseType' : field;
    
    // Update local state for immediate feedback
    const updatedLocalExpenses = localExpenses.map(expense => {
      if (expense.id === id) {
        return { ...expense, [dbField]: value };
      }
      return expense;
    });
    setLocalExpenses(updatedLocalExpenses);

    // Update parent component - use original expenses as base
    const updatedExpenses = expenses.map(expense => {
      if (expense.id === id) {
        return { ...expense, [dbField]: value };
      }
      return expense;
    });
    onChange('expenses', updatedExpenses);
  };

  // Remove an expense
  const removeExpense = (id) => {
    // Update local state for immediate feedback
    const updatedLocalExpenses = localExpenses.filter(expense => expense.id !== id);
    setLocalExpenses(updatedLocalExpenses);

    // Update parent component - use original expenses as base
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    onChange('expenses', updatedExpenses);
  };

  // Format currency input (remove non-numeric characters)
  const formatCurrency = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^0-9.]/g, '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Help us learn a little bit more about your debts.</h2>
        <p className="text-gray-600 mb-4">
          Keep in mind, we will need to pull credit regardless, but taking care of this now will help us qualify you more quickly.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Manually Enter Debts */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Manually Enter Debts
        </h3>

        {localDebts.map(debt => (
          <div key={debt.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeDebt(debt.id)}
              className="text-xs absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this debt"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Name of Creditor/Debt
                </label>
                <input
                  type="text"
                  value={debt.creditor || ''}
                  onChange={(e) => handleDebtChange(debt.id, 'creditor', e.target.value)}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
                  placeholder="Creditor Name"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Monthly Payment
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={debt.monthlyPayment || ''}
                    onChange={(e) => handleDebtChange(debt.id, 'monthlyPayment', formatCurrency(e.target.value))}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Unpaid Balance
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs">$</span>
                  </div>
                  <input
                    type="text"
                    value={debt.balance || ''}
                    onChange={(e) => handleDebtChange(debt.id, 'balance', formatCurrency(e.target.value))}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <span className="mr-2">Paid off by closing?</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={debt.paidAtClosing || false}
                      onChange={(e) => handleDebtChange(debt.id, 'paidAtClosing', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                      htmlFor="toggle"
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${debt.paidAtClosing ? 'bg-blue-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                  <span className={`text-sm ${debt.paidAtClosing ? 'text-blue-500' : 'text-gray-400'}`}>
                    {debt.paidAtClosing ? 'Yes' : 'No'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addDebt}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.5rem',  // Reduced padding
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.25rem',  // Slightly smaller border radius
            fontSize: '0.75rem',  // Smaller font size
            lineHeight: '1rem',  // Tighter line height
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Debt
        </button>
      </div>

      {/* Monthly Expenses */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Monthly Expenses
        </h3>

        {localExpenses.map(expense => (
          <div key={expense.id} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeExpense(expense.id)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this expense"
            >
              <div className="flex items-center">
                <span className="text-xs mr-1">Remove</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Expense Type
                </label>
                <div className="relative">
                  <select
                    value={expense.expenseType || ''}
                    onChange={(e) => handleExpenseChange(expense.id, 'type', e.target.value)}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Type</option>
                    <option value="childSupport">Child Support</option>
                    <option value="alimony">Alimony</option>
                    <option value="separateMaintenance">Separate Maintenance</option>
                    <option value="jobRelated">Job-Related Expenses</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs">$</span>
                  </div>
                  <input
                    type="text"
                    value={expense.amount || ''}
                    onChange={(e) => handleExpenseChange(expense.id, 'amount', formatCurrency(e.target.value))}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExpense}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.5rem',  // Reduced padding
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.25rem',  // Slightly smaller border radius
            fontSize: '0.75rem',  // Smaller font size
            lineHeight: '1rem',  // Tighter line height
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default Debts;
