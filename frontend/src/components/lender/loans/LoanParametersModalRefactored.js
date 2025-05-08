import { useState } from 'react';
import { X } from 'lucide-react';
import { 
  getLoanAmount as getInitialLoanAmount, 
  getInterestRate as getInitialInterestRate,
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets
} from './utils/LoanCalculationUtils';

// Import components
import CalculationStatusCard from './components/CalculationStatusCard';
import PaymentBreakdown from './components/PaymentBreakdown';
import FinancialSummaryCards from './components/FinancialSummaryCards';
import LoanDetailsSection from './components/LoanDetailsSection';
import ProgramGuidelinesSection from './components/ProgramGuidelinesSection';

// Import refactored parameter components
import AutoSaveHandler from './components/parameters/AutoSaveHandler';
import DataLoader from './components/parameters/DataLoader';
import ParametersProvider from './components/parameters/ParametersProvider';
import ProgramGuidelinesManager from './components/parameters/ProgramGuidelinesManager';

/**
 * LoanParametersModal component - Refactored for better code organization
 */
const LoanParametersModal = ({ 
  isOpen, 
  onClose, 
  loan, 
  loanPrograms, 
  loanRates, 
  initialCalculations = {}, 
  onParametersChange 
}) => {
  // State to track the selected program
  const [selectedProgram, setSelectedProgram] = useState(
    loanPrograms.find(p => p._id === loan?.loanParameters?.selectedProgramId) || loanPrograms[0]
  );

  // State to track accordion visibility
  const [showFinanceFees, setShowFinanceFees] = useState(false);

  // Handle program change
  const handleProgramChange = (programId) => {
    const program = loanPrograms.find(p => p._id === programId);
    if (program) {
      console.log('[DEBUG] Selected loan program:', program.displayName);
      setSelectedProgram(program);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-end">
      <div className="w-full md:w-4/5 lg:w-3/4 h-full bg-white shadow-xl overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Loan Parameters</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Use ParametersProvider to manage state and calculations */}
          <ParametersProvider
            loan={loan}
            selectedProgram={selectedProgram}
            initialCalculations={initialCalculations}
          >
            {({ 
              localParams, 
              setLocalParams, 
              toggleStates, 
              setToggleStates, 
              calculations, 
              handleInputChange, 
              handleToggleChange 
            }) => (
              <>
                {/* Handle loading data */}
                <DataLoader
                  loan={loan}
                  loanId={loan?._id}
                  setLocalParams={setLocalParams}
                  setToggleStates={setToggleStates}
                  onProgramChange={handleProgramChange}
                  selectedProgram={selectedProgram}
                  loanPrograms={loanPrograms}
                />

                {/* Handle program-specific guidelines */}
                <ProgramGuidelinesManager
                  localParams={localParams}
                  setLocalParams={setLocalParams}
                  selectedProgram={selectedProgram}
                  loanPrograms={loanPrograms}
                />

                {/* Auto-save changes */}
                <AutoSaveHandler
                  loan={loan}
                  localParams={localParams}
                  calculations={calculations}
                  toggleStates={toggleStates}
                  selectedProgram={selectedProgram}
                />

                {/* Calculation Status Section */}
                <CalculationStatusCard isQualified={calculations.isQualified} />

                {/* Payment Breakdown Section */}
                <PaymentBreakdown calculations={calculations} />

                {/* Income, Debts, and Assets Section */}
                <FinancialSummaryCards 
                  income={localParams.income}
                  debts={localParams.debts}
                  assets={localParams.assets}
                />
                
                {/* Two-column layout for Loan Details and Program Guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Loan Details Column */}
                  <div>
                    <LoanDetailsSection 
                      localParams={localParams} 
                      toggleStates={toggleStates}
                      handleInputChange={handleInputChange}
                      handleToggleChange={handleToggleChange}
                    />
                  </div>
                  
                  {/* Program Guidelines Column */}
                  <div>
                    <ProgramGuidelinesSection 
                      localParams={localParams}
                      loanPrograms={loanPrograms}
                      selectedProgram={selectedProgram}
                      handleInputChange={handleInputChange}
                      showFinanceFees={showFinanceFees}
                      setShowFinanceFees={setShowFinanceFees}
                    />
                  </div>
                </div>
              </>
            )}
          </ParametersProvider>
        </div>
      </div>
    </div>
  );
};

export default LoanParametersModal;
