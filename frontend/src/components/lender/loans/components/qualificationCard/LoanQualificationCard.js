import React, { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import { formatCurrency } from "./LoanQualificationUtils";
import DTICircleIndicator from "./DTICircleIndicator";
import PaymentInfoSection from "./PaymentInfoSection";
import LoanInfoSection from "./LoanInfoSection";
import LoadingSkeleton from "./LoadingSkeleton";
import { calculateDefaultLoanValues } from "./LoanQualificationUtils";
import LoanParametersModal from "../../LoanParametersModal";

const LoanQualificationCard = ({ loan, onUpdate, enablePolling = false }) => {
  const [hasFetchedLoan, setHasFetchedLoan] = useState(false);
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

  useEffect(() => {
    const fetchProgramsAndRates = async () => {
      try {
        setIsLoading(true);
        const programsResponse = await fetchAPI("/loan-programs");
        const ratesResponse = await fetchAPI("/loan-rates");

        if (programsResponse.status === "success" && ratesResponse.status === "success") {
          setLoanPrograms(programsResponse.data);
          setLoanRates(ratesResponse.data);

          const defaultProgram = programsResponse.data.find(
            (p) => p.programType === "conventional" || p.isDefaultForIntegrations
          );

          if (defaultProgram) setSelectedProgram(defaultProgram);
        }
      } catch (error) {
        console.error("Error fetching loan programs and rates:", error);
      }
    };

    fetchProgramsAndRates();
  }, []);

  useEffect(() => {
    if (loan && selectedProgram && hasFetchedLoan) {
      setIsLoading(true);
      calculateLoanValues();
    }
  }, [loan?._id, selectedProgram, hasFetchedLoan]);

  useEffect(() => {
    if (!isLoading && loan?._id && selectedProgram) {
      const fetchFreshData = async () => {
        try {
          const response = await fetchAPI(`/loans/${loan._id}`);
          if (response.status === "success" && response.data) {
            const updatedLoan = {
              ...loan,
              loanParameters: response.data.loanParameters || {},
              loanCalculations: response.data.loanCalculations || {},
            };
            calculateLoanValues(updatedLoan);
          setHasFetchedLoan(true);
          if (onUpdate) onUpdate(updatedLoan);
          }
        } catch (error) {
          console.error("Error fetching fresh loan data:", error);
        }
      };

      fetchFreshData();
    }
  }, [isLoading]);

  // ✅ Initial fetch after all dependencies are ready
  useEffect(() => {
    const fetchInitialLoanData = async () => {
      if (!loan?._id || loanPrograms.length === 0 || loanRates.length === 0) return;

      try {
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {},
          };

          const programId = updatedLoan.loanParameters?.selectedProgramId;
          if (programId) {
            const matchedProgram = loanPrograms.find(p => p._id === programId);
            if (matchedProgram) setSelectedProgram(matchedProgram);
          }

          calculateLoanValues(updatedLoan);
          if (onUpdate) onUpdate(updatedLoan);
        }
      } catch (e) {
        console.error("Initial loan fetch failed", e);
      }
    };

    fetchInitialLoanData();
  }, [loan?._id, loanPrograms, loanRates]);

  useEffect(() => {
    if (!enablePolling) return;

    const pollInterval = setInterval(async () => {
      if (!loan?._id || isModalOpen) return;
      try {
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          const currentParamsStr = JSON.stringify(loan.loanParameters || {});
          const newParamsStr = JSON.stringify(response.data.loanParameters || {});
          const currentCalcsStr = JSON.stringify(loan.loanCalculations || {});
          const newCalcsStr = JSON.stringify(response.data.loanCalculations || {});

          if (currentParamsStr !== newParamsStr || currentCalcsStr !== newCalcsStr) {
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

  const calculateLoanValues = (updatedLoan = null) => {
    const currentLoan = updatedLoan || loan;
    const hasStoredParams = !!currentLoan?.loanParameters;
    const hasStoredCalcs = !!currentLoan?.loanCalculations;

    if (hasStoredCalcs && Object.keys(currentLoan.loanCalculations).length > 0) {
      const calcs = currentLoan.loanCalculations;
      const loanAmount = hasStoredParams ? parseFloat(currentLoan.loanParameters.loanAmount) : 0;
      const downPayment = hasStoredParams ? parseFloat(currentLoan.loanParameters.downPayment) : 0;
      const downPaymentPercent = hasStoredParams ? parseFloat(currentLoan.loanParameters.downPaymentPercent) : 0;

      let interestRate = hasStoredParams ? parseFloat(currentLoan.loanParameters.interestRate || 0) : 0;
      if (!interestRate || interestRate === 0) {
        const selectedProg = loanPrograms.find(
          (program) => program._id === currentLoan?.loanParameters?.selectedProgramId
        );
        if (selectedProg) {
          const programRate = loanRates.find(
            (rate) => rate.programType === selectedProg.programType
          );
          if (programRate && programRate.rate) {
            interestRate = programRate.rate;
            if (typeof selectedProg.rateAdjustment === 'number') {
              interestRate += selectedProg.rateAdjustment;
            }
          }
          else {
            switch (selectedProg.programType) {
              case 'conventional': interestRate = 6.75; break;
              case 'fha': interestRate = 6.5; break;
              case 'va': interestRate = 6.25; break;
              case 'usda': interestRate = 6.25; break;
              case 'jumbo': interestRate = 7.25; break;
              default: interestRate = 6.75;
            }
          }
        } else {
          interestRate = 6.75;
        }
      }

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
      const defaultCalculations = calculateDefaultLoanValues(currentLoan, loanPrograms, selectedProgram);
      setCalculations(defaultCalculations);
    }

    setTimeout(() => setIsLoading(false), 300);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = async () => {
    setIsModalOpen(false);
    if (loan?._id) {
      try {
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {},
          };
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
    if (program) setSelectedProgram(program);
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="bg-white rounded-lg hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="col-span-2 md:col-span-1 flex justify-center">
            <DTICircleIndicator
              dti={calculations.dti}
              downPaymentPercent={calculations.downPaymentPercent}
              isQualified={calculations.isQualified}
            />
          </div>

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
                <div className="font-medium text-gray-900">
                  {formatCurrency(calculations.downPayment)} <span className="text-xs text-gray-400">({calculations.downPaymentPercent}%)</span>
                </div>
              </div>
              <div className="group">
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Program</div>
                <div className="font-medium text-gray-900">{calculations.programName || "Conventional"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
