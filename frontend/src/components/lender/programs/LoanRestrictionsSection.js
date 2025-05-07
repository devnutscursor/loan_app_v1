import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

/**
 * Loan Restrictions Section Component
 * Manages DTI, down payment, and loan amount restrictions
 */
const LoanRestrictionsSection = ({ formData, onChange, isLoading }) => {
  // Handle changes to nested restriction fields
  const handleRestrictionsChange = (field, subfield, value) => {
    onChange('restrictions', {
      ...formData.restrictions,
      [field]: {
        ...formData.restrictions[field],
        [subfield]: value === '' ? null : Number(value)
      }
    });
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 mb-6 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => document.getElementById('loanRestrictions').classList.toggle('hidden')}
      >
        <h2 className="text-lg font-medium text-gray-900">Loan Restrictions</h2>
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>
      <div id="loanRestrictions" className="mt-4">
        {/* DTI Restriction */}
        <div className="mb-6">
          <div className="flex items-center mb-1">
            <label htmlFor="dtiMax" className="block text-sm font-medium text-gray-700 mr-1">
              Maximum DTI Ratio (%)
            </label>
            <div className="relative group cursor-pointer">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <div className="hidden group-hover:block absolute z-10 w-72 px-3 py-2 bg-gray-700 text-white text-xs rounded-md shadow-lg -left-36 bottom-full mb-2">
                <div className="absolute w-3 h-3 bg-gray-700 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
                <p>Maximum allowable Debt-to-Income ratio for this loan program.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
            <input
              type="number"
              id="dtiMax"
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              value={formData.restrictions.dtiRestriction.max || ''}
              onChange={(e) => handleRestrictionsChange('dtiRestriction', 'max', e.target.value)}
              disabled={isLoading}
              step="0.1"
              min="0"
              max="100"
              style={{ height: '38px' }} /* Match button height */
            />
          </div>
        </div>

        {/* Down Payment Restriction */}
        <div className="mb-6">
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 mr-1">
              Down Payment Restriction (%)
            </label>
            <div className="relative group cursor-pointer">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <div className="hidden group-hover:block absolute z-10 w-72 px-3 py-2 bg-gray-700 text-white text-xs rounded-md shadow-lg -left-36 bottom-full mb-2">
                <div className="absolute w-3 h-3 bg-gray-700 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
                <p>Minimum and maximum down payment percentages allowed for this loan program.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="downPaymentMin" className="block text-xs font-medium text-gray-500 mb-1">
                Minimum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  id="downPaymentMin"
                  className="focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  value={formData.restrictions.downPaymentRestriction.min || ''}
                  onChange={(e) => handleRestrictionsChange('downPaymentRestriction', 'min', e.target.value)}
                  disabled={isLoading}
                  step="0.1"
                  min="0"
                  max="100"
                  style={{ height: '38px' }} /* Match button height */
                />
              </div>
            </div>
            <div>
              <label htmlFor="downPaymentMax" className="block text-xs font-medium text-gray-500 mb-1">
                Maximum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  id="downPaymentMax"
                  className="focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  value={formData.restrictions.downPaymentRestriction.max || ''}
                  onChange={(e) => handleRestrictionsChange('downPaymentRestriction', 'max', e.target.value)}
                  disabled={isLoading}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="No max"
                  style={{ height: '38px' }} /* Match button height */
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loan Amount Restriction */}
        <div className="mb-6">
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 mr-1">
              Loan Amount Restriction ($)
            </label>
            <div className="relative group cursor-pointer">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <div className="hidden group-hover:block absolute z-10 w-72 px-3 py-2 bg-gray-700 text-white text-xs rounded-md shadow-lg -left-36 bottom-full mb-2">
                <div className="absolute w-3 h-3 bg-gray-700 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
                <p>Minimum and maximum loan amounts allowed for this loan program.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="loanAmountMin" className="block text-xs font-medium text-gray-500 mb-1">
                Minimum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="loanAmountMin"
                  className="focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  value={formData.restrictions.loanAmountRestriction.min || ''}
                  onChange={(e) => handleRestrictionsChange('loanAmountRestriction', 'min', e.target.value)}
                  disabled={isLoading}
                  step="1000"
                  min="0"
                  placeholder="No min"
                  style={{ height: '38px' }} /* Match button height */
                />
              </div>
            </div>
            <div>
              <label htmlFor="loanAmountMax" className="block text-xs font-medium text-gray-500 mb-1">
                Maximum
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="loanAmountMax"
                  className="focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  value={formData.restrictions.loanAmountRestriction.max || ''}
                  onChange={(e) => handleRestrictionsChange('loanAmountRestriction', 'max', e.target.value)}
                  disabled={isLoading}
                  step="1000"
                  min="0"
                  placeholder="No max"
                  style={{ height: '38px' }} /* Match button height */
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanRestrictionsSection;
