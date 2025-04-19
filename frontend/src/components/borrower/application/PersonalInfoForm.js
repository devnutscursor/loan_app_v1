import React from 'react';
import PropTypes from 'prop-types';
import { formatPhoneNumber } from '../../../utils/formatters';

/**
 * Personal Information Form Component
 * 
 * First step in the loan application process that collects
 * borrower's personal information.
 */
const PersonalInfoForm = ({
  formData,
  errors,
  handleChange,
  handleBlur,
  isSubmitting
}) => {
  // Format phone number as user types
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    handleChange({ target: { name, value: formattedValue } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please provide your personal details as they appear on legal documents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* First Name */}
        <div className="sm:col-span-3">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.firstName ? 'border-red-300' : ''
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600" id="firstName-error">
                {errors.firstName}
              </p>
            )}
          </div>
        </div>

        {/* Last Name */}
        <div className="sm:col-span-3">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.lastName ? 'border-red-300' : ''
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600" id="lastName-error">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="sm:col-span-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              autoComplete="email"
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.email ? 'border-red-300' : ''
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" id="email-error">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="sm:col-span-3">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="mt-1">
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handlePhoneChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              autoComplete="tel"
              placeholder="(555) 555-5555"
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.phoneNumber ? 'border-red-300' : ''
              }`}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600" id="phoneNumber-error">
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="sm:col-span-3">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <div className="mt-1">
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.dateOfBirth ? 'border-red-300' : ''
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600" id="dateOfBirth-error">
                {errors.dateOfBirth}
              </p>
            )}
          </div>
        </div>

        {/* Social Security Number */}
        <div className="sm:col-span-3">
          <label htmlFor="ssn" className="block text-sm font-medium text-gray-700">
            Social Security Number
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="ssn"
              name="ssn"
              value={formData.ssn || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="XXX-XX-XXXX"
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.ssn ? 'border-red-300' : ''
              }`}
            />
            {errors.ssn && (
              <p className="mt-1 text-sm text-red-600" id="ssn-error">
                {errors.ssn}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your SSN is securely encrypted and only used for verification purposes.
          </p>
        </div>

        {/* Marital Status */}
        <div className="sm:col-span-3">
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status
          </label>
          <div className="mt-1">
            <select
              id="maritalStatus"
              name="maritalStatus"
              value={formData.maritalStatus || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.maritalStatus ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
            {errors.maritalStatus && (
              <p className="mt-1 text-sm text-red-600" id="maritalStatus-error">
                {errors.maritalStatus}
              </p>
            )}
          </div>
        </div>

        {/* Citizenship Status */}
        <div className="sm:col-span-3">
          <label htmlFor="citizenshipStatus" className="block text-sm font-medium text-gray-700">
            Citizenship Status
          </label>
          <div className="mt-1">
            <select
              id="citizenshipStatus"
              name="citizenshipStatus"
              value={formData.citizenshipStatus || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.citizenshipStatus ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select...</option>
              <option value="usCitizen">U.S. Citizen</option>
              <option value="permanentResident">Permanent Resident Alien</option>
              <option value="nonPermanentResident">Non-Permanent Resident Alien</option>
            </select>
            {errors.citizenshipStatus && (
              <p className="mt-1 text-sm text-red-600" id="citizenshipStatus-error">
                {errors.citizenshipStatus}
              </p>
            )}
          </div>
        </div>

        {/* Co-Borrower Question */}
        <div className="sm:col-span-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Are you applying with a co-borrower?</legend>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <input
                  id="coBorrowerYes"
                  name="hasCoBorrower"
                  type="radio"
                  value="yes"
                  checked={formData.hasCoBorrower === 'yes'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                />
                <label htmlFor="coBorrowerYes" className="ml-3 block text-sm font-medium text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="coBorrowerNo"
                  name="hasCoBorrower"
                  type="radio"
                  value="no"
                  checked={formData.hasCoBorrower === 'no'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                />
                <label htmlFor="coBorrowerNo" className="ml-3 block text-sm font-medium text-gray-700">
                  No
                </label>
              </div>
            </div>
            {errors.hasCoBorrower && (
              <p className="mt-1 text-sm text-red-600" id="hasCoBorrower-error">
                {errors.hasCoBorrower}
              </p>
            )}
          </fieldset>
        </div>
      </div>
      
      {/* Data Privacy Notice */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-gray-700">
              Your information is protected by our <a href="/privacy-policy" className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</a> and will only be used for processing your loan application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

PersonalInfoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default PersonalInfoForm;
