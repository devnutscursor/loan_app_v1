import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Component for loan program guidelines section
 */
const ProgramGuidelinesSection = ({
  localParams,
  loanPrograms,
  selectedProgram,
  handleInputChange: originalHandleInputChange,
  handleToggleChange,  // Add this prop for handling toggle changes
  showFinanceFees,
  setShowFinanceFees,
  onProgramChange,
  toggleStates = {}  // Add toggleStates prop with default empty object
}) => {
  // Wrap the input change handler to add debugging
  const handleInputChange = (e) => {
    console.log(`[DEBUG] Program guideline field changed: ${e.target.name} = ${e.target.value}`);
    
    // Special handling for program selection to load program-specific values
    if (e.target.name === 'selectedProgramId') {
      const newProgramId = e.target.value;
      console.log(`[DEBUG] Program changed to: ${newProgramId}`);
      
      // Find the selected program data
      const newProgram = loanPrograms.find(program => program._id === newProgramId);
      
      if (newProgram) {
        // First pass the event to the program change handler if available
        if (onProgramChange) {
          console.log('[DEBUG] Calling onProgramChange with program ID:', newProgramId);
          onProgramChange(e);
        }
        
        // Also pass to the original handler to update parameters
        originalHandleInputChange(e);
        
        // Log that we're loading program-specific guidelines
        console.log(`[DEBUG] Loading program-specific guidelines for: ${newProgram.displayName}`);
      } else {
        // Just handle the normal change
        originalHandleInputChange(e);
      }
    } else {
      // For all other field changes, just pass through
      originalHandleInputChange(e);
    }
  };

  useEffect(() => {
    console.log('[DEBUG] Program Guidelines:', localParams);
  }, [localParams]);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Program Guidelines</h3>

      {/* Loan Program Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loan Program
        </label>
        <div className="relative">
          <select
            name="selectedProgramId"
            value={localParams.selectedProgramId}
            onChange={handleInputChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none"
            style={{ height: '38px' }}
          >
            {loanPrograms.map(program => (
              <option key={program._id} value={program._id}>
                {program.displayName}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Pre-Approval Letter Template */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pre-Approval Letter Template
        </label>
        <div className="relative">
          <select
            name="preApprovalTemplate"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10 appearance-none"
            style={{ height: '38px' }}
          >
            <option value="standard">Pre-Approval Letter</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* DTI Restriction */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          DTI Letter Restriction (%)
        </label>
        <div className="flex">
          <div className="relative w-full flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 text-sm">Max</span>
            </div>
            <input
              type="number"
              name="dtiMax"
              value={localParams.dtiMax || (selectedProgram?.restrictions?.dtiRestriction?.max || 0)}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-12 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              style={{ height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Down Payment Restriction */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Down Payment (%)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative w-full flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 text-sm">Min</span>
            </div>
            <input
              type="number"
              name="downPaymentMin"
              value={localParams.downPaymentMin !== undefined ? localParams.downPaymentMin : (selectedProgram?.restrictions?.downPaymentRestriction?.min || 3)}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-12 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              style={{ height: '38px' }}
            />
          </div>
          <div className="relative w-full flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 text-sm">Max</span>
            </div>
            <input
              type="number"
              name="downPaymentMax"
              onChange={handleInputChange}
              value={localParams.downPaymentMax !== undefined ? localParams.downPaymentMax : (selectedProgram?.restrictions?.downPaymentRestriction?.max || '')}
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-12 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              style={{ height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Loan Amount Restriction */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loan Amount ($)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative w-full flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 text-sm">Min</span>
            </div>
            <input
              type="number"
              name="loanAmountMin"
              value={localParams.loanAmountMin !== undefined ? localParams.loanAmountMin : (selectedProgram?.restrictions?.loanAmountRestriction?.min || '')}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-12 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              style={{ height: '38px' }}
            />
          </div>
          <div className="relative w-full flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 text-sm">Max</span>
            </div>
            <input
              type="number"
              name="loanAmountMax"
              value={localParams.loanAmountMax !== undefined ? localParams.loanAmountMax : (selectedProgram?.restrictions?.loanAmountRestriction?.max || '')}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 pl-12 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
              style={{ height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Mortgage Insurance Section */}
      {(() => {
        // Get the selected program from the dropdown
        const selectedProgramFromList = loanPrograms.find(p => p._id === localParams.selectedProgramId);
        const programName = selectedProgramFromList?.displayName || '';
        
        // This should detect any program with FHA in the name
        return programName.includes('FHA') ? (
          <div className="mb-4">
            <h4 className="block text-sm font-medium text-gray-700 mb-3">Mortgage Insurance</h4>
            
            {/* Upfront Mortgage Insurance (UFMI %) */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upfront Mortgage Insurance (UFMI %)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="upfrontMIP"
                  value={localParams.upfrontMIP !== undefined ? localParams.upfrontMIP : (selectedProgram?.fhaMortgageInsurance?.upfrontMIP || 1.75)}
                  onChange={handleInputChange}
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  style={{ height: '38px' }}
                />
              </div>
            </div>
            
            {/* Monthly Mortgage Insurance (MI %) */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Mortgage Insurance (MI %)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="annualMIP"
                  value={localParams.annualMIP !== undefined ? localParams.annualMIP : (selectedProgram?.fhaMortgageInsurance?.annualMIP || 0.85)}
                  onChange={handleInputChange}
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  style={{ height: '38px' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            
            
            {/* FMI Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FMI (%) - Financed Mortgage Insurance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="fmi"
                  value={selectedProgram?.fmi || 0}
                  readOnly
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 pl-7 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  style={{ height: '38px' }}
                />
              </div>
            </div>

            {/* PMI Table */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Private Mortgage Insurance (%)
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">LTV Range</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedProgram?.privateMortgageInsurance?.map((pmi, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{pmi.minLTV}-{pmi.maxLTV}%</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{pmi.rate}%</td>
                      </tr>
                    )) || (
                        <tr>
                          <td colSpan="2" className="whitespace-nowrap px-3 py-2 text-xs text-center text-gray-500">No PMI data available</td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Finance Fees Section - Accordion - Commented out */}
      {/* <div className="mb-4 border border-gray-200 rounded-md overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
          onClick={() => setShowFinanceFees(!showFinanceFees)}
        >
          <h4 className="text-sm font-medium text-gray-700">Hide Fees (fees are not displayed to customer)</h4>
          {showFinanceFees ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
        </button>
        
        {showFinanceFees && (
          <div className="p-4 bg-gray-50">
            */}{/* Origination Fees */}{/*
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origination Fees
              </label>
              <div className="flex flex-wrap items-center gap-2">
                */}{/* Type toggle ($ or %) */}{/*
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('originationFees', 'isPercent', false)}
                    className={`px-3 py-2 ${!toggleStates.originationFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('originationFees', 'isPercent', true)}
                    className={`px-3 py-2 ${toggleStates.originationFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    %
                  </button>
                </div>

                */}{/* Value input */}{/*
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      name="originationFees"
                      value={localParams.originationFees !== undefined ? localParams.originationFees : (selectedProgram?.originationFees?.value || 0)}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                */}{/* Frequency toggle */}{/*
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('originationFees', 'frequency', 'once')}
                    className={`px-3 py-2 ${toggleStates.originationFees?.frequency === 'once' || !toggleStates.originationFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('originationFees', 'frequency', 'monthly')}
                    className={`px-3 py-2 ${toggleStates.originationFees?.frequency === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('originationFees', 'frequency', 'yearly')}
                    className={`px-3 py-2 ${toggleStates.originationFees?.frequency === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>

            */}{/* Closing Costs */}{/*
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closing Costs
              </label>
              <div className="flex flex-wrap items-center gap-2">
                */}{/* Type toggle ($ or %) */}{/*
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('closingCosts', 'isPercent', false)}
                    className={`px-3 py-2 ${!toggleStates.closingCosts?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('closingCosts', 'isPercent', true)}
                    className={`px-3 py-2 ${toggleStates.closingCosts?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    %
                  </button>
                </div>

                */}{/* Value input */}{/*
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      name="closingCosts"
                      value={localParams.closingCosts !== undefined ? localParams.closingCosts : (selectedProgram?.closingCosts?.value || 0)}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                */}{/* Frequency toggle */}{/*
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('closingCosts', 'frequency', 'once')}
                    className={`px-3 py-2 ${toggleStates.closingCosts?.frequency === 'once' || !toggleStates.closingCosts?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('closingCosts', 'frequency', 'monthly')}
                    className={`px-3 py-2 ${toggleStates.closingCosts?.frequency === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('closingCosts', 'frequency', 'yearly')}
                    className={`px-3 py-2 ${toggleStates.closingCosts?.frequency === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>

            */}{/* Other Fees */}{/*
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Fees
              </label>
              <div className="flex flex-wrap items-center gap-2">
                */}{/* Type toggle ($ or %) */}{/*
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('otherFees', 'isPercent', false)}
                    className={`px-3 py-2 ${!toggleStates.otherFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleToggleChange('otherFees', 'isPercent', true)}
                    className={`px-3 py-2 ${toggleStates.otherFees?.isPercent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    %
                  </button>
                </div>

                */}{/* Value input */}{/*
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      name="otherFees"
                      value={localParams.otherFees !== undefined ? localParams.otherFees : (selectedProgram?.otherFees?.value || 0)}
                      onChange={handleInputChange}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                */}{/* Frequency toggle */}{/*
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('otherFees', 'frequency', 'once')}
                    className={`px-3 py-2 ${toggleStates.otherFees?.frequency === 'once' || !toggleStates.otherFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('otherFees', 'frequency', 'monthly')}
                    className={`px-3 py-2 ${toggleStates.otherFees?.frequency === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('otherFees', 'frequency', 'yearly')}
                    className={`px-3 py-2 ${toggleStates.otherFees?.frequency === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default ProgramGuidelinesSection;
