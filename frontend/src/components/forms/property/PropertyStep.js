import React, { useState, useEffect } from 'react';
import PropertyInformation from './PropertyInformation';
import LoanDetails from './LoanDetails';
import { toast } from 'react-hot-toast';

import theme from "../../../styles/theme";
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
const PropertyStep = ({ formData, handleChange, nextStep, prevStep, loanTypes = [], errors = {}, userType = 'borrower' }) => {
  const [activeTab, setActiveTab] = useState('propertyInformation');
  const { propertyInfo, loanInfo } = formData;

  useEffect(() => {
    console.log('loanInfo is ', loanInfo);
  }, [loanInfo]);
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
      // Check basic required fields for property info
      const basicFieldsComplete = propertyInfo && 
                propertyInfo.propertyType && 
                propertyInfo.occupancyType;
                
      // Additional validation if they have an accepted offer
      if (propertyInfo.hasAcceptedOffer === true) {
        isComplete = basicFieldsComplete && 
                    propertyInfo.contractPurchasePrice &&
                    propertyInfo.isMixedUse &&
                    propertyInfo.isManufactured &&
                    propertyInfo.numberOfUnits &&
                    propertyInfo.yearBuilt;
      } else {
        // Only basic fields required if no accepted offer
        isComplete = basicFieldsComplete;
      }
    } else if (tabName === 'loanDetails') {
      isComplete = loanInfo && 
                 loanInfo.loanType && 
                 (
                   (loanInfo.loanType === 'Purchase' && loanInfo.purchasePrice && loanInfo.downPayment) ||
                   (loanInfo.loanType === 'Refinance' && loanInfo.requestedLoanAmount && loanInfo.currentLoanBalance && loanInfo.refinanceType && loanInfo.yearAcquired) ||
                   (loanInfo.loanType === 'Home Improvement' && loanInfo.loanAmount) ||
                   (loanInfo.loanType === 'Construction' && loanInfo.loanAmount && loanInfo.yearLotAcquired)
                 );
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

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'propertyInformation':
        return (
          <PropertyInformation
            propertyInfo={propertyInfo || {}}
            onChange={handleFieldChange}
            errors={errors}
            userType={userType}
          />
        );
      case 'loanDetails':
        return (
          <LoanDetails
            loanInfo={loanInfo || {}}
            onChange={handleFieldChange}
            loanTypes={loanTypes}
            errors={errors}
            userType={userType}
          />
        );
      default:
        return null;
    }
  };

  // Validate property information based on whether they have an accepted offer
  const validatePropertyInfo = () => {
    const missing = [];
    if (!propertyInfo?.propertyType) missing.push('Property Type');
    if (!propertyInfo?.occupancyType) missing.push('Occupancy Type');

    const hasAcceptedOfferNormalized = propertyInfo?.hasAcceptedOffer === true || propertyInfo?.hasAcceptedOffer === 'Yes';
    if (hasAcceptedOfferNormalized) {
      if (!propertyInfo?.contractPurchasePrice) missing.push('Contract Purchase Price');
      if (!propertyInfo?.isMixedUse) missing.push('Mixed-Use Property');
      if (!propertyInfo?.isManufactured) missing.push('Manufactured Home');
      if (!propertyInfo?.numberOfUnits) missing.push('Number Of Units');
      if (!propertyInfo?.yearBuilt) missing.push('Year Built');
    }

    return { valid: missing.length === 0, missing };
  };
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          className={getTabClass('propertyInformation')}
          onClick={() => setActiveTab('propertyInformation')}
          style={
            activeTab === "propertyInformation"
              ? { background: theme.gradients.primary }
              : {}
          }
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Property Information</span>
            {getTabIcon('propertyInformation') && <span className="ml-2">{getTabIcon('propertyInformation')}</span>}
          </div>
        </button>
        
        <button
          type="button"
          className={getTabClass('loanDetails')}
          onClick={() => setActiveTab('loanDetails')}
          style={
            activeTab === "loanDetails"
              ? { background: theme.gradients.primary }
              : {}
          }
        >
          <div className="flex items-center">
            <span className='text-[10.5px] sm:text-sm'>Loan Details</span>
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
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // Validate property info before proceeding
              const result = validatePropertyInfo();
              if (!result.valid) {
                const msg = `Missing: ${result.missing.join(', ')}`;
                toast.error(msg);
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
            className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // Ensure loanInfo exists and has required fields before proceeding to next step
              if (!loanInfo?.loanType) {
                toast.error('Missing: Loan Type');
                return;
              }
              
              if (loanInfo.loanType === 'Purchase') {
                if (!loanInfo.purchasePrice) {
                  toast.error('Missing: Purchase Price');
                  return;
                }
                if (!loanInfo.downPayment) {
                  toast.error('Missing: Down Payment');
                  return;
                }
              }
              
              if (loanInfo.loanType === 'Refinance') {
                if (!loanInfo.requestedLoanAmount) {
                  toast.error('Missing: Requested Loan Amount');
                  return;
                }
                if (!loanInfo.currentLoanBalance) {
                  toast.error('Missing: Current Loan Balance');
                  return;
                }
                if (!loanInfo.refinanceType) {
                  toast.error('Missing: Refinance Type');
                  return;
                }
                if (!loanInfo.yearAcquired) {
                  toast.error('Missing: Year Acquired');
                  return;
                }
              }
              
              if (loanInfo.loanType === 'Construction') {
                if (!loanInfo.loanAmount) {
                  toast.error('Missing: Loan Amount');
                  return;
                }
                if (!loanInfo.yearLotAcquired) {
                  toast.error('Missing: Year Lot Acquired');
                  return;
                }
              }

              if (loanInfo.loanType === 'Home Improvement') {
                if (!loanInfo.loanAmount) {
                  toast.error('Missing: Loan Amount');
                  return;
                }
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
