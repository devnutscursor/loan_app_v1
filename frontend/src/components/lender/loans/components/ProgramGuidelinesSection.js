import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Component for loan program guidelines section
 */
const ProgramGuidelinesSection = ({
  localParams,
  loanPrograms,
  selectedProgram,
  handleInputChange,
  showFinanceFees,
  setShowFinanceFees
}) => {
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
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm h-10">
            Max
          </span>
          <input
            type="number"
            name="dtiMax"
            value={localParams.dtiMax !== undefined ? localParams.dtiMax : (selectedProgram?.restrictions?.dtiRestriction?.max || 43)}
            onChange={handleInputChange}
            className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
          />
        </div>
      </div>

      {/* Down Payment Restriction */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Down Payment (%)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
              Min
            </span>
            <input
              type="number"
              name="downPaymentMin"
              value={localParams.downPaymentMin !== undefined ? localParams.downPaymentMin : (selectedProgram?.restrictions?.downPaymentRestriction?.min || 3)}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
            />
          </div>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
              Max
            </span>
            <input
              type="number"
              name="downPaymentMax"
              onChange={handleInputChange}
              value={localParams.downPaymentMax !== undefined ? localParams.downPaymentMax : (selectedProgram?.restrictions?.downPaymentRestriction?.max || '')}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
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
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
              Min
            </span>
            <input
              type="number"
              name="loanAmountMin"
              value={localParams.loanAmountMin !== undefined ? localParams.loanAmountMin : (selectedProgram?.restrictions?.loanAmountRestriction?.min || '')}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
            />
          </div>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
              Max
            </span>
            <input
              type="number"
              name="loanAmountMax"
              value={localParams.loanAmountMax !== undefined ? localParams.loanAmountMax : (selectedProgram?.restrictions?.loanAmountRestriction?.max || '')}
              onChange={handleInputChange}
              className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-r-md bg-gray-50 h-10"
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
              <div className="flex">
                <input
                  type="number"
                  name="upfrontMIP"
                  value={selectedProgram?.fhaMortgageInsurance?.upfrontMIP || 1.75}
                  readOnly
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                />
                <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                  %
                </span>
              </div>
            </div>
            
            {/* Monthly Mortgage Insurance (MI %) */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Mortgage Insurance (MI %)
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="annualMIP"
                  value={selectedProgram?.fhaMortgageInsurance?.annualMIP || 0.85}
                  readOnly
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                />
                <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                  %
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>
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
            
            {/* FMI Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FMI (%) - Financed Mortgage Insurance
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="fmi"
                  value={selectedProgram?.fmi || 0}
                  readOnly
                  className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-l-md bg-gray-50 h-10"
                />
                <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md h-10">
                  %
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Finance Fees Section - Accordion */}
      <div className="mb-4 border border-gray-200 rounded-md overflow-hidden">
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
            {/* Origination Fees */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origination Fees
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Type toggle ($ or %) */}
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.originationFees?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.originationFees?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    %
                  </button>
                </div>

                {/* Value input */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={selectedProgram?.originationFees?.value || 0}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      readOnly
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                {/* Frequency toggle */}
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'once' || !selectedProgram?.originationFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.originationFees?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>

            {/* Closing Costs */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closing Costs
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Type toggle ($ or %) */}
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.closingCosts?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.closingCosts?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    %
                  </button>
                </div>

                {/* Value input */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={selectedProgram?.closingCosts?.value || 0}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      readOnly
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                {/* Frequency toggle */}
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'once' || !selectedProgram?.closingCosts?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.closingCosts?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>

            {/* Other Fees */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Fees
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Type toggle ($ or %) */}
                <div className="grid grid-cols-2 h-10 w-20">
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.otherFees?.type !== 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    $
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.otherFees?.type === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    %
                  </button>
                </div>

                {/* Value input */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={selectedProgram?.otherFees?.value || 0}
                      className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      readOnly
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                {/* Frequency toggle */}
                <div className="grid grid-cols-3 h-10">
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'once' || !selectedProgram?.otherFees?.frequency ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /once
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'mo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /mo
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 ${selectedProgram?.otherFees?.frequency === 'yr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                    disabled
                  >
                    /yr
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramGuidelinesSection;
