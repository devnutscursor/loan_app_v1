import React, { useState, useEffect } from 'react';
import PropertyOwned from './PropertyOwned';
import MilitaryService from './MilitaryService';
import theme from "../../../styles/theme";

/**
 * AdditionalStep Component
 * 
 * Parent component to manage Property Owned and Military Service sections
 * with tab navigation for the additional information step of the loan application
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - The entire form data
 * @param {Function} props.handleChange - Function to handle form changes
 * @param {Function} props.validateStep - Function to validate step
 * @param {Function} props.nextStep - Function to advance to the next step
 * @param {Function} props.prevStep - Function to go back to the previous step
 * @param {Object} props.errors - Validation errors
 * @returns {JSX.Element} Additional step with tab navigation
 */
const AdditionalStep = ({ formData, handleChange, validateStep, nextStep, prevStep, errors = {} }) => {
  const [activeTab, setActiveTab] = useState('propertiesOwned');

  useEffect(() => {
    console.log('formData from AdditionalStep is ', formData);
  }, [formData]);

  // Function to handle changes to the property owned section
  const handlePropertyOwnedChange = (event) => {
    // Handle both direct value and event object
    if (event && event.target) {
      // Event object from PropertyOwned component
      handleChange(event.target.name, event.target.value);
    } else {
      // Direct value (fallback)
      handleChange('propertiesOwned', event);
    }
  };

  // Function to handle changes to the military service section
  const handleMilitaryServiceChange = (militaryService) => {
    handleChange('militaryService', militaryService);
  };

  // Validate the current tab
  const validateTab = (tab) => {
    // validateStep returns a boolean (true if valid, false if invalid)
    return validateStep(4, tab);
  };

  // Get tab completion status for showing completion icons
  const getTabIcon = (tabName) => {
    // Determine if tab is complete based on required fields
    let isComplete = false;
    
    if (tabName === 'propertiesOwned') {
      // Consider the tab complete if they've answered the ownership question
      isComplete = formData.propertiesOwned && (formData.propertiesOwned.ownsProperty !== undefined);
    } else if (tabName === 'militaryService') {
      // Consider the tab complete if they've answered the service question
      isComplete = formData.militaryService && (formData.militaryService.hasServed !== undefined);
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
    // Only validate if moving away from a tab, not when first entering
    if (activeTab !== tab) {
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
      case 'propertiesOwned':
        return (
          <PropertyOwned
            propertiesOwned={formData.propertiesOwned || {}}
            onChange={handlePropertyOwnedChange}
            errors={errors}
            userType="borrower"
          />
        );
      case 'militaryService':
        return (
          <MilitaryService
            militaryService={formData.militaryService || {}}
            onChange={handleMilitaryServiceChange}
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
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <button
          type="button"
          className={getTabClass('propertiesOwned')}
          style={
            activeTab === "propertiesOwned"
              ? { background: theme.gradients.primary }
              : {}
          }
          onClick={() => handleTabChange('propertiesOwned')}
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Property Owned</span>
            {getTabIcon('propertiesOwned') && <span className="ml-2">{getTabIcon('propertiesOwned')}</span>}
          </div>
        </button>
        <button
          type="button"
          className={getTabClass('militaryService')}
          onClick={() => handleTabChange('militaryService')}
          style={
            activeTab === "militaryService"
              ? { background: theme.gradients.primary }
              : {}
          }
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Military Service</span>
            {getTabIcon('militaryService') && <span className="ml-2">{getTabIcon('militaryService')}</span>}
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        {activeTab === 'propertiesOwned' ? (
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={prevStep}
          >
            Previous Step
          </button>
        ) : (
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              if (activeTab === 'militaryService') {
                setActiveTab('propertiesOwned');
              }
            }}
          >
            Previous Section
          </button>
        )}
        
        {activeTab === 'propertiesOwned' ? (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              const errors = validateTab('propertiesOwned');
              if (Object.keys(errors).length === 0) {
                setActiveTab('militaryService');
              } else {
                const errorMessages = Object.values(errors);
                const errorList = errorMessages.slice(0, 2).join('\n• ');
                const additionalCount = errorMessages.length > 2 ? `\n\n...and ${errorMessages.length - 2} more fields required` : '';
                alert(`Please fix the following errors:\n\n• ${errorList}${additionalCount}`);
              }
            }}
          >
            Next Section
          </button>
        ) : (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              if (validateTab('militaryService')) {
                nextStep(); // Call the parent's nextStep function
              } else {
                alert('Please complete all required fields before proceeding');
              }
            }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

export default AdditionalStep;
