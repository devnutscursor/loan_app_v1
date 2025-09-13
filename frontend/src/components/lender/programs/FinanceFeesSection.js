import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Finance Fees Section Component
 * Handles the UI for program fees with toggles for amount/percentage and frequency
 */
const FinanceFeesSection = ({ formData, onChange, isLoading, readOnly = false }) => {
  // Helper to handle fee value changes
  const handleFeeChange = (feeType, field, value) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    // Create a copy of the fee object to modify
    const updatedFee = { ...formData[feeType], [field]: value };
    
    // When passing to the parent component, use the complete object
    onChange(feeType, updatedFee);
  };

  // Toggle between amount ($) and percentage (%)
  const toggleInputMode = (feeType) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const fee = formData[feeType];
    const isCurrentlyPercent = fee.isPercent;
    
    // Toggle the isPercent flag
    handleFeeChange(feeType, 'isPercent', !isCurrentlyPercent);
  };

  // Toggle between frequency options (once/mo/yr)
  const toggleFrequency = (feeType, newFrequency) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    handleFeeChange(feeType, 'frequency', newFrequency);
  };

  // Render fee input field with $ or % toggle and frequency toggle
  const renderFeeInput = (feeType, label) => {
    const fee = formData[feeType];
    
    return (
      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-900 mb-3">
          {label}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Type toggle ($ or %) */}
          <div className="grid grid-cols-2 h-10 w-20">
            <button 
              type="button"
              onClick={() => toggleInputMode(feeType)}
              disabled={isLoading || readOnly}
              className={`px-3 py-2 ${!fee.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${readOnly ? 'cursor-default' : 'hover:bg-blue-400'} transition text-sm font-medium rounded-l-md`}
            >
              $
            </button>
            <button 
              type="button"
              onClick={() => toggleInputMode(feeType)}
              disabled={isLoading || readOnly}
              className={`px-3 py-2 ${fee.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${readOnly ? 'cursor-default' : 'hover:bg-blue-400'} transition text-sm font-medium rounded-r-md`}
            >
              %
            </button>
          </div>

          {/* Value input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="number"
                className={`focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                value={fee.isPercent ? fee.percentage : fee.amount}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  handleFeeChange(feeType, fee.isPercent ? 'percentage' : 'amount', value);
                }}
                disabled={isLoading || readOnly}
                readOnly={readOnly}
                step={fee.isPercent ? 0.01 : 1}
                min="0"
                style={{ height: '38px' }} /* Match button height */
              />
            </div>
          </div>

          {/* Frequency toggle */}
          <div className="grid grid-cols-3 h-10">
            <button
              type="button"
              onClick={() => toggleFrequency(feeType, 'once')}
              disabled={isLoading || readOnly}
              className={`px-3 py-2 ${fee.frequency === 'once' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${readOnly ? 'cursor-default' : 'hover:bg-blue-400'} transition text-sm font-medium rounded-l-md`}
            >
              /once
            </button>
            <button
              type="button"
              onClick={() => toggleFrequency(feeType, 'mo')}
              disabled={isLoading || readOnly}
              className={`px-3 py-2 ${fee.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${readOnly ? 'cursor-default' : 'hover:bg-blue-400'} transition text-sm font-medium`}
            >
              /mo
            </button>
            <button
              type="button"
              onClick={() => toggleFrequency(feeType, 'yr')}
              disabled={isLoading || readOnly}
              className={`px-3 py-2 ${fee.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${readOnly ? 'cursor-default' : 'hover:bg-blue-400'} transition text-sm font-medium rounded-r-md`}
            >
              /yr
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 mb-6 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => document.getElementById('financeFees').classList.toggle('hidden')}
      >
        <h2 className="text-lg font-medium text-gray-900">Finance Fees</h2>
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>
      <div id="financeFees" className="mt-4">
        {renderFeeInput('originationFees', 'Origination Fees')}
        {renderFeeInput('closingCosts', 'Closing Costs')}
        {renderFeeInput('otherFees', 'Other Fees')}
      </div>
    </div>
  );
};

export default FinanceFeesSection;
