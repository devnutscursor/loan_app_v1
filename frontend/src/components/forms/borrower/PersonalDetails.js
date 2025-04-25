import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

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
 * @returns {JSX.Element} Personal details form component
 */
const PersonalDetails = ({ borrower, onChange, addDependent, removeDependent, handleDependentChange, errors = {} }) => {
  // Local state for each field (similar to property forms)
  const [firstName, setFirstName] = useState(borrower?.firstName || '');
  const [middleName, setMiddleName] = useState(borrower?.middleName || '');
  const [lastName, setLastName] = useState(borrower?.lastName || '');
  const [suffix, setSuffix] = useState(borrower?.suffix || '');
  const [dateOfBirth, setDateOfBirth] = useState(borrower?.dateOfBirth || '');
  const [ssn, setSsn] = useState(borrower?.ssn || '');
  const [citizenship, setCitizenship] = useState(borrower?.citizenship || '');
  const [maritalStatus, setMaritalStatus] = useState(borrower?.maritalStatus || '');
  const [phone, setPhone] = useState(borrower?.phone || '');
  const [email, setEmail] = useState(borrower?.email || '');

  // Handle form field changes - update local state and pass to parent
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state for immediate feedback
    switch (name) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'middleName':
        setMiddleName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'suffix':
        setSuffix(value);
        break;
      case 'dateOfBirth':
        setDateOfBirth(value);
        break;
      case 'ssn':
        setSsn(value);
        break;
      case 'citizenship':
        setCitizenship(value);
        break;
      case 'maritalStatus':
        setMaritalStatus(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'email':
        setEmail(value);
        break;
      default:
        break;
    }
    
    // DEBUG: Log personal details changes
    // console.log(`PersonalDetails - Field ${name} changed to:`, value);
    
    // Pass to parent component
    onChange(e);
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
    if (!borrower.dependents) {
      // console.log('PersonalDetails - Initializing empty dependents array');
      // Initialize dependents as empty array if not defined
      onChange({ target: { name: 'dependents', value: [] } });
    }
  }, []);

  useEffect(() => {
    setFirstName(borrower?.firstName || '');
    setMiddleName(borrower?.middleName || '');
    setLastName(borrower?.lastName || '');
    setSuffix(borrower?.suffix || '');
    setDateOfBirth(borrower?.dateOfBirth || '');
    setSsn(borrower?.ssn || '');
    setCitizenship(borrower?.citizenship || '');
    setMaritalStatus(borrower?.maritalStatus || '');
    setPhone(borrower?.phone || '');
    setEmail(borrower?.email || '');
  }, [borrower]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Personal Details</h2>
        <p className="text-gray-600 mb-4">
          Fill out as much information as you can. If you aren't sure, leave it blank and we will follow up with you.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="firstName" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={handleChange}
              className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
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
              value={middleName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
              value={lastName}
              onChange={handleChange}
              className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
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
              value={suffix}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                value={maritalStatus}
                onChange={handleChange}
                className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              value={dateOfBirth}
              onChange={handleChange}
              className={`w-full border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
              value={ssn}
              onChange={handleChange}
              className={`w-full border ${errors.ssn ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
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
                value={citizenship}
                onChange={handleChange}
                className="appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <h3 className="text-lg font-medium text-gray-700 mb-4">Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
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
              value={phone}
              onChange={handleChange}
              className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ '--focus-ring-color': theme.colors.primary }}
              placeholder="+3 (020) 020-3201"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dependents */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">Dependents</h3>
        
        {borrower.dependents && borrower.dependents.length > 0 && (
          <div className="space-y-4 mb-4">
            {borrower.dependents.map((dependent, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md">
                <div>
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={dependent.name || ''}
                    onChange={(e) => handleChangeDependentField(index, 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--focus-ring-color': theme.colors.primary }}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={dependent.age || ''}
                    onChange={(e) => handleChangeDependentField(index, 'age', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--focus-ring-color': theme.colors.primary }}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                    Relationship
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={dependent.relationship || ''}
                      onChange={(e) => handleChangeDependentField(index, 'relationship', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ '--focus-ring-color': theme.colors.primary }}
                    />
                    <button
                      type="button"
                      onClick={() => removeDependent(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          type="button"
          onClick={() => {
            // console.log('PersonalDetails - Adding new dependent');
            addDependent();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderWidth: '1px',
            borderColor: theme.colors.primary,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: '500',
            color: theme.colors.primary,
            backgroundColor: 'white',
            transition: 'all 150ms ease-in-out',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Dependent
        </button>
      </div>
    </div>
  );
};

export default PersonalDetails;
