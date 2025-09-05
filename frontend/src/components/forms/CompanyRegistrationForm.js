import React from 'react';

const CompanyRegistrationForm = ({ formData, errors, handleChange, currentRole }) => {
  return (
    <div className="space-y-6 transition-all duration-300 ease-in-out">
      {/* Company Information Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <div className="mt-1">
              <input
                id="companyName"
                name="companyName"
                type="text"
                required={currentRole === 'company'}
                value={formData.companyName}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Acme Lending"
              />
            </div>
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label htmlFor="maxLenders" className="block text-sm font-medium text-gray-700">
              Max Lenders
            </label>
            <div className="mt-1">
              <input
                id="maxLenders"
                name="maxLenders"
                type="number"
                min="1"
                max="100"
                required={currentRole === 'company'}
                value={formData.maxLenders}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.maxLenders ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="10"
              />
            </div>
            {errors.maxLenders && (
              <p className="mt-1 text-sm text-red-600">{errors.maxLenders}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
              Company Email
            </label>
            <div className="mt-1">
              <input
                id="companyEmail"
                name="companyEmail"
                type="email"
                required={currentRole === 'company'}
                value={formData.companyEmail}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.companyEmail ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="ops@acme.io"
              />
            </div>
            {errors.companyEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.companyEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
              Company Phone
            </label>
            <div className="mt-1">
              <input
                id="companyPhone"
                name="companyPhone"
                type="tel"
                value={formData.companyPhone}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.companyPhone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="+1-555-000-1111"
              />
            </div>
            {errors.companyPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.companyPhone}</p>
            )}
          </div>
        </div>

      </div>

      {/* Primary Contact Information Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryContactFirstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <div className="mt-1">
              <input
                id="primaryContactFirstName"
                name="primaryContactFirstName"
                type="text"
                required={currentRole === 'company'}
                value={formData.primaryContactFirstName}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactFirstName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Alice"
              />
            </div>
            {errors.primaryContactFirstName && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactFirstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="primaryContactLastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <div className="mt-1">
              <input
                id="primaryContactLastName"
                name="primaryContactLastName"
                type="text"
                required={currentRole === 'company'}
                value={formData.primaryContactLastName}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactLastName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Baker"
              />
            </div>
            {errors.primaryContactLastName && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactLastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                id="primaryContactEmail"
                name="primaryContactEmail"
                type="email"
                required={currentRole === 'company'}
                value={formData.primaryContactEmail}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactEmail ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="alice@acme.io"
              />
            </div>
            {errors.primaryContactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <div className="mt-1">
              <input
                id="primaryContactPhone"
                name="primaryContactPhone"
                type="tel"
                value={formData.primaryContactPhone}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactPhone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="+1-555-111-2222"
              />
            </div>
            {errors.primaryContactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactPhone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="primaryContactPassword" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="primaryContactPassword"
                name="primaryContactPassword"
                type="password"
                required={currentRole === 'company'}
                value={formData.primaryContactPassword}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="••••••••"
              />
            </div>
            {errors.primaryContactPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="primaryContactConfirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1">
              <input
                id="primaryContactConfirmPassword"
                name="primaryContactConfirmPassword"
                type="password"
                required={currentRole === 'company'}
                value={formData.primaryContactConfirmPassword}
                onChange={handleChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.primaryContactConfirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="••••••••"
              />
            </div>
            {errors.primaryContactConfirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryContactConfirmPassword}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistrationForm;
