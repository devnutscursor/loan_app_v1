import React from 'react';
import { ChevronDown, Trash2, PlusCircle } from 'lucide-react';

/**
 * Mortgage Insurance Section Component
 * Handles program PMI tiers and other insurance settings
 */
const MortgageInsuranceSection = ({ formData, onChange, isLoading, readOnly = false }) => {
  // Handle changes to private mortgage insurance tiers
  const handlePMIChange = (index, field, value) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const newPMI = [...formData.privateMortgageInsurance];
    newPMI[index] = {
      ...newPMI[index],
      [field]: value === '' ? 0 : Number(value)
    };
    
    onChange('privateMortgageInsurance', newPMI);
  };

  // Add a new PMI tier
  const addPMITier = () => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const newPMI = [...formData.privateMortgageInsurance];
    const lastTier = newPMI[newPMI.length - 1];
    
    // Set new tier with default values
    newPMI.push({
      minLTV: lastTier ? lastTier.maxLTV + 0.01 : 80.01,
      maxLTV: lastTier ? lastTier.maxLTV + 5 : 85,
      rate: 0.5
    });
    
    onChange('privateMortgageInsurance', newPMI);
  };

  // Remove a PMI tier
  const removePMITier = (index) => {
    if (readOnly) return; // Prevent changes in read-only mode
    
    const newPMI = [...formData.privateMortgageInsurance];
    newPMI.splice(index, 1);
    
    onChange('privateMortgageInsurance', newPMI);
  };

  // Handle simple numeric value changes
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
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => document.getElementById('mortgageInsurance').classList.toggle('hidden')}
      >
        <h2 className="text-lg font-medium text-gray-900">Mortgage Insurance</h2>
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>
      <div id="mortgageInsurance" className="mt-4">
        {/* FHA Program Mortgage Insurance */}
        {formData.programType === 'fha' && (
          <div>
            {/* FHA Upfront MIP */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upfront MIP (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="upfrontMortgageInsurance"
                  value={formData.upfrontMortgageInsurance}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
              </div>
            </div>
            
            {/* Monthly MIP */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Mortgage Insurance (MI %)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="mortgageInsurance"
                  value={formData.mortgageInsurance}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conventional Program */}
        {formData.programType === 'conventional' && (
          <div>
            {/* FMI Field for Conventional Loans */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FMI (%) - Financed Mortgage Insurance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="fmi"
                  value={formData.fmi || 0}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Financed mortgage insurance.</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-gray-900">Private Mortgage Insurance Tiers</h3>
              {!readOnly && (
                <button
                  type="button"
                  onClick={addPMITier}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>Add Tier</span>
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Min LTV (%)</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Max LTV (%)</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate (%)</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {formData.privateMortgageInsurance.map((tier, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                          <input
                            type="number"
                            className={`w-20 pl-6 py-1 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'}`}
                            value={tier.minLTV}
                            onChange={(e) => handlePMIChange(index, 'minLTV', e.target.value)}
                            step="0.01"
                            min="0"
                            max="100"
                            disabled={isLoading || readOnly}
                            readOnly={readOnly}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                          <input
                            type="number"
                            className={`w-20 pl-6 py-1 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'}`}
                            value={tier.maxLTV}
                            onChange={(e) => handlePMIChange(index, 'maxLTV', e.target.value)}
                            step="0.01"
                            min="0"
                            max="100"
                            disabled={isLoading || readOnly}
                            readOnly={readOnly}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                          <input
                            type="number"
                            className={`w-20 pl-6 py-1 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'}`}
                            value={tier.rate}
                            onChange={(e) => handlePMIChange(index, 'rate', e.target.value)}
                            step="0.01"
                            min="0"
                            max="10"
                            disabled={isLoading || readOnly}
                            readOnly={readOnly}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-right">
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removePMITier(index)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isLoading || formData.privateMortgageInsurance.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VA Program - Funding Fee */}
        {formData.programType === 'va' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funding Fee (%)
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="fundingFee"
                  value={formData.fundingFee}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
            </div>
            <p className="mt-1 text-sm text-gray-500">VA funding fee for first-time and subsequent use of VA loans.</p>
          </div>
        )}
        
        {/* USDA Program */}
        {formData.programType === 'usda' && (
          <div>
            {/* USDA Funding Fee */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funding Fee (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="fundingFee"
                  value={formData.fundingFee}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">USDA funding fee for new loans.</p>
            </div>
            
            {/* USDA Mortgage Insurance */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MI (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="mortgageInsurance"
                  value={formData.mortgageInsurance}
                  onChange={handleNumberChange}
                  className={`focus:ring-primary focus:border-primary block w-full py-2 pl-9 sm:text-sm border-gray-300 rounded-md ${readOnly ? 'bg-gray-100 cursor-default' : 'bg-gray-50'} h-10`}
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLoading || readOnly}
                  readOnly={readOnly}
                  style={{ height: '38px' }}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">USDA annual mortgage insurance premium.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageInsuranceSection;
