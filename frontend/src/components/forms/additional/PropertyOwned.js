import React, { useState, useEffect } from 'react';
import RequiredFieldIndicator from '../../common/RequiredFieldIndicator';

const PropertyOwned = ({ propertiesOwned = {}, onChange, errors = {}, userType = 'borrower' }) => {
  // Simple theme object
  const theme = {
    colors: {
      primary: '#3B82F6',
      blue500: '#3B82F6',
      blue600: '#2563EB',
      blue800: '#1E40AF'
    }
  };
  
  // Main property ownership state
  const [ownsProperty, setOwnsProperty] = useState(propertiesOwned.ownsProperty || false);
  
  // Current housing expenses state
  const [rent, setRent] = useState(propertiesOwned.rent || 0);
  const [firstMortgage, setFirstMortgage] = useState(propertiesOwned.firstMortgage || 0);
  const [otherFinancing, setOtherFinancing] = useState(propertiesOwned.otherFinancing || 0);
  const [hazardInsurance, setHazardInsurance] = useState(propertiesOwned.hazardInsurance || 0);
  const [realEstateTaxes, setRealEstateTaxes] = useState(propertiesOwned.realEstateTaxes || 0);
  const [mortgageInsurance, setMortgageInsurance] = useState(propertiesOwned.mortgageInsurance || 0);
  const [hoaDues, setHoaDues] = useState(propertiesOwned.hoaDues || 0);
  const [otherHousingExpenses, setOtherHousingExpenses] = useState(propertiesOwned.otherHousingExpenses || 0);
  
  // Properties array state
  const [properties, setProperties] = useState(propertiesOwned.properties || []);
  
  // Update state when props change
  useEffect(() => {
    setOwnsProperty(propertiesOwned.ownsProperty || false);
    setRent(propertiesOwned.rent || 0);
    setFirstMortgage(propertiesOwned.firstMortgage || 0);
    setOtherFinancing(propertiesOwned.otherFinancing || 0);
    setHazardInsurance(propertiesOwned.hazardInsurance || 0);
    setRealEstateTaxes(propertiesOwned.realEstateTaxes || 0);
    setMortgageInsurance(propertiesOwned.mortgageInsurance || 0);
    setHoaDues(propertiesOwned.hoaDues || 0);
    setOtherHousingExpenses(propertiesOwned.otherHousingExpenses || 0);
    setProperties(propertiesOwned.properties || []);
  }, [propertiesOwned]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = name.includes('Amount') || name.includes('Payment') || name.includes('Cost') || name.includes('Tax') || name.includes('Insurance') || name.includes('Dues') || name.includes('Rent') || name.includes('Financing') ? parseFloat(value) || 0 : value;
    
    // Update local state
    switch (name) {
      case 'rent':
        setRent(numValue);
        break;
      case 'firstMortgage':
        setFirstMortgage(numValue);
        break;
      case 'otherFinancing':
        setOtherFinancing(numValue);
        break;
      case 'hazardInsurance':
        setHazardInsurance(numValue);
        break;
      case 'realEstateTaxes':
        setRealEstateTaxes(numValue);
        break;
      case 'mortgageInsurance':
        setMortgageInsurance(numValue);
        break;
      case 'hoaDues':
        setHoaDues(numValue);
        break;
      case 'otherHousingExpenses':
        setOtherHousingExpenses(numValue);
        break;
    }
    
    // Update parent
    const updatedPropertiesOwned = {
      ...propertiesOwned,
      ownsProperty: ownsProperty, // Explicitly preserve the radio button state
      [name]: numValue,
      properties: properties
    };
    onChange(updatedPropertiesOwned);
  };
  
  const handleRadioChange = (name, value) => {
    if (name === 'ownsProperty') {
    setOwnsProperty(value);
    
      let updatedProperties = properties;
      
      // If switching to "Yes" and no properties exist, add a default property
      if (value === true && properties.length === 0) {
      const defaultProperty = {
        propertyAddress: {
          streetAddress: '',
          apt: '',
          city: '',
          state: '',
          zipCode: ''
        },
        propertyType: '',
          presentMarketValue: 0,
          unpaidBalance: 0,
          monthlyPayment: 0,
          monthlyCosts: 0,
          grossRentalIncome: 0,
          netRentalIncome: 0,
          statusOfProperty: 'retained',
          intendedOccupancy: 'primaryResidence',
          hasLoan: false,
          currentHousingExpenses: {
            rent: 0,
            firstMortgage: 0,
            otherFinancing: 0,
            hazardInsurance: 0,
            realEstateTaxes: 0,
            mortgageInsurance: 0,
            hoaDues: 0,
            otherHousingExpenses: 0
          }
        };
        updatedProperties = [defaultProperty];
        setProperties(updatedProperties);
      }
      
      const updatedPropertiesOwned = {
        ...propertiesOwned,
        ownsProperty: value,
        properties: updatedProperties
      };
      onChange(updatedPropertiesOwned);
    }
  };

  const addProperty = () => {
    const newProperty = {
      propertyAddress: {
        streetAddress: '',
        apt: '', 
        city: '',
        state: '',
        zipCode: ''
      },
      propertyType: '',
      presentMarketValue: 0,
      unpaidBalance: 0,
      monthlyPayment: 0,
      monthlyCosts: 0,
      grossRentalIncome: 0,
      netRentalIncome: 0,
      statusOfProperty: 'retained',
      intendedOccupancy: 'primaryResidence',
      hasLoan: false,
      currentHousingExpenses: {
        rent: 0,
        firstMortgage: 0,
        otherFinancing: 0,
        hazardInsurance: 0,
        realEstateTaxes: 0,
        mortgageInsurance: 0,
        hoaDues: 0,
        otherHousingExpenses: 0
      }
    };
    
    const updatedProperties = [...properties, newProperty];
    setProperties(updatedProperties);
    
    const updatedPropertiesOwned = {
      ...propertiesOwned,
      ownsProperty: ownsProperty, // Explicitly preserve the radio button state
      properties: updatedProperties
    };
    onChange(updatedPropertiesOwned);
  };
  
  const removeProperty = (index) => {
    const updatedProperties = properties.filter((_, i) => i !== index);
    setProperties(updatedProperties);
    
    const updatedPropertiesOwned = {
      ...propertiesOwned,
      ownsProperty: ownsProperty, // Explicitly preserve the radio button state
      properties: updatedProperties
    };
    onChange(updatedPropertiesOwned);
  };
  
  const updateProperty = (index, field, value) => {
    const updatedProperties = [...properties];
    const numValue = field.includes('Value') || field.includes('Balance') || field.includes('Payment') || field.includes('Cost') || field.includes('Income') ? parseFloat(value) || 0 : value;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!updatedProperties[index][parent]) {
        updatedProperties[index][parent] = {};
      }
      updatedProperties[index][parent][child] = numValue;
    } else {
      updatedProperties[index][field] = numValue;
    }
    
    setProperties(updatedProperties);
    
    // Update parent while preserving the ownsProperty state
    const updatedPropertiesOwned = {
      ...propertiesOwned,
      ownsProperty: ownsProperty, // Explicitly preserve the radio button state
      properties: updatedProperties
    };
    onChange(updatedPropertiesOwned);
  };

  return (
    <div className="space-y-6">
      {/* Property Ownership Question */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Property Ownership</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please indicate if you own any real estate and provide details below. Also, list your current primary housing expenses.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Do you currently own any real estate?<RequiredFieldIndicator />
        </label>
          <div className="flex space-x-4">
          <button
            type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRadioChange('ownsProperty', true);
              }}
              className={`flex items-center px-4 py-2 rounded-md border ${
                ownsProperty === true
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Yes
          </button>
          <button
            type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRadioChange('ownsProperty', false);
              }}
              className={`flex items-center px-4 py-2 rounded-md border ${
                ownsProperty === false
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No
          </button>
        </div>
        </div>
      </div>

      {/* Real Estate Owned Details */}
      {ownsProperty && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Real Estate Owned Details</h4>
          
          {properties.map((property, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-900">Property #{index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeProperty(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Property Address */}
              <div className="mb-6">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Property Address</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">STREET ADDRESS</label>
                  <input
                    type="text"
                    value={property.propertyAddress?.streetAddress || ''}
                      onChange={(e) => updateProperty(index, 'propertyAddress.streetAddress', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">APT/STE # (optional)</label>
                    <input
                      type="text"
                      value={property.propertyAddress?.apt || ''}
                      onChange={(e) => updateProperty(index, 'propertyAddress.apt', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CITY</label>
                    <input
                      type="text"
                      value={property.propertyAddress?.city || ''}
                      onChange={(e) => updateProperty(index, 'propertyAddress.city', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">STATE</label>
                    <select
                      value={property.propertyAddress?.state || ''}
                      onChange={(e) => updateProperty(index, 'propertyAddress.state', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ZIP CODE</label>
                    <input
                      type="text"
                      value={property.propertyAddress?.zipCode || ''}
                      onChange={(e) => updateProperty(index, 'propertyAddress.zipCode', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="mb-6">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Property Information</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">MARKET VALUE (ESTIMATED)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">$</span>
                      </div>
                      <input
                        type="number"
                        value={property.presentMarketValue || ''}
                        onChange={(e) => updateProperty(index, 'presentMarketValue', e.target.value)}
                        className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">MONTHLY COSTS (TAX, INS, HOA)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">$</span>
                      </div>
                      <input
                        type="number"
                        value={property.monthlyCosts || ''}
                        onChange={(e) => updateProperty(index, 'monthlyCosts', e.target.value)}
                        className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">GROSS RENTAL INCOME (IF APPLICABLE)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">$</span>
                      </div>
                      <input
                        type="number"
                        value={property.grossRentalIncome || ''}
                        onChange={(e) => updateProperty(index, 'grossRentalIncome', e.target.value)}
                        className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">NET RENTAL INCOME (IF APPLICABLE)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">$</span>
                      </div>
                      <input
                        type="number"
                        value={property.netRentalIncome || ''}
                        onChange={(e) => updateProperty(index, 'netRentalIncome', e.target.value)}
                        className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">STATUS OF PROPERTY</label>
                    <select
                      value={property.statusOfProperty || ''}
                      onChange={(e) => updateProperty(index, 'statusOfProperty', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="retained">Retained</option>
                      <option value="sold">Sold</option>
                      <option value="sellingHomeBeforeBuying">Selling Home Before Buying</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">INTENDED OCCUPANCY</label>
                  <select
                      value={property.intendedOccupancy || ''}
                      onChange={(e) => updateProperty(index, 'intendedOccupancy', e.target.value)}
                      className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Occupancy</option>
                      <option value="primaryResidence">Primary Residence</option>
                      <option value="vacationHome">Vacation Home</option>
                      <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div className="mb-6">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Loan Information</h6>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    IS THERE A LOAN (MORTGAGE) ON THIS PROPERTY?
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateProperty(index, 'hasLoan', true);
                      }}
                      className={`flex items-center px-4 py-2 rounded-md border ${
                        property.hasLoan === true
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateProperty(index, 'hasLoan', false);
                      }}
                      className={`flex items-center px-4 py-2 rounded-md border ${
                        property.hasLoan === false
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      No
                    </button>
                  </div>
                </div>

                {/* Conditional loan fields */}
                {property.hasLoan === true && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">MONTHLY PAYMENT (P&I)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs">$</span>
                        </div>
                        <input
                          type="number"
                          value={property.monthlyPayment || ''}
                          onChange={(e) => updateProperty(index, 'monthlyPayment', e.target.value)}
                          className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">UNPAID BALANCE (ESTIMATED)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs">$</span>
                        </div>
                        <input
                          type="number"
                          value={property.unpaidBalance || ''}
                          onChange={(e) => updateProperty(index, 'unpaidBalance', e.target.value)}
                          className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

            <button
              type="button"
              onClick={addProperty}
            className="border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
            >
            + Add Another Property
            </button>
        </div>
      )}

      {/* Current Primary Housing Expenses */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Current Primary Housing Expenses (Monthly)</h4>
          <p className="text-sm text-gray-600 mb-4">
            Enter your current monthly costs for your primary residence, whether you rent or own. Enter 0 if not applicable.
          </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RENT</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="rent"
                value={rent || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">FIRST MORTGAGE (P&I)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="firstMortgage"
                value={firstMortgage || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">OTHER FINANCING (P&I)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="otherFinancing"
                value={otherFinancing || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">HAZARD INSURANCE</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="hazardInsurance"
                value={hazardInsurance || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">REAL ESTATE TAXES</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="realEstateTaxes"
                value={realEstateTaxes || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
            <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">MORTGAGE INSURANCE</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
                </div>
                <input
                type="number"
                name="mortgageInsurance"
                value={mortgageInsurance || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">HOA DUES</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="hoaDues"
                value={hoaDues || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">OTHER HOUSING EXPENSES</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xs">$</span>
              </div>
              <input
                type="number"
                name="otherHousingExpenses"
                value={otherHousingExpenses || ''}
                onChange={handleChange}
                className="text-xs pl-7 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyOwned;
