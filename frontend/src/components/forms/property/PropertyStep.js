import React, { useState } from 'react';
import PropertyInformation from './PropertyInformation';
import LoanDetails from './LoanDetails';

/**
 * PropertyStep Component
 * Manages the two sub-sections of the Property & Loan Details step with tab navigation
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - The entire form data object
 * @param {Function} props.handleChange - Function to handle form field changes
 * @param {Function} props.nextStep - Function to advance to the next step
 * @param {Function} props.prevStep - Function to go back to the previous step 
 * @param {Object} props.errors - Form validation errors
 * @returns {JSX.Element} PropertyStep component with tabs for navigation
 */
const PropertyStep = ({ formData, handleChange, nextStep, prevStep, loanTypes = [], errors = {} }) => {
  const [activeTab, setActiveTab] = useState('propertyInformation');
  const { propertyInfo, loanInfo } = formData;

  // Handle form field changes - pass through to parent component
  const handleFieldChange = (e) => {
    // Pass the event directly to the parent's handler
    handleChange(e);
  };

  // Tab styling
  const getTabClass = (tabName) => {
    return `px-4 py-2 font-medium text-sm rounded-md ${
      activeTab === tabName
        ? 'bg-blue-500 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  };

  // Tab check icon
  const getTabIcon = (tabName) => {
    // Determine if tab is complete based on required fields
    let isComplete = false;
    
    if (tabName === 'propertyInformation') {
      isComplete = propertyInfo && 
                 propertyInfo.propertyType && 
                 propertyInfo.homePurpose;
    } else if (tabName === 'loanDetails') {
      isComplete = loanInfo && 
                 loanInfo.loanType && 
                 (loanInfo.loanAmount || (loanInfo.loanType === 'refinance' && loanInfo.requestedLoanAmount));
    }
    
    if (isComplete) {
      // Use white color for check icon if tab is active, otherwise green
      const iconColorClass = activeTab === tabName ? 'text-white' : 'text-green-500';
      
      return (
        <svg className={`h-5 w-5 ${iconColorClass}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'propertyInformation':
        return (
          <PropertyInformation
            propertyInfo={propertyInfo || {}}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 'loanDetails':
        return (
          <LoanDetails
            loanInfo={loanInfo || {}}
            onChange={handleFieldChange}
            loanTypes={loanTypes}
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
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          className={getTabClass('propertyInformation')}
          onClick={() => setActiveTab('propertyInformation')}
        >
          <div className="flex items-center">
            <span>Property Information</span>
            {getTabIcon('propertyInformation') && <span className="ml-2">{getTabIcon('propertyInformation')}</span>}
          </div>
        </button>
        
        <button
          type="button"
          className={getTabClass('loanDetails')}
          onClick={() => setActiveTab('loanDetails')}
        >
          <div className="flex items-center">
            <span>Loan Details</span>
            {getTabIcon('loanDetails') && <span className="ml-2">{getTabIcon('loanDetails')}</span>}
          </div>
        </button>
      </div>
      
      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        {activeTab === 'propertyInformation' ? (
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
            onClick={() => setActiveTab('propertyInformation')}
          >
            Previous Section
          </button>
        )}
        
        {activeTab !== 'loanDetails' ? (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // Ensure propertyInfo exists and has required fields before proceeding
              if (!propertyInfo?.propertyType || !propertyInfo?.homePurpose) {
                alert('Please complete all required fields before proceeding');
                return;
              }
              setActiveTab('loanDetails');
            }}
          >
            Next Section
          </button>
        ) : (
          <button
            type="button"
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // Ensure loanInfo exists and has required fields before proceeding to next step
              if (!loanInfo?.loanType || !(loanInfo?.loanAmount || (loanInfo?.loanType === 'refinance' && loanInfo?.requestedLoanAmount))) {
                alert('Please complete all required fields before proceeding');
                return;
              }
              nextStep();
            }}
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyStep;
