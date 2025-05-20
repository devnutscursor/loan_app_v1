import React, { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import { formatCurrency } from "./LoanQualificationUtils";

// Import sub-components
import DTICircleIndicator from "./DTICircleIndicator";
import PaymentInfoSection from "./PaymentInfoSection";
import LoanInfoSection from "./LoanInfoSection";
import LoadingSkeleton from "./LoadingSkeleton";

// Import utility functions
import { calculateDefaultLoanValues } from "./LoanQualificationUtils";

// Import the modal component
import LoanParametersModal from "../../LoanParametersModal";

/**
 * Loan Qualification Card component
 * Displays loan qualification status and key metrics
 */
const LoanQualificationCard = ({ loan, onUpdate, enablePolling = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loanPrograms, setLoanPrograms] = useState([]);
  const [loanRates, setLoanRates] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calculations, setCalculations] = useState({
    loanAmount: 0,
    downPayment: 0,
    downPaymentPercent: 0,
    monthlyPayment: 0,
    dti: 0,
    principalAndInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoa: 0,
    isQualified: false,
    programName: "Conventional",
    interestRate: 0,
    loanTerm: 30,
  });

  // Fetch loan programs and rates on component mount
  useEffect(() => {
    const fetchProgramsAndRates = async () => {
      try {
        setIsLoading(true); // Set loading state while fetching data
        const programsResponse = await fetchAPI("/loan-programs");
        const ratesResponse = await fetchAPI("/loan-rates");

        if (
          programsResponse.status === "success" &&
          ratesResponse.status === "success"
        ) {
          setLoanPrograms(programsResponse.data);
          setLoanRates(ratesResponse.data);

          // Find the default program (conventional)
          const defaultProgram = programsResponse.data.find(
            (p) =>
              p.programType === "conventional" || p.isDefaultForIntegrations
          );

          if (defaultProgram) {
            setSelectedProgram(defaultProgram);
          }
        }
      } catch (error) {
        console.error("Error fetching loan programs and rates:", error);
      }
      // Don't turn off loading state here - we'll wait until calculations are done
    };

    fetchProgramsAndRates();
  }, []);

  // Calculate loan values whenever loan or selected program changes
  useEffect(() => {
    if (loan && selectedProgram) {
      setIsLoading(true); // Set loading to true whenever loan or program changes
      calculateLoanValues();
    }
  }, [loan?._id, selectedProgram]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!enablePolling) {
      return; // Skip polling if not enabled
    }

    const pollInterval = setInterval(async () => {
      // Skip polling if modal is open or loan ID is missing
      if (!loan?._id || isModalOpen) return;

      try {
        const response = await fetchAPI(`/loans/${loan._id}`);

        if (response.status === "success" && response.data) {
          // Check if data has changed
          const currentParamsStr = JSON.stringify(loan.loanParameters || {});
          const newParamsStr = JSON.stringify(
            response.data.loanParameters || {}
          );
          const currentCalcsStr = JSON.stringify(loan.loanCalculations || {});
          const newCalcsStr = JSON.stringify(
            response.data.loanCalculations || {}
          );

          // Only update if data has changed
          if (
            currentParamsStr !== newParamsStr ||
            currentCalcsStr !== newCalcsStr
          ) {
            console.log("[DEBUG] Detected changes in loan data, updating...");

            const updatedLoan = {
              ...loan,
              loanParameters: response.data.loanParameters || {},
              loanCalculations: response.data.loanCalculations || {},
            };

            calculateLoanValues(updatedLoan);

            if (onUpdate) onUpdate(updatedLoan);
          }
        }
      } catch (error) {
        console.error("Error polling for loan updates:", error);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [loan?._id, enablePolling, isModalOpen]);

  /**
   * Calculate loan values based on loan data
   */
  const calculateLoanValues = (updatedLoan = null) => {
    // Use updatedLoan if provided, otherwise use the loan from props
    const currentLoan = updatedLoan || loan;

    // Check if we have saved loan parameters in the database
    const hasStoredParams = !!currentLoan?.loanParameters;
    const hasStoredCalcs = !!currentLoan?.loanCalculations;

    if (
      hasStoredCalcs &&
      Object.keys(currentLoan.loanCalculations).length > 0
    ) {
      // Use stored calculations
      const calcs = currentLoan.loanCalculations;
      const loanAmount = hasStoredParams
        ? parseFloat(currentLoan.loanParameters.loanAmount)
        : 0;
      const downPayment = hasStoredParams
        ? parseFloat(currentLoan.loanParameters.downPayment)
        : 0;
      const downPaymentPercent = hasStoredParams
        ? parseFloat(currentLoan.loanParameters.downPaymentPercent)
        : 0;
      const interestRate = hasStoredParams
        ? parseFloat(currentLoan.loanParameters.interestRate)
        : 0;

      // Update calculations with stored values
      setCalculations({
        loanAmount,
        downPayment,
        downPaymentPercent,
        monthlyPayment: parseFloat(calcs.monthlyPayment || 0),
        dti: parseFloat(calcs.dti || 0),
        principalAndInterest: parseFloat(calcs.principalAndInterest || 0),
        taxes: parseFloat(calcs.taxes || 0),
        insurance: parseFloat(calcs.insurance || 0),
        mortgageInsurance: parseFloat(calcs.mortgageInsurance || 0),
        hoa: parseFloat(calcs.hoa || 0),
        isQualified: calcs.isQualified === true || calcs.isQualified === "true",
        programName: loanPrograms.find(
          (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
        )?.displayName || "Conventional",
        interestRate,
        loanTerm: loanPrograms.find(
          (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
        )?.loanTerm || 30,
      });
    } else {
      // For new loans or loans without saved calculations,
      // calculate default values to show instead of zeros
      const defaultCalculations = calculateDefaultLoanValues(
        currentLoan,
        loanPrograms,
        selectedProgram
      );
      console.log(
        "[DEBUG] Using default calculated values for new loan:",
        defaultCalculations
      );
      setCalculations(defaultCalculations);
    }

    // Turn off loading state after calculations are complete
    // Small timeout to ensure smooth transition from skeleton to data
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);

    // Fetch latest loan data after closing the modal
    if (loan?._id) {
      try {
        const response = await fetchAPI(`/loans/${loan._id}`);

        if (response.status === "success" && response.data) {
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {},
          };

          // Update calculations with the new data
          calculateLoanValues(updatedLoan);

          if (onUpdate) onUpdate(updatedLoan);
        }
      } catch (error) {
        console.error("Error fetching loan data after modal close:", error);
      }
    }
  };

  const handleProgramChange = (programId) => {
    const program = loanPrograms.find((p) => p._id === programId);
    if (program) {
      setSelectedProgram(program);
    }
  };

  // If loading, render the skeleton component
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Otherwise render the card with actual data
  return (
    <div className="bg-white rounded-lg hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        {/* Header section with qualification status and action button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${
              calculations.isQualified ? "bg-green-500" : "bg-red-500"
            }`}></span>
            <span className="text-sm font-medium text-gray-700">
              {calculations.isQualified ? "Qualified" : "Not Qualified"}
            </span>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center text-sm px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Edit className="w-3 h-3 mr-1.5" />
            Edit
          </button>
        </div>
        
        {/* Main metrics section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {/* DTI Circle - takes full width on mobile, 1/3 on larger screens */}
          <div className="col-span-2 md:col-span-1 flex justify-center">
            <DTICircleIndicator
              dti={calculations.dti}
              downPaymentPercent={calculations.downPaymentPercent}
              isQualified={calculations.isQualified}
            />
          </div>
          
          {/* Key metrics in 2 columns */}
          <div>
            <div className="space-y-3">
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Monthly Payment</div>
                <div className="font-medium text-gray-900">{formatCurrency(calculations.monthlyPayment)}</div>
              </div>
              
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Interest Rate</div>
                <div className="font-medium text-gray-900">{calculations.interestRate}%</div>
              </div>
              
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Loan Term</div>
                <div className="font-medium text-gray-900">{calculations.loanTerm} years</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Loan Amount</div>
                <div className="font-medium text-gray-900">{formatCurrency(calculations.loanAmount)}</div>
              </div>
              
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Down Payment</div>
                <div className="font-medium text-gray-900">{formatCurrency(calculations.downPayment)} <span className="text-xs text-gray-400">({calculations.downPaymentPercent}%)</span></div>
              </div>
              
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Program</div>
                <div className="font-medium text-gray-900">{calculations.programName || "Conventional"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment breakdown - optional footer section */}
      <div className="bg-gray-50 px-5 py-3 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500">P&I:</span> <span className="font-medium">{formatCurrency(calculations.principalAndInterest)}</span>
            </div>
            <div>
              <span className="text-gray-500">Taxes:</span> <span className="font-medium">{formatCurrency(calculations.taxes)}</span>
            </div>
            <div>
              <span className="text-gray-500">Insurance:</span> <span className="font-medium">{formatCurrency(calculations.insurance)}</span>
            </div>
          </div>
          <div className="text-blue-600 cursor-pointer hover:underline" onClick={handleOpenModal}>
            Details
          </div>
        </div>
      </div>

      {/* Modal remains the same */}
      {isModalOpen && (
        <LoanParametersModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          loan={loan}
          loanPrograms={loanPrograms}
          loanRates={loanRates}
          selectedProgram={selectedProgram}
          calculations={calculations}
          onProgramChange={handleProgramChange}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default LoanQualificationCard;
