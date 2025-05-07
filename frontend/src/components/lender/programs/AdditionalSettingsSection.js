import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Additional Settings Section Component
 * Handles miscellaneous settings and toggles for a loan program
 */
const AdditionalSettingsSection = ({ formData, onChange, isLoading }) => {
  // Handle checkbox changes
  const handleChange = (name) => {
    onChange(name, !formData[name]);
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 mb-6 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => document.getElementById('additionalSettings').classList.toggle('hidden')}
      >
        <h2 className="text-lg font-medium text-gray-900">Additional Settings</h2>
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>
      <div id="additionalSettings" className="mt-4">
        <div className="space-y-2">
          <div className="flex items-center py-2">
            <button 
              type="button" 
              onClick={() => handleChange('isAdjustableRateMortgage')} 
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${formData.isAdjustableRateMortgage ? 'bg-blue-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span className="sr-only">Toggle ARM</span>
              <span
                className={`${formData.isAdjustableRateMortgage ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
              >
                {formData.isAdjustableRateMortgage && (
                  <Check className="h-3 w-3 text-blue-500" />
                )}
              </span>
            </button>
            <label htmlFor="isAdjustableRateMortgage" className="text-sm font-medium text-gray-700 select-none ml-2">Adjustable Rate Mortgage (ARM)</label>
          </div>
          
          <div className="flex items-center py-2">
            <button 
              type="button" 
              onClick={() => handleChange('allowSubjectPropertyAddress')} 
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${formData.allowSubjectPropertyAddress ? 'bg-blue-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span className="sr-only">Toggle Subject Property</span>
              <span
                className={`${formData.allowSubjectPropertyAddress ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
              >
                {formData.allowSubjectPropertyAddress && (
                  <Check className="h-3 w-3 text-blue-500" />
                )}
              </span>
            </button>
            <label htmlFor="allowSubjectPropertyAddress" className="text-sm font-medium text-gray-700 select-none ml-2">Allow Subject Property Address to be Changed</label>
          </div>
          
          <div className="flex items-center py-2">
            <button 
              type="button" 
              onClick={() => handleChange('allowPreApprovalLetter')} 
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${formData.allowPreApprovalLetter ? 'bg-blue-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span className="sr-only">Toggle Approval Letter</span>
              <span
                className={`${formData.allowPreApprovalLetter ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
              >
                {formData.allowPreApprovalLetter && (
                  <Check className="h-3 w-3 text-blue-500" />
                )}
              </span>
            </button>
            <label htmlFor="allowPreApprovalLetter" className="text-sm font-medium text-gray-700 select-none ml-2">Allow Pre-Approval Letter Customization</label>
          </div>
          
          <div className="flex items-center py-2">
            <button 
              type="button" 
              onClick={() => handleChange('lockLoanData')} 
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${formData.lockLoanData ? 'bg-blue-500' : 'bg-gray-200'} transition-colors duration-200 ease-in-out focus:outline-none`}
            >
              <span className="sr-only">Toggle Lock Loan Data</span>
              <span
                className={`${formData.lockLoanData ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
              >
                {formData.lockLoanData && (
                  <Check className="h-3 w-3 text-blue-500" />
                )}
              </span>
            </button>
            <label htmlFor="lockLoanData" className="text-sm font-medium text-gray-700 select-none ml-2">Lock Loan Data From External Changes</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalSettingsSection;
