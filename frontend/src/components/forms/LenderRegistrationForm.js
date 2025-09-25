import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LenderRegistrationForm = ({ formData, errors, handleChange, currentRole }) => {
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [step, setStep] = useState(1);


  useEffect(() => {
      fetchCompanies();

  }, []);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/companies`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center space-x-6">
      {[1,2].map((s) => (
        <div key={s} className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step===s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{s}</div>
          <span className="text-sm text-gray-700">{s===1? 'Basic Info' : 'Contact Info'}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 transition-all duration-300 ease-in-out">
      <Stepper />

      {step === 1 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required={currentRole === 'lender'}
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="John"
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                Middle Name (optional)
              </label>
              <div className="mt-1">
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  value={formData.middleName || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.middleName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="A."
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required={currentRole === 'lender'}
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Doe"
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="nmls" className="block text-sm font-medium text-gray-700">
                NMLS ID #
              </label>
              <div className="mt-1">
                <input
                  id="nmls"
                  name="nmls"
                  type="text"
                  value={formData.nmls || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.nmls ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="123456"
                  required={true}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-md bg-blue-600 text-white">
              Next
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="officePhone" className="block text-sm font-medium text-gray-700">
                Office Phone
              </label>
              <div className="mt-1">
                <input
                  id="officePhone"
                  name="officePhone"
                  type="tel"
                  value={formData.officePhone || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.officePhone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="(123) 456-7890"
                />
              </div>
              {errors.officePhone && (
                <p className="mt-1 text-sm text-red-600">{errors.officePhone}</p>
              )}
            </div>

            <div>
              <label htmlFor="officePhoneExt" className="block text-sm font-medium text-gray-700">
                Ext
              </label>
              <div className="mt-1">
                <input
                  id="officePhoneExt"
                  name="officePhoneExt"
                  type="text"
                  value={formData.officePhoneExt || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.officePhoneExt ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700">
                Mobile Phone
              </label>
              <div className="mt-1">
                <input
                  id="mobilePhone"
                  name="mobilePhone"
                  type="tel"
                  value={formData.mobilePhone || formData.phone || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.mobilePhone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="clientFacingTitle" className="block text-sm font-medium text-gray-700">
              Client-Facing Title
            </label>
            <div className="mt-1">
              <input
                id="clientFacingTitle"
                name="clientFacingTitle"
                type="text"
                value={formData.clientFacingTitle || ''}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.clientFacingTitle ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Senior Loan Officer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="mt-1">
                <select
                  id="companyId"
                  name="companyId"
                  required={currentRole === 'lender'}
                  value={formData.companyId}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.companyId ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                >
                  <option value="">Select a company</option>
                  {loadingCompanies ? (
                    <option disabled>Loading companies...</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required={currentRole === 'lender'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required={currentRole === 'lender'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800">
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LenderRegistrationForm;
