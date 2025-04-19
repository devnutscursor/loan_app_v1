import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Address Information Form
 * Collects current and previous address details from the borrower
 */
const AddressInfoForm = ({
  formData,
  errors,
  handleChange,
  handleBlur,
  isSubmitting
}) => {
  const [showPreviousAddress, setShowPreviousAddress] = useState(
    formData.yearsAtCurrentAddress < 2
  );

  // Update previous address visibility when years change
  const handleYearsChange = (e) => {
    handleChange(e);
    setShowPreviousAddress(Number(e.target.value) < 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Address Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please provide your current residence information and address history.
        </p>
      </div>

      {/* Current Address Section */}
      <div className="bg-white rounded-md p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Address</h3>
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Street Address */}
          <div className="sm:col-span-6">
            <label htmlFor="currentStreetAddress" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="currentStreetAddress"
                name="currentStreetAddress"
                value={formData.currentStreetAddress || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.currentStreetAddress ? 'border-red-300' : ''
                }`}
              />
              {errors.currentStreetAddress && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentStreetAddress}
                </p>
              )}
            </div>
          </div>

          {/* City */}
          <div className="sm:col-span-2">
            <label htmlFor="currentCity" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="currentCity"
                name="currentCity"
                value={formData.currentCity || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.currentCity ? 'border-red-300' : ''
                }`}
              />
              {errors.currentCity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentCity}
                </p>
              )}
            </div>
          </div>

          {/* State */}
          <div className="sm:col-span-2">
            <label htmlFor="currentState" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <div className="mt-1">
              <select
                id="currentState"
                name="currentState"
                value={formData.currentState || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.currentState ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                {/* Add other states as needed */}
              </select>
              {errors.currentState && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentState}
                </p>
              )}
            </div>
          </div>

          {/* ZIP Code */}
          <div className="sm:col-span-2">
            <label htmlFor="currentZipCode" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="currentZipCode"
                name="currentZipCode"
                value={formData.currentZipCode || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.currentZipCode ? 'border-red-300' : ''
                }`}
                maxLength={5}
              />
              {errors.currentZipCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentZipCode}
                </p>
              )}
            </div>
          </div>

          {/* Housing Status */}
          <div className="sm:col-span-3">
            <label htmlFor="housingStatus" className="block text-sm font-medium text-gray-700">
              Housing Status
            </label>
            <div className="mt-1">
              <select
                id="housingStatus"
                name="housingStatus"
                value={formData.housingStatus || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.housingStatus ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Status</option>
                <option value="rent">Rent</option>
                <option value="own">Own</option>
                <option value="livingWithFamily">Living with family</option>
                <option value="other">Other</option>
              </select>
              {errors.housingStatus && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.housingStatus}
                </p>
              )}
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="sm:col-span-3">
            <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700">
              Monthly Payment
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="monthlyPayment"
                name="monthlyPayment"
                value={formData.monthlyPayment || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.monthlyPayment ? 'border-red-300' : ''
                }`}
              />
              {errors.monthlyPayment && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.monthlyPayment}
                </p>
              )}
            </div>
          </div>

          {/* Years at Current Address */}
          <div className="sm:col-span-3">
            <label htmlFor="yearsAtCurrentAddress" className="block text-sm font-medium text-gray-700">
              Years at Current Address
            </label>
            <div className="mt-1">
              <select
                id="yearsAtCurrentAddress"
                name="yearsAtCurrentAddress"
                value={formData.yearsAtCurrentAddress || ''}
                onChange={handleYearsChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.yearsAtCurrentAddress ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Years</option>
                <option value="0">Less than 1 year</option>
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="4">4 years</option>
                <option value="5">5+ years</option>
              </select>
              {errors.yearsAtCurrentAddress && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.yearsAtCurrentAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous Address Section (conditionally rendered) */}
      {showPreviousAddress && (
        <div className="bg-white rounded-md p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Address</h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Street Address */}
            <div className="sm:col-span-6">
              <label htmlFor="previousStreetAddress" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="previousStreetAddress"
                  name="previousStreetAddress"
                  value={formData.previousStreetAddress || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousStreetAddress ? 'border-red-300' : ''
                  }`}
                />
                {errors.previousStreetAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousStreetAddress}
                  </p>
                )}
              </div>
            </div>

            {/* City */}
            <div className="sm:col-span-2">
              <label htmlFor="previousCity" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="previousCity"
                  name="previousCity"
                  value={formData.previousCity || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousCity ? 'border-red-300' : ''
                  }`}
                />
                {errors.previousCity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousCity}
                  </p>
                )}
              </div>
            </div>

            {/* State */}
            <div className="sm:col-span-2">
              <label htmlFor="previousState" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <div className="mt-1">
                <select
                  id="previousState"
                  name="previousState"
                  value={formData.previousState || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousState ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select State</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  {/* Add other states as needed */}
                </select>
                {errors.previousState && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousState}
                  </p>
                )}
              </div>
            </div>

            {/* ZIP Code */}
            <div className="sm:col-span-2">
              <label htmlFor="previousZipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="previousZipCode"
                  name="previousZipCode"
                  value={formData.previousZipCode || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousZipCode ? 'border-red-300' : ''
                  }`}
                  maxLength={5}
                />
                {errors.previousZipCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousZipCode}
                  </p>
                )}
              </div>
            </div>

            {/* Years at Previous Address */}
            <div className="sm:col-span-3">
              <label htmlFor="yearsAtPreviousAddress" className="block text-sm font-medium text-gray-700">
                Years at Previous Address
              </label>
              <div className="mt-1">
                <select
                  id="yearsAtPreviousAddress"
                  name="yearsAtPreviousAddress"
                  value={formData.yearsAtPreviousAddress || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.yearsAtPreviousAddress ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select Years</option>
                  <option value="0">Less than 1 year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5">5+ years</option>
                </select>
                {errors.yearsAtPreviousAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.yearsAtPreviousAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              For mortgage applications, we require at least 2 years of address history. If you've lived at your current address for less than 2 years, please provide your previous address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

AddressInfoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default AddressInfoForm;
