import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

/**
 * MilitaryService Component
 * 
 * Manages the military service section in the Additional Information step
 * 
 * @param {Object} props - Component props
 * @param {Object} props.militaryService - Military service data
 * @param {Function} props.onChange - Function to handle changes
 * @param {Object} props.borrower - Borrower information
 * @param {Object} props.errors - Validation errors
 * @param {String} props.userType - Type of user (borrower or lender)
 * @returns {JSX.Element} MilitaryService form component
 */
const MilitaryService = ({ militaryService = {}, onChange, borrower = {}, errors = {}, userType = 'borrower' }) => {
  // Local state for immediate UI updates
  const [hasServed, setHasServed] = useState(militaryService.hasServed || false);
  const [currentlyServing, setCurrentlyServing] = useState(militaryService.currentlyServing || false);
  const [isRetired, setIsRetired] = useState(militaryService.isRetired || false);
  const [isNonActivated, setIsNonActivated] = useState(militaryService.isNonActivated || false);
  const [isSurvivingSpouse, setIsSurvivingSpouse] = useState(militaryService.isSurvivingSpouse || false);
  const [expirationDate, setExpirationDate] = useState(militaryService.expirationDate || ''); // Added state for expiration date
  
  // Update local state when props change
  useEffect(() => {
    setHasServed(militaryService.hasServed || false);
    setCurrentlyServing(militaryService.currentlyServing || false);
    setIsRetired(militaryService.isRetired || false);
    setIsNonActivated(militaryService.isNonActivated || false);
    setIsSurvivingSpouse(militaryService.isSurvivingSpouse || false);
    setExpirationDate(militaryService.expirationDate || ''); // Update expiration date state
  }, [militaryService]);

  // Get borrower's name for display
  const getBorrowerName = () => {
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    return 'the borrower';
  };

  // Handle military service status change
  const handleServiceChange = (field, value) => {
    let updatedMilitaryService = { ...militaryService };
  
    // Update local state based on the field
    switch (field) {
      case 'hasServed':
        setHasServed(value);
        updatedMilitaryService.hasServed = value;
        if (!value) {
          // Reset other fields if they haven't served
          setCurrentlyServing(false);
          setIsRetired(false);
          setIsNonActivated(false);
          setExpirationDate(''); // Reset expiration date
          updatedMilitaryService = { 
            ...updatedMilitaryService, 
            currentlyServing: false, 
            isRetired: false, 
            isNonActivated: false, 
            expirationDate: '' 
          };
        }
        break;
      case 'currentlyServing':
        setCurrentlyServing(value);
        updatedMilitaryService.currentlyServing = value;
        if (!value) {
          setExpirationDate(''); // Reset expiration date if not currently serving
          updatedMilitaryService.expirationDate = '';
        }
        break;
      case 'isRetired':
        setIsRetired(value);
        updatedMilitaryService.isRetired = value;
        break;
      case 'isNonActivated':
        setIsNonActivated(value);
        updatedMilitaryService.isNonActivated = value;
        break;
      case 'isSurvivingSpouse':
        setIsSurvivingSpouse(value);
        updatedMilitaryService.isSurvivingSpouse = value;
        break;
      case 'expirationDate': // Handle expiration date change
        setExpirationDate(value);
        updatedMilitaryService.expirationDate = value;
        break;
      default:
        break;
    }
    
    // Update parent component
    onChange(updatedMilitaryService);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Military Service</h2>
        {userType === 'borrower' && (
          <p className="text-gray-600 mb-4">
            Have you served in the United States Armed Forces?
          </p>
        )}
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Military Service Question */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Have you served in the United States Armed Forces?
        </h3>
        
        {/* Yes/No Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => handleServiceChange('hasServed', true)}
            className={`flex items-center justify-center sm:px-16 px-10 py-4 border ${
              hasServed
                ? `border-${theme.colors.primary} bg-${theme.colors.primary}10`
                : 'border-gray-300 bg-white'
            } rounded-md focus:outline-none`}
          >
            <span className={`mr-2 text-2xl ${hasServed ? '' : 'text-gray-400'}`} style={{ color: hasServed ? theme.colors.primary : '' }}>
              👍
            </span>
            <span className={`text-lg ${hasServed ? 'font-medium' : 'text-gray-500'}`} style={{ color: hasServed ? theme.colors.primary : '' }}>
              Yes
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => handleServiceChange('hasServed', false)}
            className={`flex items-center justify-center sm:px-16 px-10 py-4 border ${
              hasServed === false
                ? `border-${theme.colors.primary} bg-${theme.colors.primary}10`
                : 'border-gray-300 bg-white'
            } rounded-md focus:outline-none`}
          >
            <span className={`mr-2 text-2xl ${hasServed === false ? '' : 'text-gray-400'}`} style={{ color: hasServed === false ? theme.colors.primary : '' }}>
              👎
            </span>
            <span className={`text-lg ${hasServed === false ? 'font-medium' : 'text-gray-500'}`} style={{ color: hasServed === false ? theme.colors.primary : '' }}>
              No
            </span>
          </button>
        </div>
      </div>

      {/* Additional Military Questions (shown if hasServed is true) */}
      {hasServed && (
        <div className="space-y-6">
          {/* Currently Serving */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-4">
              ARE YOU CURRENTLY SERVING ON ACTIVE DUTY?
            </h3>
            
            <div className="relative">
              <select
                value={currentlyServing ? "Yes" : "No"}
                onChange={(e) => handleServiceChange('currentlyServing', e.target.value === "Yes")}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="text-xs fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Expiration Date (shown if currently serving) */}
          {currentlyServing && (
            <div>
              <h3 className="text-xs font-medium text-gray-700 mb-4">
                What is your projected expiration date of service/tour?
              </h3>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => handleServiceChange('expirationDate', e.target.value)}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          )}

          {/* Retired Status */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-4">
              ARE YOU CURRENTLY RETIRED, DISCHARGED, OR SEPARATED FROM SERVICE?
            </h3>
            
            <div className="relative">
              <select
                value={isRetired ? "Yes" : "No"}
                onChange={(e) => handleServiceChange('isRetired', e.target.value === "Yes")}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="text-xs fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Non-Activated Member */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-4">
              WAS YOUR ONLY PERIOD OF SERVICE AS A NON-ACTIVATED MEMBER OF THE SERVE OR NATIONAL GUARD?
            </h3>
            
            <div className="relative">
              <select
                value={isNonActivated ? "Yes" : "No"}
                onChange={(e) => handleServiceChange('isNonActivated', e.target.value === "Yes")}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="text-xs fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Surviving Spouse */}
          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-4">
              ARE YOU A SURVIVING SPOUSE?
            </h3>
            
            <div className="relative">
              <select
                value={isSurvivingSpouse ? "Yes" : "No"}
                onChange={(e) => handleServiceChange('isSurvivingSpouse', e.target.value === "Yes")}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="text-xs fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilitaryService;
