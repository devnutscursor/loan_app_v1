import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import theme from '../../../styles/theme';

/**
 * Property Information Form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.propertyInfo - Property information data
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Object} props.errors - Form validation errors
 * @param {String} props.userType - Type of user (borrower or lender)
 * @returns {JSX.Element} Property information form component
 */
const PropertyInformation = ({ propertyInfo = {}, onChange, errors = {}, userType = 'borrower' }) => {
  // Local state for responsive input fields - use a state variable for each field
  const [zipCode, setZipCode] = useState(propertyInfo.zipCode || '');
  const [contractPurchasePrice, setContractPurchasePrice] = useState(propertyInfo.contractPurchasePrice || '');
  const [streetAddress, setStreetAddress] = useState(propertyInfo.streetAddress || '');
  const [aptSteNum, setAptSteNum] = useState(propertyInfo.aptSteNum || '');
  const [city, setCity] = useState(propertyInfo.city || '');
  const [state, setState] = useState(propertyInfo.state || '');
  const [propertyAddressZipCode, setPropertyAddressZipCode] = useState(propertyInfo.zipCode || '');
  const [occupancyType, setOccupancyType] = useState(propertyInfo.occupancyType || '');
  const [propertyType, setPropertyType] = useState(propertyInfo.propertyType || '');
  const [propertyValue, setPropertyValue] = useState(propertyInfo.propertyValue || '');
const [hasAcceptedOffer, setHasAcceptedOffer] = useState(
  propertyInfo.hasAcceptedOffer !== undefined ? propertyInfo.hasAcceptedOffer : ''
);
  const [isMixedUse, setIsMixedUse] = useState(propertyInfo.isMixedUse || '');
  const [isManufactured, setIsManufactured] = useState(propertyInfo.isManufactured || '');
  const [numberOfUnits, setNumberOfUnits] = useState(propertyInfo.numberOfUnits || '');
  const [yearBuilt, setYearBuilt] = useState(propertyInfo.yearBuilt || '');
  const [proposedRentalIncome, setProposedRentalIncome] = useState(propertyInfo.proposedRentalIncome || '');
  
  // Update local state when propertyInfo changes from parent
  useEffect(() => {
    setZipCode(propertyInfo.zipCode || '');
    setContractPurchasePrice(propertyInfo.contractPurchasePrice || '');
    setStreetAddress(propertyInfo.streetAddress || '');
    setAptSteNum(propertyInfo.aptSteNum || '');
    setCity(propertyInfo.city || '');
    setState(propertyInfo.state || '');
    setPropertyAddressZipCode(propertyInfo.zipCode || '');
    setOccupancyType(propertyInfo.occupancyType || '');
    setPropertyType(propertyInfo.propertyType || '');
    setPropertyValue(propertyInfo.propertyValue || '');
    setHasAcceptedOffer(
    propertyInfo.hasAcceptedOffer !== undefined ? propertyInfo.hasAcceptedOffer : ''
  );
    setIsMixedUse(propertyInfo.isMixedUse || '');
    setIsManufactured(propertyInfo.isManufactured || '');
    setNumberOfUnits(propertyInfo.numberOfUnits || '');
    setYearBuilt(propertyInfo.yearBuilt || '');
    setProposedRentalIncome(propertyInfo.proposedRentalIncome || '');
  }, [propertyInfo]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state immediately for responsive typing
    switch(name) {
      case 'zipCode':
        setZipCode(value);
        break;
      case 'contractPurchasePrice':
        setContractPurchasePrice(value);
        break;
      case 'streetAddress':
        setStreetAddress(value);
        break;
      case 'aptSteNum':
        setAptSteNum(value);
        break;
      case 'city':
        setCity(value);
        break;
      case 'state':
        setState(value);
        break;
      case 'occupancyType':
        setOccupancyType(value);
        break;
      case 'propertyType':
        setPropertyType(value);
        break;
      case 'propertyValue':
        setPropertyValue(value);
        break;
      case 'isMixedUse':
        setIsMixedUse(value);
        break;
      case 'isManufactured':
        setIsManufactured(value);
        break;
      case 'numberOfUnits':
        setNumberOfUnits(value);
        break;
      case 'yearBuilt':
        setYearBuilt(value);
        break;
      case 'proposedRentalIncome':
        setProposedRentalIncome(value);
        break;
      default:
        break;
    }
    
    // Log the property information change for debugging
    console.log(`PropertyInformation update: ${name} = ${value}`);
    
    // Forward the change to parent component
    onChange({
      target: {
        name: `propertyInfo.${name}`,
        value
      }
    });
  };

  // Handle radio button changes
  const handleRadioChange = (name, value) => {
    // Update local state for immediate response
    if (name === 'hasAcceptedOffer') {
      setHasAcceptedOffer(value);
    }

    // Send to parent component
    onChange({
      target: {
        name: `propertyInfo.${name}`,
        value,
      },
    });
  };

  return (
    <div className="bg-white">
      <div className="px-1 py-3 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {userType === 'borrower' ? 'Property Information' : 'Property Details'}
          </h2>
          {userType === 'borrower' && (
            <p className="text-sm text-gray-500 mb-4">
              Help us gather some details about the home you would like to buy.
            </p>
          )}
          <hr className="border-t border-gray-300 mb-6" />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`flex items-center justify-center p-4 border rounded-md cursor-pointer ${
                hasAcceptedOffer === true
                  ? `border-${theme.colors.primary} bg-opacity-10 bg-${theme.colors.primary}`
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleRadioChange('hasAcceptedOffer', true)}
            >
              <div className="text-center">
                <div
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                    hasAcceptedOffer === true
                      ? 'bg-opacity-20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={
                    hasAcceptedOffer === true
                      ? { backgroundColor: `${theme.colors.primary}20` }
                      : {}
                  }
                >
                  <div
                    style={
                      hasAcceptedOffer === true
                        ? { color: theme.colors.primary }
                        : {}
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className="mt-2 font-medium"
                  style={{
                    color: hasAcceptedOffer === true ? theme.colors.primary : 'inherit',
                  }}
                >
                  Yes
                </div>
              </div>
            </div>

            <div
              className={`flex items-center justify-center p-4 border rounded-md cursor-pointer ${
                hasAcceptedOffer === false
                  ? `border-${theme.colors.primary} bg-opacity-10 bg-${theme.colors.primary}`
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleRadioChange('hasAcceptedOffer', false)}
            >
              <div className="text-center">
                <div
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                    hasAcceptedOffer === false
                      ? 'bg-opacity-20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={
                    hasAcceptedOffer === false
                      ? { backgroundColor: `${theme.colors.primary}20` }
                      : {}
                  }
                >
                  <div
                    style={
                      hasAcceptedOffer === false
                        ? { color: theme.colors.primary }
                        : {}
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className="mt-2 font-medium"
                  style={{
                    color: hasAcceptedOffer === false ? theme.colors.primary : 'inherit',
                  }}
                >
                  No
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fields when "Yes" is selected */}
      {hasAcceptedOffer === true && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="contractPurchasePrice"
              className="block text-xs uppercase font-medium text-gray-500 mb-1"
            >
              Contract Purchase Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="text"
                id="contractPurchasePrice"
                name="contractPurchasePrice"
                value={contractPurchasePrice || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Property ZIP Code (if known)
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={zipCode || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${
                errors['propertyInfo.zipCode'] ? 'border-red-500' : 'border-gray-300'
              } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
            />
            {errors['propertyInfo.zipCode'] && (
              <p className="text-red-500 text-xs mt-1">
                {errors['propertyInfo.zipCode']}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fields when "No" is selected */}
      {hasAcceptedOffer === false && (
        <div>
          <label htmlFor="zipCode" className="block text-xs uppercase font-medium text-gray-500 mb-1">
            Property ZIP Code (if known)
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={zipCode || ''}
            onChange={handleChange}
            className={`text-xs w-full border ${
              errors['propertyInfo.zipCode'] ? 'border-red-500' : 'border-gray-300'
            } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            style={{ '--focus-ring-color': theme.colors.primary }}
          />
          {errors['propertyInfo.zipCode'] && (
            <p className="text-red-500 text-xs mt-1">
              {errors['propertyInfo.zipCode']}
            </p>
          )}
        </div>
      )}

      {/* Additional Details Section */}
      <div>
        {userType === 'borrower' && (
          <h3 className="text-md font-medium text-gray-700 mb-4">Additional Details</h3>
        )}
        {userType === 'lender' && (
          <h3 className="text-md font-medium text-gray-700 mb-4">Property Details</h3>
        )}

        {/* Additional fields for "Yes" selection */}
        {hasAcceptedOffer === true && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
              <div>
                <label
                  htmlFor="isMixedUse"
                  className="block text-xs uppercase font-medium text-gray-500 mb-1"
                >
                  {userType === 'borrower' ? 'Is This Property Mixed-Use?' : 'Mixed-Use Property'}
                </label>
                <div className="relative">
                  <select
                    id="isMixedUse"
                    name="isMixedUse"
                    value={isMixedUse || ''}
                    onChange={handleChange}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="isManufactured" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  {userType === 'borrower' ? 'Is This A Manufactured Home?' : 'Manufactured Home'}
                </label>
                <div className="relative">
                  <select
                    id="isManufactured"
                    name="isManufactured"
                    value={isManufactured || ''}
                    onChange={handleChange}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="numberOfUnits" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Number Of Units
                </label>
                <input
                  type="number"
                  id="numberOfUnits"
                  name="numberOfUnits"
                  min="1"
                  value={numberOfUnits || ''}
                  onChange={handleChange}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
                />
              </div>

              <div>
                <label htmlFor="yearBuilt" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  id="yearBuilt"
                  name="yearBuilt"
                  min="1800"
                  max="2099"
                  value={yearBuilt || ''}
                  onChange={handleChange}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
                />
              </div>

              <div>
                <label htmlFor="proposedRentalIncome" className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Proposed Rental Income (if applicable)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="proposedRentalIncome"
                    name="proposedRentalIncome"
                    value={proposedRentalIncome || ''}
                    onChange={handleChange}
                    className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                  />
                </div>
              </div>
            </div>
           
          </>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home Purpose */}
          <div>
            <label htmlFor="occupancyType" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              {userType === 'borrower' ? 'Occupancy Type' : 'Occupancy Type'}
            </label>
            <div className="relative">
              <select
                id="occupancyType"
                name="occupancyType"
                value={occupancyType || ''}
                onChange={handleChange}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="">Select</option>
                <option value="Primary Residence">Primary Residence</option>
                <option value="Vacation Home">Vacation Home</option>
                <option value="Investment">Investment</option>
                <option value="Other">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors['propertyInfo.occupancyType'] && (
              <p className="text-red-500 text-xs mt-1">{errors['propertyInfo.occupancyType']}</p>
            )}
          </div>
          
          {/* Property Type */}
          <div>
            <label htmlFor="propertyType" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              {userType === 'borrower' ? 'What Type of Home Is This?' : 'Property Type'}
            </label>
            <div className="relative">
              <select
                id="propertyType"
                name="propertyType"
                value={propertyType || ''}
                onChange={handleChange}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              >
                <option value="">Select</option>
                <option value="Single Family Home">Single Family Home</option>
                <option value="Condominium">Condominium</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Multi-Family">Multi-Family</option>
                <option value="Manufactured Home">Manufactured Home</option>
                <option value="Cooperative">Cooperative</option>
                <option value="Planned Unit Development (PUD)">Planned Unit Development (PUD)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors['propertyInfo.propertyType'] && (
              <p className="text-red-500 text-xs mt-1">{errors['propertyInfo.propertyType']}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PropertyInformation.propTypes = {
  propertyInfo: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  userType: PropTypes.oneOf(['borrower', 'lender'])
};

export default PropertyInformation;
