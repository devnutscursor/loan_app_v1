import React, { useState } from 'react';
import Assets from './Assets';
import Income from './Income';
import Debts from './Debts';
import theme from '../../../styles/theme';

/**
 * Financial Step Component
 * 
 * Parent component to manage Assets, Income, and Debts sections
 * with tab navigation for the financial step of the loan application
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - The entire form data
 * @param {Function} props.handleChange - Function to handle form changes
 * @param {Function} props.validateStep - Function to validate step
 * @param {Function} props.nextStep - Function to advance to the next step
 * @param {Function} props.prevStep - Function to go back to the previous step
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Financial step with tab navigation
 */
const FinancialStep = ({ formData, handleChange, validateStep, nextStep, prevStep, errors = {} }) => {
  const [activeTab, setActiveTab] = useState('assets');

  // Function to handle changes to the assets section
  const handleAssetsChange = (assets) => {
    // Assets should be handled as an object with categories
    handleChange('assets', assets);
  };

  // Function to handle changes to the income section
  const handleIncomeChange = (income) => {
    handleChange('income', income);
  };

  // Function to handle changes to the debts or expenses
  const handleDebtExpenseChange = (field, value) => {
    handleChange(field, value);
  };

  // Validate the current tab
  const validateTab = (tab) => {
    // validateStep returns a boolean (true if valid, false if invalid)
    return validateStep(3, tab);
  };

  // Get tab completion status for showing completion icons
  const getTabIcon = (tabName) => {
    // Determine if tab is complete based on required fields
    let isComplete = false;
    
    if (tabName === 'assets') {
      // Consider assets tab complete if we have at least one asset in any category
      isComplete = formData.assets && (
        (formData.assets.checkingAndSavings && formData.assets.checkingAndSavings.length > 0) ||
        (formData.assets.stocksAndBonds && formData.assets.stocksAndBonds.length > 0) ||
        (formData.assets.giftsAndGrants && formData.assets.giftsAndGrants.length > 0) ||
        formData.assets.miscellaneous
      );
    } else if (tabName === 'income') {
      // Consider income tab complete if base income exists
      isComplete = formData.income && formData.income.baseIncome;
    } else if (tabName === 'debts') {
      // Consider debts tab complete if some debt or expense data exists
      isComplete = (formData.debts && formData.debts.length > 0) || 
                (formData.expenses && formData.expenses.length > 0);
    }
    
    if (isComplete) {
      // Use white color for check icon if tab is active, otherwise primary color
      if (activeTab === tabName) {
        // Keep white for active tab
        return (
          <svg
            className="h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      } else {
        // Use primary color for completed but inactive tabs
        return (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            {/* Define the gradient */}
            <defs>
              <linearGradient
                id="checkIconGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={theme.colors.blue600} />
                <stop offset="100%" stopColor={theme.colors.blue800} />
              </linearGradient>
            </defs>

            {/* Use the gradient in the path */}
            <path
              fillRule="evenodd"
              fill="url(#checkIconGradient)"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
    }
    return null;
  };

  // Tab styling
  const getTabClass = (tabName) => {
    return `px-4 py-2 font-medium text-sm rounded-md ${
      activeTab === tabName
        ? 'bg-blue-500 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  };

  // Function to handle tab change
  const handleTabChange = (tab) => {
    // Only validate the current tab if we're moving away from it, not when first opening a new tab
    if (activeTab !== tab) {
      // Only validate if we're moving away from a tab, not when initially entering
      if (validateTab(activeTab)) {
        setActiveTab(tab);
      }
    } else {
      // If clicking the same tab, just set it (no validation needed)
      setActiveTab(tab);
    }
  };

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'assets':
        return (
          <Assets
            assets={formData.assets || {}}
            onChange={handleAssetsChange}
            borrower={formData.borrowers?.[0] || {}}
            errors={errors}
          />
        );
      case 'income':
        return (
          <Income
            income={formData.income || {}}
            onChange={handleIncomeChange}
            borrower={formData.borrowers?.[0] || {}}
            errors={errors}
          />
        );
      case 'debts':
        return (
          <Debts
            debts={formData.debts || []}
            expenses={formData.expenses || []}
            onChange={handleDebtExpenseChange}
            borrower={formData.borrowers?.[0] || {}}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 space-x-2 mb-6">
        <button
          type="button"
          className={getTabClass('assets')}
          style={activeTab === 'assets' ? { background: theme.gradients.primary } : {}}
          onClick={() => handleTabChange('assets')}
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Assets</span>
            {getTabIcon('assets') && <span className="ml-2">{getTabIcon('assets')}</span>}
          </div>
        </button>
        <button
          type="button"
          className={getTabClass('income')}
          style={activeTab === 'income' ? { background: theme.gradients.primary } : {}}
          onClick={() => handleTabChange('income')}
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Income</span>
            {getTabIcon('income') && <span className="ml-2">{getTabIcon('income')}</span>}
          </div>
        </button>
        <button
          type="button"
          className={getTabClass('debts')}
          style={activeTab === 'debts' ? { background: theme.gradients.primary } : {}}
          onClick={() => handleTabChange('debts')}
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Debts & Expenses</span>
            {getTabIcon('debts') && <span className="ml-2">{getTabIcon('debts')}</span>}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        {activeTab === 'assets' ? (
          <button 
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 mr-3"
            style={{ '--focus-ring-color': theme.colors.primary }}
            onClick={prevStep}
          >
            Previous Step
          </button>
        ) : (
          <button 
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 mr-3"
            style={{ '--focus-ring-color': theme.colors.primary }}
            onClick={() => {
              if (activeTab === 'income') {
                setActiveTab('assets');
              } else if (activeTab === 'debts') {
                setActiveTab('income');
              }
            }}
          >
            Previous Section
          </button>
        )}
        
        {activeTab === 'assets' ? (
          <button 
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90"
            style={{ background: theme.gradients.primary, '--focus-ring-color': theme.colors.primary }}
            onClick={() => {
              if (validateTab('assets')) {
                setActiveTab('income');
              } else {
                alert('Please complete all required fields before proceeding');
              }
            }}
          >
            Next Section
          </button>
        ) : activeTab === 'income' ? (
          <button 
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90"
            style={{ background: theme.gradients.primary, '--focus-ring-color': theme.colors.primary }}
            onClick={() => {
              const errors = validateTab('income');
              if (Object.keys(errors).length === 0) {
                setActiveTab('debts');
              } else {
                alert(`Please complete all required fields before proceeding: ${Object.values(errors).join(', ')}`);
              }
            }}
          >
            Next Section
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => validateTab(activeTab) && nextStep()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90"
            style={{ background: theme.gradients.primary, '--focus-ring-color': theme.colors.primary }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

export default FinancialStep;
