import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';
import PropTypes from 'prop-types';

/**
 * Personal Details Form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.borrower - Borrower data
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Function} props.addDependent - Function to add a dependent
 * @param {Function} props.removeDependent - Function to remove a dependent
 * @param {Function} props.handleDependentChange - Function to handle dependent field changes
 * @param {Object} props.errors - Form validation errors
 * @param {string} props.userType - Type of user viewing the form ('borrower' or 'lender')
 * @returns {JSX.Element} Personal details form component
 */
const PersonalDetails = ({
  borrower,
  onChange,
  addDependent,
  removeDependent,
  handleDependentChange,
  errors = {},
  userType = 'borrower'
 }) => {
  // Handle form field changes - use dot notation for borrower fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const actualValue = type === "checkbox" ? checked : value;

    // Create a new event with the correct field name using dot notation
    const modifiedEvent = {
      target: {
        name: name, // Use the field name directly (firstName, lastName, etc.)
        value: actualValue,
        type,
        checked
      }
    };

    console.log(`PersonalDetails - Field ${name} changed to:`, actualValue);

    // Pass modified event to parent component
    onChange(modifiedEvent);
  };

  // Helper function for dependent field changes
  const handleChangeDependentField = (index, field, value) => {
    // console.log(`PersonalDetails - Dependent #${index} field ${field} changed to:`, value);
    handleDependentChange(index, field, value);
  };

  // DEBUG: Log component render with current data
  // console.log('PersonalDetails rendering with borrower data:', {
  //   firstName, lastName, dependents: borrower.dependents || []
  // });

  // Ensure dependents is initialized
  useEffect(() => {
    if (!borrower?.dependents) {
      // console.log('PersonalDetails - Initializing empty dependents array');
      // Initialize dependents as empty array if not defined
      onChange({ target: { name: 'dependents', value: [] } });
    }
  }, []);

  // No useEffect needed - component is now fully controlled by parent state

  // Determine if we should show descriptive text (only on borrower side)
  const isLenderView = userType === 'lender';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Personal Details</h2>
        {!isLenderView && (
          <p className="text-gray-600 mb-4">
            Fill out as much information as you can. If you aren't sure, leave it blank and we will follow up with you.
          </p>
        )}
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="firstName" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={borrower?.firstName || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="middleName" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              id="middleName"
              name="middleName"
              value={borrower?.middleName || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.middleName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="lastName" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={borrower?.lastName || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="suffix" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Suffix
            </label>
            <input
              type="text"
              id="suffix"
              name="suffix"
              value={borrower?.suffix || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.suffix ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
              placeholder="Suffix"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="md:col-span-1">
            <label htmlFor="maritalStatus" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Marital Status
            </label>
            <div className="relative">
              <select
                id="maritalStatus"
                name="maritalStatus"
                value={borrower?.maritalStatus || ''}
                onChange={handleChange}
                className={`text-xs appearance-none w-full border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Select</option>
                <option value="married">Married</option>
                <option value="separated">Separated</option>
                <option value="unmarried">Unmarried</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.maritalStatus && (
              <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="dateOfBirth" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Date of Birth
            </label>
            <input
              type="text"
              id="dateOfBirth"
              name="dateOfBirth"
              value={borrower?.dateOfBirth || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="mm/dd/yyyy"
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="ssn" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              SSN
            </label>
            <input
              type="text"
              id="ssn"
              name="ssn"
              value={borrower?.ssn || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.ssn ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
              placeholder="e.g. 555-55-55"
            />
            {errors.ssn && (
              <p className="text-red-500 text-xs mt-1">{errors.ssn}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="citizenship" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Citizenship
            </label>
            <div className="relative">
              <select
                id="citizenship"
                name="citizenship"
                value={borrower?.citizenship || ''}
                onChange={handleChange}
                className={`text-xs appearance-none w-full border ${errors.citizenship ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Select</option>
                <option value="usCitizen">U.S. Citizen</option>
                <option value="permanentResident">Permanent Resident</option>
                <option value="nonPermanentResident">Non-Permanent Resident</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.citizenship && (
              <p className="text-red-500 text-xs mt-1">{errors.citizenship}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={borrower?.email || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={borrower?.phone || ''}
              onChange={handleChange}
              className={`text-xs w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
              placeholder="+3 (020) 020-3201"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Dependents */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Dependents</h3>
          {(borrower.dependents || []).map((dependent, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-md relative">
              <div className="md:col-span-1">
                <label htmlFor={`dependent-name-${index}`} className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id={`dependent-name-${index}`}
                  name="name"
                  value={dependent.name}
                  onChange={(e) => handleDependentChange(index, 'name', e.target.value)}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor={`dependent-age-${index}`} className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  id={`dependent-age-${index}`}
                  name="age"
                  value={dependent.age}
                  onChange={(e) => handleDependentChange(index, 'age', e.target.value)}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor={`dependent-relationship-${index}`} className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  id={`dependent-relationship-${index}`}
                  name="relationship"
                  value={dependent.relationship}
                  onChange={(e) => handleDependentChange(index, 'relationship', e.target.value)}
                  className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeDependent(index)}
                  className="p-2 text-red-500 hover:text-red-700 transition"
                  title="Remove Dependent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDependent}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Add Dependent
          </button>
        </div>
      </div>
    </div>
  );
};

PersonalDetails.propTypes = {
  borrower: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  addDependent: PropTypes.func.isRequired,
  removeDependent: PropTypes.func.isRequired,
  handleDependentChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  userType: PropTypes.oneOf(['borrower', 'lender'])
};

export default PersonalDetails;
