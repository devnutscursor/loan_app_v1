import React from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/LoanCalculationUtils';

/**
 * Component for loan details section with input fields
 */
const LoanDetailsSection = ({
  localParams,
  toggleStates,
  handleInputChange,
  handleToggleChange
}) => {
  console.log("[DEBUG] Local parameters:", localParams);
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>

      {/* Purchase Price / Loan Amount */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Purchase Price (Loan Amount: {formatCurrency(localParams.loanAmount * (1 - (localParams.downPaymentPercent / 100)))})
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="loanAmount"
            value={localParams.loanAmount}
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
          />
        </div>
      </div>

      {/* Down Payment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Down Payment
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="downPayment"
              value={localParams.downPayment}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3  pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
            <input
              type="number"
              name="downPaymentPercent"
              value={localParams.downPaymentPercent.toFixed(3)}
              onChange={handleInputChange}
              min={0}
              max={100}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
            />
          </div>
        </div>
      </div>

      {/* Rate Adjustment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate Adjustment
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
          <input
            type="number"
            name="rateAdjustment"
            value={localParams.rateAdjustment || 0}
            step="0.001"
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
          />
        </div>
      </div>

      {/* Interest Rate */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interest Rate <span className="text-xs text-blue-600">(Set by selected loan program)</span>
        </label>
        <div className="flex">
          {/* <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md h-10">
            %
          </span> */}
          <input
            type="number"
            name="interestRate"
            value={localParams.interestRate}
            disabled={true}
            className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-200 h-10 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">This value is automatically updated based on the selected loan program.</p>
      </div>

      {/* Loan Term */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loan Term
        </label>
        <div className="relative">
          <select
            name="loanTerm"
            value={localParams.loanTerm}
            readOnly
            disabled={true}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none cursor-not-allowed"
          >
            <option value="30">30 Years</option>
            <option value="20">20 Years</option>
            <option value="15">15 Years</option>
            <option value="10">10 Years</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Property Taxes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property Taxes
        </label>
        <div className="flex items-center">
          {/* % / $ toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('propertyTaxes', 'isPercent')}
              className={`px-3 w-12 ${toggleStates.propertyTaxes?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => {
                if (toggleStates.propertyTaxes?.isPercent) {
                  handleToggleChange('propertyTaxes', 'isPercent');
                }
              }}
              className={`px-3 w-12 ${!toggleStates.propertyTaxes?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              $
            </button>
          </div>
          {/* Input field */}
          <input
            type="number"
            name="propertyTaxes"
            value={localParams.propertyTaxes}
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-1"
          // style={{ width: '120px' }}
          />
          {/* /mo / /yr toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('propertyTaxes', 'isYearly')}
              className={`px-3 ${!toggleStates.propertyTaxes?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /mo
            </button>
            <button
              type="button"
              onClick={() => handleToggleChange('propertyTaxes', 'isYearly')}
              className={`px-3 ${toggleStates.propertyTaxes?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /yr
            </button>
          </div>
        </div>
      </div>

      {/* Homeowners Insurance */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Homeowners Insurance
        </label>
        <div className="flex items-center">
          {/* % / $ toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('homeownersInsurance', 'isPercent')}
              className={`px-3 w-12 ${toggleStates.homeownersInsurance?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => {
                if (toggleStates.homeownersInsurance?.isPercent) {
                  handleToggleChange('homeownersInsurance', 'isPercent');
                }
              }}
              className={`px-3 w-12 ${!toggleStates.homeownersInsurance?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              $
            </button>
          </div>
          {/* Input field */}
          <input
            type="number"
            name="homeownersInsurance"
            value={localParams.homeownersInsurance}
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-1"
          // style={{ width: '80px' }}
          />
          {/* /mo / /yr toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('homeownersInsurance', 'isYearly')}
              className={`px-3 ${!toggleStates.homeownersInsurance?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /mo
            </button>
            <button
              type="button"
              onClick={() => handleToggleChange('homeownersInsurance', 'isYearly')}
              className={`px-3 ${toggleStates.homeownersInsurance?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /yr
            </button>
          </div>
        </div>
      </div>

      {/* HOA Dues */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HOA Dues
        </label>
        <div className="flex items-center">
          {/* % / $ toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('hoaFees', 'isPercent')}
              className={`px-3 w-12 ${toggleStates.hoaFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => {
                if (toggleStates.hoaFees?.isPercent) {
                  handleToggleChange('hoaFees', 'isPercent');
                }
              }}
              className={`px-3 w-12 ${!toggleStates.hoaFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              $
            </button>
          </div>
          {/* Input field */}
          <input
            type="number"
            name="hoaFees"
            value={localParams.hoaFees}
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10 mx-1"
          // style={{ width: '80px' }}
          />
          {/* /mo / /yr toggle - styled to match the mortgage calculator */}
          <div className="inline-flex rounded-md overflow-hidden bg-blue-500 h-10">
            <button
              type="button"
              onClick={() => handleToggleChange('hoaFees', 'isYearly')}
              className={`px-3 ${!toggleStates.hoaFees?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /mo
            </button>
            <button
              type="button"
              onClick={() => handleToggleChange('hoaFees', 'isYearly')}
              className={`px-3 ${toggleStates.hoaFees?.isYearly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              /yr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailsSection;