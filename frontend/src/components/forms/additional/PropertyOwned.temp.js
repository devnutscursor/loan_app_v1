import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

const PropertyOwned = ({ propertyOwned = {}, onChange, errors = {}, userType = 'borrower' }) => {
  // Local state for immediate UI updates
  const [localProperties, setLocalProperties] = useState(propertyOwned.properties || []);
  const [ownsProperty, setOwnsProperty] = useState(propertyOwned.ownsProperty ?? false);

  // Update local state when props change
  useEffect(() => {
    setLocalProperties(propertyOwned.properties || []);
    setOwnsProperty(propertyOwned.ownsProperty ?? false);
  }, [propertyOwned]);

  // Handle property ownership change
  const handleOwnsPropertyChange = (value) => {
    setOwnsProperty(value);
    
    let updatedProperties = value ? localProperties : [];
    if (!value) {
      setLocalProperties(updatedProperties);
      onChange({
        ...propertyOwned,
        ownsProperty: value,
        properties: updatedProperties,
        realEstateTaxes: '0',
        hazardInsurance: '0',
        hoaDues: '0'
      });
    } else if (value && (!localProperties || localProperties.length === 0)) {
      const defaultProperty = {
        id: `property-${Date.now()}`,
        propertyAddress: {
          streetAddress: '',
          apt: '',
          city: '',
          state: '',
          zipCode: ''
        },
        propertyType: '',
        presentMarketValue: '',
        statusOfProperty: '',
        intendedOccupancy: '',
        monthlyCosts: '',
        grossRentalIncome: '',
        netRentalIncome: '',
        hasLoan: null,
        monthlyPayment: '',
        unpaidBalance: '',
      };

      const newProperties = [defaultProperty];
      setLocalProperties(newProperties);
      updatedProperties = newProperties;
      onChange({
        ...propertyOwned,
        ownsProperty: value,
        properties: updatedProperties
      });
    }
  };

  // Add a new property
  const addProperty = () => {
    const newProperty = {
      id: `property-${Date.now()}`,
      propertyAddress: {
        streetAddress: '',
        apt: '', 
        city: '',
        state: '',
        zipCode: ''
      },
      propertyType: '',
      presentMarketValue: '',
      statusOfProperty: '',
      intendedOccupancy: '',
      monthlyCosts: '',
      grossRentalIncome: '',
      netRentalIncome: '',
      hasLoan: null,
      monthlyPayment: '',
      unpaidBalance: '',
    };

    const updatedProperties = [...localProperties, newProperty];
    setLocalProperties(updatedProperties);

    onChange({
      ...propertyOwned,
      ownsProperty: true,
      properties: updatedProperties
    });
  };

  // Handle property change
  const handlePropertyChange = (propertyId, field, value) => {
    const updatedProperties = localProperties.map(property => {
      if (property.id !== propertyId) return property;

      // Handle nested objects (like propertyAddress)
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        return {
          ...property,
          [parentField]: {
            ...property[parentField],
            [childField]: value
          }
        };
      }
      
      // Direct field update
      return {
        ...property,
        [field]: value
      };
    });

    setLocalProperties(updatedProperties);
    onChange({
      ...propertyOwned,
      properties: updatedProperties
    });
  };

  // Remove a property
  const removeProperty = (propertyId) => {
    const updatedProperties = localProperties.filter(property => property.id !== propertyId);
    setLocalProperties(updatedProperties);
    onChange({
      ...propertyOwned,
      properties: updatedProperties
    });
  };

  // Handle changes in the general housing expenses section
  const handleHousingExpenseChange = (field, value) => {
    onChange({
      ...propertyOwned,
      [field]: formatCurrency(value)
    });
  };

  // Format currency input
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    const cleanedValue = value.toString().replace(/[^0-9.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanedValue;
  };

  // Get string representation for hasLoan select
  const getHasLoanValue = (hasLoan) => {
    if (hasLoan === true) return 'yes';
    if (hasLoan === false) return 'no';
    return ''; // For initial 'Select' state
  };

  return (
    <div>
      {/* Property Ownership Question */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do you currently own any real estate?
        </label>
        {/* Yes/No Selection */}
        <div className="flex space-x-4 mb-6">
          {/* Yes Button */}
          <button
            type="button"
            onClick={() => handleOwnsPropertyChange(true)}
            className={`w-32 text-center border rounded-md p-4 transition-colors duration-150 ${ownsProperty === true
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className="flex justify-center mb-2">
              <span className="text-3xl">👍</span>
            </div>
            <div className={`text-center font-medium ${ownsProperty === true ? 'text-indigo-600' : 'text-gray-700'}`}>
              Yes
            </div>
          </button>

          {/* No Button */}
          <button
            type="button"
            onClick={() => handleOwnsPropertyChange(false)}
            className={`w-32 text-center border rounded-md p-4 transition-colors duration-150 ${ownsProperty === false
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className="flex justify-center mb-2">
              <span className="text-3xl">👎</span>
            </div>
            <div className={`text-center font-medium ${ownsProperty === false ? 'text-indigo-600' : 'text-gray-700'}`}>
              No
            </div>
          </button>
        </div>
        
        {/* Hidden radio inputs for form semantics */}
        <div className="hidden">
          <input 
            type="radio" 
            name="ownsProperty" 
            value="true" 
            checked={ownsProperty === true} 
            onChange={() => {}} 
            className="hidden" 
            aria-hidden="true" 
          />
          <input 
            type="radio" 
            name="ownsProperty" 
            value="false" 
            checked={ownsProperty === false} 
            onChange={() => {}} 
            className="hidden" 
            aria-hidden="true" 
          />
        </div>
      </div>

      {/* Real Estate Owned section */}
      {ownsProperty && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-800 border-b border-gray-300 pb-2 mb-6">
            Real Estate Owned Details
          </h3>

          {localProperties.length === 0 && userType === 'borrower' && (
            <p className="text-gray-600 mb-4">You indicated you own property. Please add property details below.</p>
          )}

          {localProperties.map((property, index) => (
            <div key={property.id} className="mb-8 p-4 border border-gray-200 rounded-md relative shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Property #{index + 1}</h4>

              {/* Remove Property Button */}
              {localProperties.length > 0 && (
                <button
                  type="button"
                  onClick={() => removeProperty(property.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <span className="sr-only">Remove property</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Property Address */}
              <div className="mb-4 border-b border-gray-200 pb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-2">Property Address</h5>
                <div className="mb-4">
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={property.propertyAddress?.streetAddress || ''}
                    onChange={(e) => handlePropertyChange(property.id, 'propertyAddress.streetAddress', e.target.value)}
                    className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="e.g., 123 Main St"
                  />
                </div>

                {/* Additional address fields would go here */}
              </div>

              {/* Property Details */}
              <div className="mb-4 border-b border-gray-200 pb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-2">Property Details</h5>
                <div className="mb-4">
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Property Type
                  </label>
                  <select
                    value={property.propertyType || ''}
                    onChange={(e) => handlePropertyChange(property.id, 'propertyType', e.target.value)}
                    className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <option value="">Select property type</option>
                    <option value="single-family">Single-family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="multi-family">Multi-family</option>
                    <option value="mobile">Mobile/Manufactured</option>
                    <option value="land">Land</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Loan Information */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-2">Loan Information</h5>
                <div className="mb-4">
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Do you have a mortgage on this property?
                  </label>
                  <select
                    value={getHasLoanValue(property.hasLoan)}
                    onChange={(e) => {
                      const value = e.target.value;
                      let hasLoan = null;
                      if (value === 'yes') hasLoan = true;
                      if (value === 'no') hasLoan = false;
                      handlePropertyChange(property.id, 'hasLoan', hasLoan);
                    }}
                    className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {property.hasLoan === false && (
                  <p className="text-sm text-gray-600 mt-2">No loan information required for this property.</p>
                )}
              </div>
            </div>
          ))}

          {/* Add Property Button */}
          <div className="mb-8">
            <button
              type="button"
              onClick={addProperty}
              className="flex items-center justify-center w-full md:w-auto bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Another Property
            </button>
          </div>
        </div>
      )}

      {/* Housing Expenses Section */}
      <div className="mt-10 pt-6 border-t border-gray-300">
        <h3 className="text-lg font-medium text-gray-800 mb-6">
          Current Primary Housing Expenses (Monthly)
        </h3>
        {userType === 'borrower' && (
          <p className="text-sm text-gray-600 mb-4">
            Enter your current monthly costs for your primary residence, whether you rent or own. Enter 0 if not applicable.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
          {/* Basic housing expenses */}
          {!ownsProperty && (
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Rent</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={propertyOwned.rent || ''}
                  onChange={(e) => handleHousingExpenseChange('rent', formatCurrency(e.target.value))}
                  className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Other expenses */}
        </div>
      </div>
    </div>
  );
};

export default PropertyOwned;
