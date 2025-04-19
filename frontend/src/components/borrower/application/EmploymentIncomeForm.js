import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Employment and Income Form Component
 * 
 * Collects borrower employment history and income information
 * for loan qualification assessment.
 */
const EmploymentIncomeForm = ({
  formData,
  errors,
  handleChange,
  handleBlur,
  isSubmitting
}) => {
  // State to track employment type and history requirements
  const [showPreviousEmployment, setShowPreviousEmployment] = useState(
    formData.yearsAtCurrentEmployment < 2
  );

  // Track self-employment status for conditional fields
  const [isSelfEmployed, setIsSelfEmployed] = useState(
    formData.employmentType === 'selfEmployed'
  );

  // Handle employment duration change
  const handleEmploymentDurationChange = (e) => {
    handleChange(e);
    if (e.target.name === 'yearsAtCurrentEmployment') {
      setShowPreviousEmployment(Number(e.target.value) < 2);
    }
  };

  // Handle employment type change
  const handleEmploymentTypeChange = (e) => {
    handleChange(e);
    if (e.target.name === 'employmentType') {
      setIsSelfEmployed(e.target.value === 'selfEmployed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Employment and Income</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please provide your employment history and income details. For mortgage applications, 
          we typically require at least 2 years of employment history.
        </p>
      </div>

      {/* Current Employment Section */}
      <div className="bg-white rounded-md p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Employment</h3>
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Employment Type */}
          <div className="sm:col-span-3">
            <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
              Employment Type
            </label>
            <div className="mt-1">
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType || ''}
                onChange={handleEmploymentTypeChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.employmentType ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Employment Type</option>
                <option value="fullTime">Full-Time</option>
                <option value="partTime">Part-Time</option>
                <option value="selfEmployed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
              {errors.employmentType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.employmentType}
                </p>
              )}
            </div>
          </div>

          {/* Employer Name (not shown if unemployed/retired) */}
          {formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
            <div className="sm:col-span-3">
              <label htmlFor="employerName" className="block text-sm font-medium text-gray-700">
                {isSelfEmployed ? 'Business Name' : 'Employer Name'}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="employerName"
                  name="employerName"
                  value={formData.employerName || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.employerName ? 'border-red-300' : ''
                  }`}
                />
                {errors.employerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.employerName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Position/Job Title */}
          {formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
            <div className="sm:col-span-3">
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                Position/Job Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.jobTitle ? 'border-red-300' : ''
                  }`}
                />
                {errors.jobTitle && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.jobTitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Years at Current Employment */}
          {formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
            <div className="sm:col-span-3">
              <label htmlFor="yearsAtCurrentEmployment" className="block text-sm font-medium text-gray-700">
                Years at Current {isSelfEmployed ? 'Business' : 'Employer'}
              </label>
              <div className="mt-1">
                <select
                  id="yearsAtCurrentEmployment"
                  name="yearsAtCurrentEmployment"
                  value={formData.yearsAtCurrentEmployment || ''}
                  onChange={handleEmploymentDurationChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.yearsAtCurrentEmployment ? 'border-red-300' : ''
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
                {errors.yearsAtCurrentEmployment && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.yearsAtCurrentEmployment}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Employer Phone (not shown if unemployed/retired) */}
          {formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
            <div className="sm:col-span-3">
              <label htmlFor="employerPhone" className="block text-sm font-medium text-gray-700">
                {isSelfEmployed ? 'Business Phone' : 'Employer Phone'}
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  id="employerPhone"
                  name="employerPhone"
                  value={formData.employerPhone || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="(555) 555-5555"
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.employerPhone ? 'border-red-300' : ''
                  }`}
                />
                {errors.employerPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.employerPhone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Employer Address */}
          {formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
            <div className="sm:col-span-6">
              <label htmlFor="employerAddress" className="block text-sm font-medium text-gray-700">
                {isSelfEmployed ? 'Business Address' : 'Employer Address'}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="employerAddress"
                  name="employerAddress"
                  value={formData.employerAddress || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.employerAddress ? 'border-red-300' : ''
                  }`}
                />
                {errors.employerAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.employerAddress}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Income Information Section */}
          <div className="sm:col-span-6 pt-2">
            <h4 className="text-md font-medium text-gray-900 mb-3">Income Information</h4>
          </div>

          {/* Monthly Income */}
          <div className="sm:col-span-3">
            <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
              Monthly Income (before taxes)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="monthlyIncome"
                name="monthlyIncome"
                value={formData.monthlyIncome || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.monthlyIncome ? 'border-red-300' : ''
                }`}
              />
              {errors.monthlyIncome && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.monthlyIncome}
                </p>
              )}
            </div>
          </div>

          {/* Additional Income */}
          <div className="sm:col-span-3">
            <label htmlFor="additionalIncome" className="block text-sm font-medium text-gray-700">
              Additional Monthly Income (optional)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="additionalIncome"
                name="additionalIncome"
                value={formData.additionalIncome || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className="shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Include alimony, child support, investment income, etc.
            </p>
          </div>

          {/* Additional Income Source (if additional income provided) */}
          {formData.additionalIncome && Number(formData.additionalIncome) > 0 && (
            <div className="sm:col-span-3">
              <label htmlFor="additionalIncomeSource" className="block text-sm font-medium text-gray-700">
                Source of Additional Income
              </label>
              <div className="mt-1">
                <select
                  id="additionalIncomeSource"
                  name="additionalIncomeSource"
                  value={formData.additionalIncomeSource || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.additionalIncomeSource ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select Source</option>
                  <option value="partTimeJob">Part-Time Job</option>
                  <option value="alimony">Alimony</option>
                  <option value="childSupport">Child Support</option>
                  <option value="rental">Rental Income</option>
                  <option value="investment">Investment Income</option>
                  <option value="other">Other</option>
                </select>
                {errors.additionalIncomeSource && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.additionalIncomeSource}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previous Employment Section (conditionally rendered) */}
      {showPreviousEmployment && formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType) && (
        <div className="bg-white rounded-md p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Employment</h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Previous Employer Name */}
            <div className="sm:col-span-3">
              <label htmlFor="previousEmployerName" className="block text-sm font-medium text-gray-700">
                Previous Employer Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="previousEmployerName"
                  name="previousEmployerName"
                  value={formData.previousEmployerName || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousEmployerName ? 'border-red-300' : ''
                  }`}
                />
                {errors.previousEmployerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousEmployerName}
                  </p>
                )}
              </div>
            </div>

            {/* Previous Job Title */}
            <div className="sm:col-span-3">
              <label htmlFor="previousJobTitle" className="block text-sm font-medium text-gray-700">
                Previous Job Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="previousJobTitle"
                  name="previousJobTitle"
                  value={formData.previousJobTitle || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.previousJobTitle ? 'border-red-300' : ''
                  }`}
                />
                {errors.previousJobTitle && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousJobTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Years at Previous Employment */}
            <div className="sm:col-span-3">
              <label htmlFor="yearsAtPreviousEmployment" className="block text-sm font-medium text-gray-700">
                Years at Previous Employer
              </label>
              <div className="mt-1">
                <select
                  id="yearsAtPreviousEmployment"
                  name="yearsAtPreviousEmployment"
                  value={formData.yearsAtPreviousEmployment || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.yearsAtPreviousEmployment ? 'border-red-300' : ''
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
                {errors.yearsAtPreviousEmployment && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.yearsAtPreviousEmployment}
                  </p>
                )}
              </div>
            </div>

            {/* Previous Monthly Income */}
            <div className="sm:col-span-3">
              <label htmlFor="previousMonthlyIncome" className="block text-sm font-medium text-gray-700">
                Previous Monthly Income
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="previousMonthlyIncome"
                  name="previousMonthlyIncome"
                  value={formData.previousMonthlyIncome || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                    errors.previousMonthlyIncome ? 'border-red-300' : ''
                  }`}
                />
                {errors.previousMonthlyIncome && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousMonthlyIncome}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self Employment Additional Info Section */}
      {isSelfEmployed && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Self-Employment Documentation</h3>
              <p className="mt-2 text-sm text-yellow-700">
                For self-employed applicants, additional documentation will be required:
              </p>
              <ul className="mt-1 pl-5 list-disc text-sm text-yellow-700">
                <li>Last 2 years of personal tax returns</li>
                <li>Last 2 years of business tax returns</li>
                <li>Year-to-date profit & loss statement</li>
                <li>Business license or equivalent</li>
              </ul>
              <p className="mt-2 text-sm text-yellow-700">
                You'll be prompted to upload these documents later in the application process.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

EmploymentIncomeForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default EmploymentIncomeForm;
