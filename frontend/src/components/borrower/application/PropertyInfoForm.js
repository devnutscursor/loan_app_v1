import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Property Information Form Component
 * 
 * Collects information about the property being purchased
 * or refinanced as part of the loan application.
 */
const PropertyInfoForm = ({
  formData,
  errors,
  handleChange,
  handleBlur,
  isSubmitting
}) => {
  // Track loan purpose for conditional fields
  const [loanPurpose, setLoanPurpose] = useState(formData.loanPurpose || '');
  
  // Track property type for conditional fields
  const [propertyType, setPropertyType] = useState(formData.propertyType || '');
  
  useEffect(() => {
    if (formData.loanPurpose) {
      setLoanPurpose(formData.loanPurpose);
    }
    if (formData.propertyType) {
      setPropertyType(formData.propertyType);
    }
  }, [formData.loanPurpose, formData.propertyType]);

  // Handle loan purpose change
  const handleLoanPurposeChange = (e) => {
    handleChange(e);
    setLoanPurpose(e.target.value);
  };

  // Handle property type change
  const handlePropertyTypeChange = (e) => {
    handleChange(e);
    setPropertyType(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please provide details about the property you want to {loanPurpose === 'purchase' ? 'purchase' : 'refinance'}.
        </p>
      </div>

      {/* Loan Purpose Section */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Loan Purpose */}
        <div className="sm:col-span-3">
          <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700">
            Loan Purpose
          </label>
          <div className="mt-1">
            <select
              id="loanPurpose"
              name="loanPurpose"
              value={formData.loanPurpose || ''}
              onChange={handleLoanPurposeChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.loanPurpose ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select Purpose</option>
              <option value="purchase">Purchase a Home</option>
              <option value="refinance">Refinance Existing Mortgage</option>
              <option value="cashout">Cash-Out Refinance</option>
              <option value="homeEquity">Home Equity Loan</option>
            </select>
            {errors.loanPurpose && (
              <p className="mt-1 text-sm text-red-600">
                {errors.loanPurpose}
              </p>
            )}
          </div>
        </div>

        {/* Loan Amount */}
        <div className="sm:col-span-3">
          <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
            Requested Loan Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              id="loanAmount"
              name="loanAmount"
              value={formData.loanAmount || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="0.00"
              className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                errors.loanAmount ? 'border-red-300' : ''
              }`}
            />
            {errors.loanAmount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.loanAmount}
              </p>
            )}
          </div>
        </div>
        
        {/* Down Payment (only for purchase) */}
        {loanPurpose === 'purchase' && (
          <div className="sm:col-span-3">
            <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700">
              Down Payment Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="downPayment"
                name="downPayment"
                value={formData.downPayment || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.downPayment ? 'border-red-300' : ''
                }`}
              />
              {errors.downPayment && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.downPayment}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Down Payment Source (only for purchase) */}
        {loanPurpose === 'purchase' && formData.downPayment && (
          <div className="sm:col-span-3">
            <label htmlFor="downPaymentSource" className="block text-sm font-medium text-gray-700">
              Source of Down Payment
            </label>
            <div className="mt-1">
              <select
                id="downPaymentSource"
                name="downPaymentSource"
                value={formData.downPaymentSource || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                  errors.downPaymentSource ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Source</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment/Stock Sale</option>
                <option value="gift">Family Gift</option>
                <option value="sale">Sale of Current Home</option>
                <option value="loan">Loan From Family/Friend</option>
                <option value="retirement">Retirement Account</option>
                <option value="other">Other</option>
              </select>
              {errors.downPaymentSource && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.downPaymentSource}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Current Property Value (only for refinance) */}
        {['refinance', 'cashout', 'homeEquity'].includes(loanPurpose) && (
          <div className="sm:col-span-3">
            <label htmlFor="propertyValue" className="block text-sm font-medium text-gray-700">
              Estimated Property Value
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="propertyValue"
                name="propertyValue"
                value={formData.propertyValue || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.propertyValue ? 'border-red-300' : ''
                }`}
              />
              {errors.propertyValue && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.propertyValue}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Current Mortgage Balance (only for refinance) */}
        {['refinance', 'cashout', 'homeEquity'].includes(loanPurpose) && (
          <div className="sm:col-span-3">
            <label htmlFor="currentMortgageBalance" className="block text-sm font-medium text-gray-700">
              Current Mortgage Balance
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="currentMortgageBalance"
                name="currentMortgageBalance"
                value={formData.currentMortgageBalance || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.currentMortgageBalance ? 'border-red-300' : ''
                }`}
              />
              {errors.currentMortgageBalance && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentMortgageBalance}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Property Details Section */}
      {loanPurpose && (
        <div className="bg-white rounded-md p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Property Type */}
            <div className="sm:col-span-3">
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                Property Type
              </label>
              <div className="mt-1">
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType || ''}
                  onChange={handlePropertyTypeChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.propertyType ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="singleFamily">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multiFamily">Multi-Family (2-4 units)</option>
                  <option value="manufactured">Manufactured Home</option>
                </select>
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.propertyType}
                  </p>
                )}
              </div>
            </div>

            {/* Property Usage */}
            <div className="sm:col-span-3">
              <label htmlFor="propertyUsage" className="block text-sm font-medium text-gray-700">
                Property Usage
              </label>
              <div className="mt-1">
                <select
                  id="propertyUsage"
                  name="propertyUsage"
                  value={formData.propertyUsage || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.propertyUsage ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select Usage</option>
                  <option value="primaryResidence">Primary Residence</option>
                  <option value="secondHome">Second Home/Vacation</option>
                  <option value="investment">Investment Property</option>
                </select>
                {errors.propertyUsage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.propertyUsage}
                  </p>
                )}
              </div>
            </div>

            {/* Property Address */}
            {loanPurpose === 'purchase' && (
              <>
                <div className="sm:col-span-6">
                  <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700">
                    Property Street Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="propertyAddress"
                      name="propertyAddress"
                      value={formData.propertyAddress || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.propertyAddress ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.propertyAddress && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.propertyAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="propertyCity" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="propertyCity"
                      name="propertyCity"
                      value={formData.propertyCity || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.propertyCity ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.propertyCity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.propertyCity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="propertyState" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <div className="mt-1">
                    <select
                      id="propertyState"
                      name="propertyState"
                      value={formData.propertyState || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.propertyState ? 'border-red-300' : ''
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
                    {errors.propertyState && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.propertyState}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="propertyZipCode" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="propertyZipCode"
                      name="propertyZipCode"
                      value={formData.propertyZipCode || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      maxLength={5}
                      className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.propertyZipCode ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.propertyZipCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.propertyZipCode}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Number of Units (only for multi-family) */}
            {propertyType === 'multiFamily' && (
              <div className="sm:col-span-3">
                <label htmlFor="numberOfUnits" className="block text-sm font-medium text-gray-700">
                  Number of Units
                </label>
                <div className="mt-1">
                  <select
                    id="numberOfUnits"
                    name="numberOfUnits"
                    value={formData.numberOfUnits || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.numberOfUnits ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select</option>
                    <option value="2">2 Units</option>
                    <option value="3">3 Units</option>
                    <option value="4">4 Units</option>
                  </select>
                  {errors.numberOfUnits && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.numberOfUnits}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* HOA Status (For condo and townhouse) */}
            {['condo', 'townhouse'].includes(propertyType) && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="hasHOA" className="block text-sm font-medium text-gray-700">
                    Is there a Homeowners Association (HOA)?
                  </label>
                  <div className="mt-1">
                    <select
                      id="hasHOA"
                      name="hasHOA"
                      value={formData.hasHOA || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.hasHOA ? 'border-red-300' : ''
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {errors.hasHOA && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.hasHOA}
                      </p>
                    )}
                  </div>
                </div>

                {formData.hasHOA === 'yes' && (
                  <div className="sm:col-span-3">
                    <label htmlFor="hoaFees" className="block text-sm font-medium text-gray-700">
                      Monthly HOA Fees
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        id="hoaFees"
                        name="hoaFees"
                        value={formData.hoaFees || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        placeholder="0.00"
                        className={`shadow-sm focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                          errors.hoaFees ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.hoaFees && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.hoaFees}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Property Value Notice (for Purchases) */}
      {loanPurpose === 'purchase' && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                If the property hasn't been identified yet, you can provide estimated values. You'll be able to update this information later in the process.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refinance Info (for Refinances) */}
      {['refinance', 'cashout'].includes(loanPurpose) && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                For refinance applications, we'll need recent mortgage statements and property tax information. You'll be prompted to upload these documents later in the application process.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PropertyInfoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default PropertyInfoForm;
