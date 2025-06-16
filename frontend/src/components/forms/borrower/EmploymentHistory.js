import React, { useState, useEffect } from 'react';
import theme from '../../../styles/theme';

/**
 * Employment History form component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.borrower - Borrower data with employers
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Object} props.errors - Form validation errors
 * @returns {JSX.Element} Employment history form
 */
const EmploymentHistory = ({ borrower, onChange, errors = {} }) => {
  // Local state initialized from props once
  const [employers, setEmployers] = useState(borrower?.employers || []);

  // Sync local employers when borrower prop updates
  useEffect(() => {
    setEmployers(borrower?.employers || []);
  }, [borrower?.employers]);

  // Handle employer field changes
  const handleEmployerChange = (index, field, value) => {
    // Make a deep copy of the employers array
    const updatedEmployers = JSON.parse(JSON.stringify(employers));
    
    // Make sure the employer at this index exists
    if (!updatedEmployers[index]) {
      updatedEmployers[index] = {};
    }
    
    // Update the specific field for the employer at the given index
    updatedEmployers[index][field] = value;
    
    // Update local state for immediate response
    setEmployers(updatedEmployers);
    
    // Pass the updated employers array to the parent component
    onChange({
      target: {
        name: 'employers',
        value: updatedEmployers
      }
    });
  };

  // Add a new employer
  const addEmployer = () => {
    // Create a new employer object with empty fields
    const newEmployer = {
      companyName: '',
      companyPhone: '',
      employmentStatus: '',
      jobTitle: '',
      startDate: '',
      yearsInProfession: '',
      monthsInProfession: '',
      streetAddress: '',
      aptSteNum: '',
      city: '',
      state: '',
      zipCode: '',
      isSelfEmployed: '',
      ownsMoreThan25Percent: ''
    };
    
    // Add the new employer to the existing employers array
    const updatedEmployers = [...employers, newEmployer];
    
    // Update local state for immediate response
    setEmployers(updatedEmployers);
    
    // Update the parent component
    onChange({
      target: {
        name: 'employers',
        value: updatedEmployers
      }
    });
  };
  
  // Remove an employer
  const removeEmployer = (index) => {
    // Create a copy and remove the employer at the specified index
    const updatedEmployers = [...employers];
    updatedEmployers.splice(index, 1);
    
    // Update local state for immediate response
    setEmployers(updatedEmployers);
    
    // Update the parent component
    onChange({
      target: {
        name: 'employers',
        value: updatedEmployers
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Where does asad work?</h2>
        <p className="text-gray-600 mb-4">
          Tell us a little more about asad and what they do for a living.
        </p>
        <hr className="border-t border-gray-300 mb-6" />
      </div>

      {borrower?.employers && borrower?.employers?.map((employer, index) => (
        <div key={index} className="mb-8 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Employer {index + 1}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={employer.companyName || ''}
                onChange={(e) => handleEmployerChange(index, 'companyName', e.target.value)}
                className={`text-xs w-full border ${errors[`employers[${index}].companyName`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
              {errors[`employers[${index}].companyName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`employers[${index}].companyName`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Company Phone
              </label>
              <input
                type="tel"
                value={employer.companyPhone || ''}
                onChange={(e) => handleEmployerChange(index, 'companyPhone', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={employer.jobTitle || ''}
                onChange={(e) => handleEmployerChange(index, 'jobTitle', e.target.value)}
                className={`text-xs w-full border ${errors[`employers[${index}].jobTitle`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
              {errors[`employers[${index}].jobTitle`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`employers[${index}].jobTitle`]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Employment Status
              </label>
              <div className="relative">
                <select
                  value={employer.employmentStatus || ''}
                  onChange={(e) => handleEmployerChange(index, 'employmentStatus', e.target.value)}
                  className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
                >
                  <option value="">Select</option>
                  <option value="currentEmployer">Current Employer</option>
                  <option value="pastEmployer">Past Employer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {errors[`employers[${index}].employmentStatus`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`employers[${index}].employmentStatus`]}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Are/Were You Self Employed?
              </label>
              <div className="relative">
                <select
                  value={employer.isSelfEmployed || ''}
                  onChange={(e) => handleEmployerChange(index, 'isSelfEmployed', e.target.value)}
                  className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {employer.isSelfEmployed === 'yes' && (
              <div>
                <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                  Do/Did You Own 25% Or More Of The Company?
                </label>
                <div className="relative">
                  <select
                    value={employer.ownsMoreThan25Percent || ''}
                    onChange={(e) => handleEmployerChange(index, 'ownsMoreThan25Percent', e.target.value)}
                    className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ '--focus-ring-color': theme.colors.primary }}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="text"
                value={employer.startDate || ''}
                onChange={(e) => handleEmployerChange(index, 'startDate', e.target.value)}
                placeholder="mm/dd/yyyy"
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Years in Profession
              </label>
              <input
                type="number"
                min="0"
                value={employer.yearsInProfession || ''}
                onChange={(e) => handleEmployerChange(index, 'yearsInProfession', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Months in Profession
              </label>
              <input
                type="number"
                min="0"
                max="11"
                value={employer.monthsInProfession || ''}
                onChange={(e) => handleEmployerChange(index, 'monthsInProfession', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Employer Address</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={employer.streetAddress || ''}
                onChange={(e) => handleEmployerChange(index, 'streetAddress', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Apt/Ste #
              </label>
              <input
                type="text"
                value={employer.aptSteNum || ''}
                onChange={(e) => handleEmployerChange(index, 'aptSteNum', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                City
              </label>
              <input
                type="text"
                value={employer.city || ''}
                onChange={(e) => handleEmployerChange(index, 'city', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                State
              </label>
              <div className="relative">
                <select
                  value={employer.state || ''}
                  onChange={(e) => handleEmployerChange(index, 'state', e.target.value)}
                  className="text-xs appearance-none w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--focus-ring-color': theme.colors.primary }}
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
            </div>
            
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                value={employer.zipCode || ''}
                onChange={(e) => handleEmployerChange(index, 'zipCode', e.target.value)}
                className="text-xs w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': theme.colors.primary }}
              />
            </div>
          </div>
          
          {borrower.employers.length > 1 && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => removeEmployer(index)}
                className="text-xs inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--focus-ring-color': 'rgb(220, 38, 38)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Remove Employer
              </button>
            </div>
          )}
        </div>
      ))}
      
      <div>
        <button
          type="button"
          onClick={addEmployer}
          style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',  // Reduced padding
                      borderWidth: '1px',
                      borderColor: theme.colors.primary,
                      borderRadius: '0.25rem',  // Slightly smaller border radius
                      fontSize: '0.75rem',  // Smaller font size
                      lineHeight: '1rem',  // Tighter line height
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
          Add Employer
        </button>
      </div>
    </div>
  );
};

export default EmploymentHistory;
