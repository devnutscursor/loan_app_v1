import React from 'react';
import { HelpCircle, Check } from 'lucide-react';

// Program type and loan term constants
const PROGRAM_TYPES = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'fsa_rhs', label: 'FSA/RHS-Guaranteed' },
  { value: 'jumbo', label: 'Jumbo' },
  { value: 'other', label: 'Other' }
];

const LOAN_TERMS = [
  { value: 10, label: '10 Years' },
  { value: 15, label: '15 Years' },
  { value: 20, label: '20 Years' },
  { value: 25, label: '25 Years' },
  { value: 30, label: '30 Years' }
];

/**
 * Basic Program Information Section
 * Handles the main program details like name, type, and availability
 */
const BasicProgramSection = ({ formData, onChange, isLoading, readOnly = false }) => {
  const handleChange = (e) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      onChange(name, checked);
    } else {
      onChange(name, value);
    }
  };
  
  // For toggle button click
  const handleToggleClick = (name) => {
    if (readOnly) return; // Prevent changes in read-only mode
    onChange(name, !formData[name]);
  };

  const handleNumberChange = (e) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const { name, value } = e.target;
    if (value === '') {
      onChange(name, '');
    } else {
      onChange(name, Number(value));
    }
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 mb-6 bg-white">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Program Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Name */}
        <div>
          <label htmlFor="programName" className="block text-sm font-medium text-gray-700 mb-1">
            Program Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="programName"
            name="programName"
            className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 h-10 pl-3`}
            value={formData.programName}
            onChange={handleChange}
            disabled={isLoading || readOnly}
            readOnly={readOnly}
            required
            style={{ height: '38px' }}
          />
          <p className="mt-1 text-xs text-gray-500">Internal name (not shown to borrowers)</p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 h-10 pl-3`}
            value={formData.displayName}
            onChange={handleChange}
            disabled={isLoading || readOnly}
            readOnly={readOnly}
            required
            style={{ height: '38px' }}
          />
          <p className="mt-1 text-xs text-gray-500">Name shown to borrowers</p>
        </div>

        {/* Program Type */}
        <div>
          <label htmlFor="programType" className="block text-sm font-medium text-gray-700 mb-1">
            Program Type <span className="text-red-600">*</span>
          </label>
          <select
            id="programType"
            name="programType"
            className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 h-10 pl-3`}
            value={formData.programType}
            onChange={handleChange}
            disabled={isLoading || readOnly}
            required
            style={{ height: '38px' }}
          >
            {PROGRAM_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loan Term */}
        <div>
          <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Term
          </label>
          <select
            id="loanTerm"
            name="loanTerm"
            className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 h-10 pl-3`}
            value={formData.loanTerm}
            onChange={handleNumberChange}
            disabled={isLoading || readOnly}
            style={{ height: '38px' }}
          >
            {LOAN_TERMS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rate Adjustment */}
        <div>
          <label htmlFor="rateAdjustment" className="block text-sm font-medium text-gray-700 mb-1">
            Rate Adjustment
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
            <input
              type="number"
              name="rateAdjustment"
              id="rateAdjustment"
              className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 h-10 pl-9`}
              value={formData.rateAdjustment}
              onChange={handleNumberChange}
              disabled={isLoading || readOnly}
              readOnly={readOnly}
              step="0.125"
              style={{ height: '38px' }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Adjustment to base rate</p>
        </div>
      </div>

      {/* Availability toggle */}
      <div className="mt-6">
        <div className="flex items-center py-2">
          <button 
            type="button" 
            onClick={() => handleToggleClick('isAvailableToBorrower')} 
            disabled={isLoading || readOnly}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer'} rounded-full border-2 border-transparent ${formData.isAvailableToBorrower ? 'bg-blue-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out focus:outline-none`}
          >
            <span className="sr-only">Toggle Available to Borrowers</span>
            <span
              className={`${formData.isAvailableToBorrower ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
            >
              {formData.isAvailableToBorrower && (
                <Check className="h-3 w-3 text-blue-500" />
              )}
            </span>
          </button>
          <label htmlFor="isAvailableToBorrower" className="text-sm font-medium text-gray-700 select-none">Available to Borrowers</label>
        </div>
      </div>

      {/* Program Description */}
      <div className="mt-4">
        <label htmlFor="loanHelpText" className="block text-sm font-medium text-gray-700 mb-1">
          Program Description
        </label>
        <textarea
          id="loanHelpText"
          name="loanHelpText"
          rows={3}
          className={`block w-full rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} ${isLoading ? 'cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'} sm:text-sm border-gray-300 p-3`}
          value={formData.loanHelpText}
          onChange={handleChange}
          disabled={isLoading || readOnly}
          readOnly={readOnly}
          placeholder="Enter a description for this loan program"
        />
        <p className="mt-1 text-xs text-gray-500">Description shown to borrowers when selecting this program</p>
      </div>
    </div>
  );
};

export default BasicProgramSection;
