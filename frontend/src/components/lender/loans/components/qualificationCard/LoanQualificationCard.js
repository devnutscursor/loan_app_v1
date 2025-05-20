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
    <div className="bg-white rounded-lg ">
      {/* <h2 className="text-xl font-bold text-gray-800 mb-1">Loan Qualification</h2> */}
      <p className="text-sm text-gray-500 mb-4">
        Qualification status based on loan programs
      </p>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${calculations.isQualified
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
              }`}
          >
            {calculations.isQualified ? "Qualified" : "Not Qualified"}
          </span>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition duration-150"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Parameters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* DTI Circle */}
        <DTICircleIndicator
          dti={calculations.dti}
          downPaymentPercent={calculations.downPaymentPercent}
          isQualified={calculations.isQualified}
        />

        <div className="space-y-2">
          <div>
            <div className="text-gray-500 text-sm">Monthly Payment</div>
            <div className="font-medium">
              {formatCurrency(calculations.monthlyPayment)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Down Payment</div>
            <div className="font-medium">
              {formatCurrency(calculations.downPayment)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Interest Rate</div>
            <div className="font-medium">
              {formatCurrency(calculations.interestRate)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-gray-500 text-sm">Loan Amount</div>
            <div className="font-medium">
              {formatCurrency(calculations.loanAmount)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Loan Program</div>
            <div className="font-medium">
              {calculations.programName || "Conventional"}
            </div>
          </div>
          {/* Add Loan Term */}
          <div>
            <div className="text-gray-500 text-sm">Loan Term</div>
            <div className="font-medium">
              {calculations.loanTerm} years
            </div>
          </div>
        </div>
      </div>

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
