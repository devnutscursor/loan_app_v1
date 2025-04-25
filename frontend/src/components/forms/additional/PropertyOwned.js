import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme'; // Assuming theme is correctly configured

/**
 * PropertyOwned Component
 *
 * Manages the property ownership section in the Additional Information step
 *
 * @param {Object} props - Component props
 * @param {Object} props.propertyOwned - Property ownership data { ownsProperty: boolean, properties: Array, rent?: string, firstMortgage?: string, ... }
 * @param {Function} props.onChange - Function to handle changes in the propertyOwned object
 * @param {Object} props.errors - Validation errors (currently unused, but kept for potential future use)
 * @returns {JSX.Element} PropertyOwned form component
 */
const PropertyOwned = ({ propertyOwned = {}, onChange, errors = {} }) => {
  // Local state for immediate UI updates
  const [localProperties, setLocalProperties] = useState(propertyOwned.properties || []);
  const [ownsProperty, setOwnsProperty] = useState(propertyOwned.ownsProperty ?? false); // Use nullish coalescing for clarity

  useEffect(() => {
    console.log('propertyOwned from PropertyOwned is ', propertyOwned);
  }, [propertyOwned]);

  // Update local state when props change
  useEffect(() => {
    console.log('propertyOwned.ownsProperty is ', propertyOwned.ownsProperty);
    setLocalProperties(propertyOwned.properties || []);
    setOwnsProperty(propertyOwned.ownsProperty ?? false);
  }, [propertyOwned]);

  // Handle property ownership change
  const handleOwnsPropertyChange = (value) => {
    // Update the ownsProperty state first
    setOwnsProperty(value);
    
    // If changing to 'No', clear the properties list
    let updatedProperties = value ? localProperties : [];
    if (!value) {
      setLocalProperties(updatedProperties);
    } else if (value && (!localProperties || localProperties.length === 0)) {
      // If changing to 'Yes' and no properties exist, add a default property
      const defaultProperty = {
        id: `property-${Date.now()}`,
        propertyAddress: {
          streetAddress: '',
          apt: '', // Added missing field
          city: '',
          state: '',
          zipCode: ''
        },
        propertyType: '', // Added missing field (though no input yet)
        presentMarketValue: '',
        statusOfProperty: '', // Default to empty or a sensible default like 'retained'
        intendedOccupancy: '', // Default to empty or a sensible default
        monthlyCosts: '', // Added missing field
        grossRentalIncome: '', // Added missing field
        netRentalIncome: '', // Added missing field
        hasLoan: null, // Use null for unset boolean select
        monthlyPayment: '', // Added missing field
        unpaidBalance: '', // Added missing field
      };

      const newProperties = [defaultProperty];
      setLocalProperties(newProperties);
      updatedProperties = newProperties;
    }
    
    onChange({
      ...propertyOwned,
      ownsProperty: value,
      properties: updatedProperties,
    });
  };

  // Add a new property
  const addProperty = () => {
    const newProperty = {
      // Initialize all fields accessed in the form
      id: `property-${Date.now()}`,
      propertyAddress: {
        streetAddress: '',
        apt: '', // Added missing field
        city: '',
        state: '',
        zipCode: ''
      },
      propertyType: '', // Added missing field (though no input yet)
      presentMarketValue: '',
      statusOfProperty: '', // Default to empty or a sensible default like 'retained'
      intendedOccupancy: '', // Default to empty or a sensible default
      monthlyCosts: '', // Added missing field
      grossRentalIncome: '', // Added missing field
      netRentalIncome: '', // Added missing field
      hasLoan: null, // Use null for unset boolean select
      monthlyPayment: '', // Added missing field
      unpaidBalance: '', // Added missing field
    };

    const updatedProperties = [...localProperties, newProperty];
    setLocalProperties(updatedProperties);

    onChange({
      ...propertyOwned,
      ownsProperty: true, // Adding a property implies ownership
      properties: updatedProperties
    });
  };

  // Handle property change
  const handlePropertyChange = (propertyId, field, value) => {
    let updatedProperties;

    // Handle boolean conversion for 'hasLoan' from select
    if (field === 'hasLoan') {
      value = value === 'yes' ? true : value === 'no' ? false : null;
    }

    // For nested address fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedProperties = localProperties.map(property => {
        if (property.id === propertyId) {
          return {
            ...property,
            [parent]: {
              ...property[parent],
              [child]: value
            }
          };
        }
        return property;
      });
    } else {
      // For direct fields
      updatedProperties = localProperties.map(property => {
        if (property.id === propertyId) {
          const updatedProp = { ...property, [field]: value };
          // If hasLoan becomes false, clear loan details
          if (field === 'hasLoan' && value === false) {
            updatedProp.monthlyPayment = '';
            updatedProp.unpaidBalance = '';
          }
          return updatedProp;
        }
        return property;
      });
    }

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
      // If removing the last property, should ownsProperty become false? Depends on desired UX.
      // ownsProperty: updatedProperties.length > 0,
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
    // Remove non-digit characters except for the decimal point
    const cleanedValue = value.toString().replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
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
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Property Ownership</h2>
        <p className="text-gray-600 mb-4">
          Please indicate if you own any real estate and provide details below. Also, list your current primary housing expenses.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Property Ownership Question */}
      <div>
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
                ? 'border-indigo-500 ring-2 ring-indigo-200' // Use theme.colors.primary if available and configured
                : 'border-gray-300 hover:border-gray-400'
              }`}
          // style={{ borderColor: ownsProperty === true ? theme.colors.primary : 'transparent' }} // Alt: Inline style if theme setup is complex
          >
            <div className="flex justify-center mb-2">
              <span className="text-3xl">👍</span>
            </div>
            <div className={`text-center font-medium ${ownsProperty === true ? 'text-indigo-600' : 'text-gray-700'}`}>
              {/* style={{ color: ownsProperty === true ? theme.colors.primary : 'inherit' }} */}
              Yes
            </div>
          </button>

          {/* No Button */}
          <button
            type="button"
            onClick={() => handleOwnsPropertyChange(false)}
            className={`w-32 text-center border rounded-md p-4 transition-colors duration-150 ${ownsProperty === false
                ? 'border-indigo-500 ring-2 ring-indigo-200' // Use theme.colors.primary if available and configured
                : 'border-gray-300 hover:border-gray-400'
              }`}
          // style={{ borderColor: ownsProperty === false ? theme.colors.primary : 'transparent' }} // Alt: Inline style if theme setup is complex
          >
            <div className="flex justify-center mb-2">
              <span className="text-3xl">👎</span>
            </div>
            <div className={`text-center font-medium ${ownsProperty === false ? 'text-indigo-600' : 'text-gray-700'}`}>
              {/* style={{ color: ownsProperty === false ? theme.colors.primary : 'inherit' }} */}
              No
            </div>
          </button>
        </div>
        {/* Hidden radio inputs for form semantics if needed, but buttons control state directly */}
        <input type="radio" name="ownsProperty" value="true" checked={ownsProperty === true} onChange={() => { }} className="hidden" aria-hidden="true" />
        <input type="radio" name="ownsProperty" value="false" checked={ownsProperty === false} onChange={() => { }} className="hidden" aria-hidden="true" />
      </div>

      {/* Real Estate Owned section (shown if ownsProperty is true) */}
      {ownsProperty && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 border-b border-gray-300 pb-2 mb-6">
            Real Estate Owned Details
          </h3>

          {localProperties.length === 0 && (
            <p className="text-gray-600 mb-4">You indicated you own property. Please add property details below.</p>
          )}

          {localProperties.map((property, index) => (
            <div key={property.id} className="mb-8 p-4 border border-gray-200 rounded-md relative shadow-sm">
              <h4 className="text-md font-semibold text-gray-700 mb-4">Property #{index + 1}</h4>

              {/* Remove Property Button */}
              {localProperties.length > 0 && ( // Show remove button only if there are properties
                <button
                  type="button"
                  onClick={() => removeProperty(property.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
                  title="Remove this property"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    // style={{ '--focus-ring-color': theme.colors.primary }} // Use Tailwind focus classes instead if possible
                    placeholder="e.g., 123 Main St"
                  />
                  {/* Error display example: {errors?.[`properties.${index}.propertyAddress.streetAddress`] && <p className="text-red-500 text-xs mt-1">{errors[`properties.${index}.propertyAddress.streetAddress`]}</p>} */}
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Apt/Ste # <span className="text-gray-400 lowercase">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={property.propertyAddress?.apt || ''}
                    onChange={(e) => handlePropertyChange(property.id, 'propertyAddress.apt', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="e.g., Unit 5B"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={property.propertyAddress?.city || ''}
                      onChange={(e) => handlePropertyChange(property.id, 'propertyAddress.city', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      placeholder="e.g., Anytown"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                      State
                    </label>
                    <select
                      value={property.propertyAddress?.state || ''}
                      onChange={(e) => handlePropertyChange(property.id, 'propertyAddress.state', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select State</option>
                      {/* Add all US states and territories */}
                      <option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="DC">District Of Columbia</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option>
                      {/* Add territories if needed: AS, GU, MP, PR, VI */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric" // Helps mobile keyboards
                      value={property.propertyAddress?.zipCode || ''}
                      onChange={(e) => handlePropertyChange(property.id, 'propertyAddress.zipCode', e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      placeholder="e.g., 90210"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div> {/* End Address Section */}

              {/* Property Details */}
              <div className="mb-4 border-b border-gray-200 pb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-3">Property Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Property Type Input (Example - Needs options) */}
                  {/*
                     <div>
                         <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Property Type</label>
                         <select
                             value={property.propertyType || ''}
                             onChange={(e) => handlePropertyChange(property.id, 'propertyType', e.target.value)}
                             className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white"
                         >
                             <option value="">Select Type</option>
                             <option value="singleFamily">Single Family</option>
                             <option value="condo">Condo</option>
                             <option value="townhouse">Townhouse</option>
                             <option value="multiFamily">Multi-Family</option>
                             <option value="land">Land</option>
                             {/* Add other relevant types *}
                         </select>
                     </div>
                     */}
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Market Value (Estimated)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={property.presentMarketValue || ''}
                        onChange={(e) => handlePropertyChange(property.id, 'presentMarketValue', formatCurrency(e.target.value))}
                        className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        placeholder="e.g., 300000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Monthly Costs (Tax, Ins, HOA)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={property.monthlyCosts || ''}
                        onChange={(e) => handlePropertyChange(property.id, 'monthlyCosts', formatCurrency(e.target.value))}
                        className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        placeholder="e.g., 450"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Gross Rental Income (If Applicable)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={property.grossRentalIncome || ''}
                        onChange={(e) => handlePropertyChange(property.id, 'grossRentalIncome', formatCurrency(e.target.value))}
                        className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Net Rental Income (If Applicable)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={property.netRentalIncome || ''}
                        onChange={(e) => handlePropertyChange(property.id, 'netRentalIncome', formatCurrency(e.target.value))}
                        className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                      Status of Property
                    </label>
                    <select
                      value={property.statusOfProperty || ''}
                      onChange={(e) => handlePropertyChange(property.id, 'statusOfProperty', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select Status</option>
                      <option value="sold">Sold</option>
                      <option value="retained">Retained</option>
                      <option value="sellingHomeBeforeBuying">Selling Home before Buying</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                      Intended Occupancy
                    </label>
                    <select
                      value={property.intendedOccupancy || ''}
                      onChange={(e) => handlePropertyChange(property.id, 'intendedOccupancy', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select Occupancy</option>
                      <option value="primaryResidence">Primary Residence</option>
                      <option value="vacationHome">Vacation Home</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Rental Income Fields (Conditional?) - Show only if Investment or Vacation Home */}
                {(property.intendedOccupancy === 'investment' || property.intendedOccupancy === 'vacationHome') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-6 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Gross Rental Income (Monthly)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={property.grossRentalIncome || ''}
                          onChange={(e) => handlePropertyChange(property.id, 'grossRentalIncome', formatCurrency(e.target.value))}
                          className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          placeholder="e.g., 1500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Net Rental Income (Monthly)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={property.netRentalIncome || ''}
                          onChange={(e) => handlePropertyChange(property.id, 'netRentalIncome', formatCurrency(e.target.value))}
                          className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          placeholder="e.g., 1000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div> {/* End Property Info Section */}


              {/* Loan Details */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-600 mb-3">Loan Information</h5>
                <div className="mb-4">
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Is there a loan (Mortgage) on this property?
                  </label>
                  <select
                    value={getHasLoanValue(property.hasLoan)} // Use helper to map boolean/null to string
                    onChange={(e) => handlePropertyChange(property.id, 'hasLoan', e.target.value)}
                    className="w-full md:w-1/2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {property.hasLoan === true && ( // Only show if hasLoan is explicitly true
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                        Monthly Payment (P&I)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={property.monthlyPayment || ''}
                          onChange={(e) => handlePropertyChange(property.id, 'monthlyPayment', formatCurrency(e.target.value))}
                          className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          placeholder="e.g., 1200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                        Unpaid Balance (Estimated)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={property.unpaidBalance || ''}
                          onChange={(e) => handlePropertyChange(property.id, 'unpaidBalance', formatCurrency(e.target.value))}
                          className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          placeholder="e.g., 150000"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {property.hasLoan === false && ( // Optional: Confirmation message when 'No' is selected
                  <p className="text-sm text-gray-600 mt-2">No loan information required for this property.</p>
                )}
              </div> {/* End Loan Section */}

            </div> // End Property Card
          ))}

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={addProperty}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md border border-indigo-300 hover:bg-indigo-50"
            //   style={{ color: theme.colors.primary }} // Use classes or inline style
            >
              + Add Another Property
            </button>
          </div>

        </div> // End Real Estate Owned Details Wrapper
      )}

      {/* Housing Expenses Section (Always Visible) */}
      <div className="mt-10 pt-6 border-t border-gray-300">
        <h3 className="text-lg font-medium text-gray-800 mb-6">
          Current Primary Housing Expenses (Monthly)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your current monthly costs for your primary residence, whether you rent or own. Enter 0 if not applicable.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
          {/* When ownsProperty is false, only show Rent field */}
          {!ownsProperty ? (
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
                  className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Rent Input */}
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
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* First Mortgage */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">First Mortgage (P&I)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.firstMortgage || ''}
                    onChange={(e) => handleHousingExpenseChange('firstMortgage', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Other Financing */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Other Financing (P&I)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.otherFinancing || ''}
                    onChange={(e) => handleHousingExpenseChange('otherFinancing', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Hazard Insurance */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Hazard Insurance</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.hazardInsurance || ''}
                    onChange={(e) => handleHousingExpenseChange('hazardInsurance', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Real Estate Taxes */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Real Estate Taxes</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.realEstateTaxes || ''}
                    onChange={(e) => handleHousingExpenseChange('realEstateTaxes', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Mortgage Insurance */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Mortgage Insurance</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.mortgageInsurance || ''}
                    onChange={(e) => handleHousingExpenseChange('mortgageInsurance', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* HOA Dues */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">HOA Dues</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.hoaDues || ''}
                    onChange={(e) => handleHousingExpenseChange('hoaDues', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Other Housing Expenses */}
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">Other Housing Expenses</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={propertyOwned.otherHousingExpenses || ''}
                    onChange={(e) => handleHousingExpenseChange('otherHousingExpenses', formatCurrency(e.target.value))}
                    className="pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div> {/* End Housing Expenses Section */}

    </div>
  );
};

export default PropertyOwned;