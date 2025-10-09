import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import theme from '../../../styles/theme';
import RequiredFieldIndicator from '@/components/common/RequiredFieldIndicator';

/**
 * Income Form Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.income - Income information
 * @param {Function} props.onChange - Function to handle changes to income
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @param {String} props.userType - Type of user (borrower or lender)
 * @returns {JSX.Element} Income form component
 */
const Income = ({ income = {}, onChange, borrower = {}, errors = {}, userType = 'borrower' }) => {
  // Local state for immediate UI updates
  const [localIncome, setLocalIncome] = useState(income);

  // Update local state when props change
  useEffect(() => {
    setLocalIncome(income);
  }, [income]);
  // Get borrower's first name for display
  const getBorrowerFirstName = () => {
    return borrower.firstName || 'the borrower';
  };

  // Handle change for a specific income field
  const handleIncomeChange = (field, value) => {
    // Update local state for immediate feedback
    setLocalIncome({
      ...localIncome,
      [field]: value
    });

    // Update parent component - use original income prop as base
    onChange({
      ...income,
      [field]: value
    });
  };

  // Add other income source
  const addOtherIncome = () => {
    // Create the new income item
    const newItem = {
      id: `income-${Date.now()}`,
      type: '',
      amount: ''
    };

    // Update local state for immediate feedback
    const localOtherIncome = [...(localIncome.otherIncome || [])];
    localOtherIncome.push(newItem);
    setLocalIncome({
      ...localIncome,
      otherIncome: localOtherIncome
    });

    // Update parent component - use original income prop as base
    const otherIncome = [...(income.otherIncome || [])];
    otherIncome.push(newItem);
    onChange({
      ...income,
      otherIncome
    });
  };

  // Handle change for an other income item
  const handleOtherIncomeChange = (index, field, value) => {
    // Update local state for immediate feedback
    const localOtherIncome = [...(localIncome.otherIncome || [])];
    
    // Map 'type' field to 'incomeType' for database compatibility
    const dbField = field === 'type' ? 'incomeType' : field;
    
    localOtherIncome[index] = {
      ...localOtherIncome[index],
      [dbField]: value
    };
    
    setLocalIncome({
      ...localIncome,
      otherIncome: localOtherIncome
    });

    // Update parent component - use original income prop as base
    const otherIncome = [...(income.otherIncome || [])];
    
    otherIncome[index] = {
      ...otherIncome[index],
      [dbField]: value
    };
    
    onChange({
      ...income,
      otherIncome
    });
  };

  // Remove an other income item
  const removeOtherIncome = (index) => {
    // Update local state for immediate feedback
    const localOtherIncome = [...(localIncome.otherIncome || [])];
    localOtherIncome.splice(index, 1);
    setLocalIncome({
      ...localIncome,
      otherIncome: localOtherIncome
    });

    // Update parent component - use original income prop as base
    const otherIncome = [...(income.otherIncome || [])];
    otherIncome.splice(index, 1);
    onChange({
      ...income,
      otherIncome
    });
  };

  // Format currency input (remove non-numeric characters)
  const formatCurrency = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^0-9.]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Monthly Income Section */}
      <div>
        <h3 className="text-base font-medium text-gray-900 mb-3">Income (Monthly)</h3>
        {userType === 'borrower' && (
          <p className="text-sm text-gray-500 mb-4">
            Let's collect some information about your income.
            How much does {getBorrowerFirstName()} make at their job?
          </p>
        )}
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Primary Income */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Income (Monthly)
        </h3>

        <div className="mb-4">
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
            Base Income
            <RequiredFieldIndicator />
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              value={localIncome.baseIncome || ''}
              onChange={(e) => handleIncomeChange('baseIncome', formatCurrency(e.target.value))}
              className={`text-xs pl-7 w-full border ${errors['income.baseIncome'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
              placeholder="0.00"
            />
          </div>
          {errors['income.baseIncome'] && (
            <p className="text-red-500 text-xs mt-1">{errors['income.baseIncome']}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Overtime
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                value={localIncome.overtime || ''}
                onChange={(e) => handleIncomeChange('overtime', formatCurrency(e.target.value))}
                className={`text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Commissions
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                value={localIncome.commissions || ''}
                onChange={(e) => handleIncomeChange('commissions', formatCurrency(e.target.value))}
                className={`text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Bonuses
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                value={localIncome.bonuses || ''}
                onChange={(e) => handleIncomeChange('bonuses', formatCurrency(e.target.value))}
                className={`text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Military Entitlements
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                value={income.militaryEntitlements || ''}
                onChange={(e) => handleIncomeChange('militaryEntitlements', formatCurrency(e.target.value))}
                className={`text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Other Income */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
          Other Income (Monthly)
        </h3>

        {(localIncome.otherIncome || []).map((item, index) => (
          <div key={item.id || index} className="mb-6 border border-gray-200 rounded-md p-4 relative">
            <button
              type="button"
              onClick={() => removeOtherIncome(index)}
              className="text-xs absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Remove this income"
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
                  Income Type
                </label>
                <div className="relative">
                  <select
                    value={item.incomeType || ''}
                    onChange={(e) => handleOtherIncomeChange(index, 'type', e.target.value)}
                    className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Type</option>
                    <option value="alimony">Alimony</option>
                    <option value="childSupport">Child Support</option>
                    <option value="disability">Disability</option>
                    <option value="rental">Rental Income</option>
                    <option value="retirement">Retirement/Pension</option>
                    <option value="socialSecurity">Social Security</option>
                    <option value="unemployment">Unemployment</option>
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
                  Monthly Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    value={item.amount || ''}
                    onChange={(e) => handleOtherIncomeChange(index, 'amount', formatCurrency(e.target.value))}
                    className={`text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
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
          onClick={addOtherIncome}
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
          className="text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Other Income
        </button>
      </div>
    </div>
  );
};

export default Income;
