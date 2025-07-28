import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RequiredFieldIndicator from '../../common/RequiredFieldIndicator';

/**
 * Residence History Form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.borrower - Borrower data
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Object} props.errors - Form validation errors
 * @param {string} props.userType - Type of user viewing the form ('borrower' or 'lender')
 * @returns {JSX.Element} Residence history form component
 */
const ResidenceHistory = ({ borrower, onChange, errors = {}, userType = 'borrower' }) => {
  // Local state initialized from props once
  const [streetAddress, setStreetAddress] = useState(borrower?.currentAddress?.streetAddress || '');
  const [aptSteNum, setAptSteNum] = useState(borrower?.currentAddress?.aptSteNum || '');
  const [city, setCity] = useState(borrower?.currentAddress?.city || '');
  const [state, setState] = useState(borrower?.currentAddress?.state || '');
  const [zipCode, setZipCode] = useState(borrower?.currentAddress?.zipCode || '');
  const [housingStatus, setHousingStatus] = useState(borrower?.currentAddress?.housingStatus || '');
  const [yearsAtAddress, setYearsAtAddress] = useState(borrower?.currentAddress?.yearsAtAddress || '');
  const [monthsAtAddress, setMonthsAtAddress] = useState(borrower?.currentAddress?.monthsAtAddress || '');
  
  // Local state for mailing address
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(borrower?.mailingAddress?.sameAsCurrentAddress || false);
  
  // Sync local state when borrower prop changes
  useEffect(() => {
    console.log("ResidenceHistory useEffect - borrower prop changed:", borrower);
    setStreetAddress(borrower?.currentAddress?.streetAddress || '');
    setAptSteNum(borrower?.currentAddress?.aptSteNum || '');
    setCity(borrower?.currentAddress?.city || '');
    setState(borrower?.currentAddress?.state || '');
    setZipCode(borrower?.currentAddress?.zipCode || '');
    setHousingStatus(borrower?.currentAddress?.housingStatus || '');
    setYearsAtAddress(borrower?.currentAddress?.yearsAtAddress || '');
    setMonthsAtAddress(borrower?.currentAddress?.monthsAtAddress || '');
    setSameAsCurrentAddress(borrower?.mailingAddress?.sameAsCurrentAddress || false);
  }, [borrower?.currentAddress, borrower?.mailingAddress]);

  // Handle form field changes - pass the event directly to parent
  const handleChange = (e) => {
    onChange(e);
  };

  // Handle form field changes for current address
  const handleCurrentAddressChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state for immediate feedback
    switch (name) {
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
      case 'zipCode':
        setZipCode(value);
        break;
      case 'housingStatus':
        setHousingStatus(value);
        break;
      case 'yearsAtAddress':
        setYearsAtAddress(value);
        break;
      case 'monthsAtAddress':
        setMonthsAtAddress(value);
        break;
      default:
        break;
    }
    
    // Send to parent component with dot notation for currentAddress
    onChange({
      target: {
        name: `currentAddress.${name}`,
        value
      }
    });
  };
  
  // Handle form field changes for mailing address
  const handleMailingAddressChange = (e) => {
    const { name, value } = e.target;
    
    // Send to parent component with dot notation for mailingAddress
    onChange({
      target: {
        name: `mailingAddress.${name}`,
        value
      }
    });
  };

  // Handle same as current address checkbox
  const handleSameAsCurrentAddress = (e) => {
    const { checked } = e.target;
    
    // Update local state
    setSameAsCurrentAddress(checked);
    
    let updatedMailingAddress = {
      ...(borrower.mailingAddress || {}),
      sameAsCurrentAddress: checked
    };
    
    if (checked && borrower.currentAddress) {
      // Copy current address fields to mailing address
      updatedMailingAddress = {
        ...updatedMailingAddress,
        streetAddress: streetAddress,
        aptSteNum: aptSteNum,
        city: city,
        state: state,
        zipCode: zipCode
      };
    }
    
    // Send to parent component with dot notation for mailingAddress
    onChange({
      target: {
        name: 'mailingAddress',
        value: updatedMailingAddress
      }
    });
  };

  // Determine if we should show descriptive text (only on borrower side)
  const isLenderView = userType === 'lender';

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-medium text-gray-700 mb-2">Residence History</h2>
      <div>
        {userType === 'borrower' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Where do you live?</h3>
            <p className="text-xs text-gray-500 mb-4">Please tell us a little about your current home.</p>
            <hr className="border-t border-gray-300 mb-6" />
          </>
        )}
      </div>

      {/* Current Address */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Current Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="streetAddress" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Street Address<RequiredFieldIndicator />
            </label>
            <input
              type="text"
              id="streetAddress"
              name="streetAddress"
              value={streetAddress}
              onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.streetAddress'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="123 Main St"
            />
            {errors['currentAddress.streetAddress'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.streetAddress']}</p>
            )}
          </div>

          <div>
            <label htmlFor="aptSteNum" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Apt/Ste #
            </label>
            <input
              type="text"
              id="aptSteNum"
              name="aptSteNum"
              value={aptSteNum}
              onChange={handleCurrentAddressChange}
              className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              City<RequiredFieldIndicator />
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={city}
              onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.city'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Anytown"
            />
            {errors['currentAddress.city'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.city']}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="state" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              State<RequiredFieldIndicator />
            </label>
            <div className="relative">
              <select
                id="state"
                name="state"
                value={state}
                onChange={handleCurrentAddressChange}
                className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <option value="DC">District of Columbia</option>
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
                {/* Add all states here */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors['currentAddress.state'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.state']}</p>
            )}
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              ZIP Code<RequiredFieldIndicator />
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={zipCode}
              onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.zipCode'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="90210"
            />
            {errors['currentAddress.zipCode'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.zipCode']}</p>
            )}
        </div>

          <div>
            <label htmlFor="housingStatus" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Housing Status<RequiredFieldIndicator />
            </label>
              <select
              id="housingStatus"
              name="housingStatus"
              value={housingStatus}
                onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.housingStatus'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Select</option>
              <option value="Own">Own</option>
              <option value="Rent">Rent</option>
              <option value="LiveRentFree">Live Rent Free</option>
              </select>
            {errors['currentAddress.housingStatus'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.housingStatus']}</p>
            )}
          </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="yearsAtAddress" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Years at Address<RequiredFieldIndicator />
            </label>
            <input
              type="number"
              id="yearsAtAddress"
              name="yearsAtAddress"
              value={yearsAtAddress}
              onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.yearsAtAddress'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="2"
              min="0"
            />
            {errors['currentAddress.yearsAtAddress'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.yearsAtAddress']}</p>
            )}
          </div>

          <div>
            <label htmlFor="monthsAtAddress" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Months at Address<RequiredFieldIndicator />
            </label>
            <input
              type="number"
              id="monthsAtAddress"
              name="monthsAtAddress"
              value={monthsAtAddress}
              onChange={handleCurrentAddressChange}
              className={`text-xs w-full border ${errors['currentAddress.monthsAtAddress'] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="6"
              min="0"
              max="11"
            />
            {errors['currentAddress.monthsAtAddress'] && (
              <p className="text-red-500 text-xs mt-1">{errors['currentAddress.monthsAtAddress']}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mailing Address */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Mailing Address</h3>
        
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={sameAsCurrentAddress}
              onChange={handleSameAsCurrentAddress}
              className="text-xs rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-gray-700">Same as Current Address</span>
          </label>
        </div>
        
        {!sameAsCurrentAddress && (
          <div className="p-4 border border-gray-200 rounded-md">
            <button
              type="button"
              className="flex items-center px-4 py-2 text-sm font-medium text-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
              </svg>
              Add Mailing Address (If Different)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ResidenceHistory.propTypes = {
  borrower: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  userType: PropTypes.oneOf(['borrower', 'lender'])
};

export default ResidenceHistory;
