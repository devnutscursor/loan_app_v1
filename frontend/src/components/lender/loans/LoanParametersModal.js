import { useState, useRef } from "react";
import { X, Loader } from "lucide-react";
import {
  getLoanAmount as getInitialLoanAmount,
  getInterestRate as getInitialInterestRate,
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets,
} from "./utils/LoanCalculationUtils";

import {
  CalculationStatusSkeleton,
  PaymentBreakdownSkeleton,
  FinancialSummarySkeleton,
  LoanDetailsSkeleton,
  ProgramGuidelinesSkeleton,
  SavingIndicator,
} from "./components/skeletons/ParameterSkeletons";

// Import components
import CalculationStatusCard from "./components/CalculationStatusCard";
import PaymentBreakdown from "./components/PaymentBreakdown";
import FinancialSummaryCards from "./components/FinancialSummaryCards";
import LoanDetailsSection from "./components/LoanDetailsSection";
import ProgramGuidelinesSection from "./components/ProgramGuidelinesSection";

// Import refactored parameter components
import AutoSaveHandler from "./components/parameters/AutoSaveHandler";
import DataLoader from "./components/parameters/DataLoader";
import ParametersProvider from "./components/parameters/ParametersProvider";
import ProgramGuidelinesManager from "./components/parameters/ProgramGuidelinesManager";
import { ProgramGuidelinesProvider } from "./components/parameters/ProgramGuidelinesProvider";

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
  onParametersChange,
}) => {
  // State to track the selected program
  const [selectedProgram, setSelectedProgram] = useState(
    loanPrograms.find(
      (p) => p._id === loan?.loanParameters?.selectedProgramId
    ) || loanPrograms[0]
  );

  // Reference to store setLocalParams for use in handleProgramChange
  const localParamsRef = useRef(null);

  // State to track accordion visibility
  const [showFinanceFees, setShowFinanceFees] = useState(false);

  // Replace single loading state with more granular states
  const [loadingStates, setLoadingStates] = useState({
    isLoadingDetails: true,
    isLoadingCalculations: true,
    isSaving: false,
  });

  // Update loading state setter function
  const updateLoadingState = (key, value) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle program change - this function is called both directly and via the input onChange
  const handleProgramChange = (programIdOrEvent) => {
    // Handle both direct calls with programId and event objects from dropdowns
    const programId =
      typeof programIdOrEvent === "object"
        ? programIdOrEvent.target.value
        : programIdOrEvent;

    const program = loanPrograms.find((p) => p._id === programId);
    if (program) {
      console.log("[DEBUG] Selected loan program:", program.displayName);
      console.log("[DEBUG] Program loan term:", program.loanTerm);

      // Update the selected program state
      setSelectedProgram(program);

      // Update the loan term in local parameters
      // if (localParamsRef.current) {  // Use the ref instead of direct reference
      //   localParamsRef.current((prevParams) => ({
      //     ...prevParams,
      //     loanTerm: program.loanTerm || 30, // Use program's loanTerm or default to 30
      //     selectedProgramId: program._id // Also ensure program ID is updated
      //   }));
      // }

      // Find the interest rate for this program from loanRates
      if (loanRates && loanRates.length > 0) {
        // Look up the rate by program type
        const programRate = loanRates.find(
          (rate) => rate.programType === program.programType
        );

        if (programRate) {
          console.log(
            `[DEBUG] Found interest rate ${programRate.rate}% for program type ${program.programType}`
          );
        } else {
          console.log(
            `[DEBUG] No matching interest rate found for program type ${program.programType}`
          );
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-end">
      {/* Loading overlay */}
      {/* {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
          <div className="text-center p-5 bg-white rounded-lg shadow-md">
            <Loader className="animate-spin h-10 w-10 mx-auto text-blue-600 mb-2" />
            <p className="text-gray-700 font-medium">Loading parameters...</p>
          </div>
        </div>
      )} */}
      <div className="w-full md:w-4/5 lg:w-3/4 h-full bg-white shadow-xl overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-gray-900">
  <span className="font-bold">Loan Configuration</span> 
  <span className="text-base font-normal text-gray-600 ml-2">
    (Used to establish buyer qualification and pre-approval letters)
  </span>
</h2>
<button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Use ProgramGuidelinesProvider to share guidelines across components */}
          <ProgramGuidelinesProvider
            loanPrograms={loanPrograms}
            initialGuidelines={loan?.loanParameters?.programGuidelines || {}}
          >
            {/* Use ParametersProvider to manage state and calculations */}
            <ParametersProvider
              loan={loan}
              selectedProgram={selectedProgram}
              initialCalculations={initialCalculations}
              loadingStates={loadingStates}
            >
              {({
                localParams,
                setLocalParams,
                toggleStates,
                setToggleStates,
                calculations,
                handleInputChange,
                handleToggleChange,
                loadingStates
              }) => {
                // Store setLocalParams in ref for access in handleProgramChange
                // localParamsRef.current = setLocalParams;

                return (
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
                      loanRates={loanRates}
                      loadingStates={loadingStates}
                      updateLoadingState={updateLoadingState}
                    />

                    {/* Handle program-specific guidelines */}
                    <ProgramGuidelinesManager
                      localParams={localParams}
                      setLocalParams={setLocalParams}
                      selectedProgram={selectedProgram}
                      loanPrograms={loanPrograms}
                      loanRates={loanRates}
                    />

                    {/* Auto-save changes */}
                    <AutoSaveHandler
                      loan={loan}
                      localParams={localParams}
                      calculations={calculations}
                      toggleStates={toggleStates}
                      selectedProgram={selectedProgram}
                      updateLoadingState={updateLoadingState}
                    />

                    {/* Show saving indicator when needed */}
                    {loadingStates.isSaving && <SavingIndicator />}

                    {/* Calculation Status Section */}
                    {loadingStates.isLoadingCalculations ? (
                      <CalculationStatusSkeleton />
                    ) : (
                      <CalculationStatusCard
                        isQualified={calculations.isQualified}
                      />
                    )}

                    {/* Payment Breakdown Section */}
                    {loadingStates.isLoadingCalculations ? (
                      <PaymentBreakdownSkeleton />
                    ) : (
                      <PaymentBreakdown calculations={calculations} />
                    )}

                    {/* Financial Summary Cards */}
                    {loadingStates.isLoadingDetails ? (
                      <FinancialSummarySkeleton />
                    ) : (
                      <FinancialSummaryCards
                        income={localParams.income}
                        debts={localParams.debts}
                        assets={localParams.assets}
                      />
                    )}

                    {/* Two-column layout for Loan Details and Program Guidelines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Loan Details Column */}
                      <div>
                        {loadingStates.isLoadingDetails ? (
                          <LoanDetailsSkeleton />
                        ) : (
                          <LoanDetailsSection
                            localParams={localParams}
                            toggleStates={toggleStates}
                            handleInputChange={handleInputChange}
                            handleToggleChange={handleToggleChange}
                          />
                        )}
                      </div>

                      {/* Program Guidelines Column */}
                      <div>
                        {loadingStates.isLoadingDetails ? (
                          <ProgramGuidelinesSkeleton />
                        ) : (
                          <ProgramGuidelinesSection
                            localParams={localParams}
                            loanPrograms={loanPrograms}
                            selectedProgram={selectedProgram}
                            handleInputChange={handleInputChange}
                            handleToggleChange={handleToggleChange}
                            toggleStates={toggleStates}
                            showFinanceFees={showFinanceFees}
                            setShowFinanceFees={setShowFinanceFees}
                            onProgramChange={handleProgramChange}
                          />
                        )}
                      </div>
                    </div>
                  </>
                );
              }}
            </ParametersProvider>
          </ProgramGuidelinesProvider>
        </div>
      </div>
    </div>
  );
};

export default LoanParametersModal;
