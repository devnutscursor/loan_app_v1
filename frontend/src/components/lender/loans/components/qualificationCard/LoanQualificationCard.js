import React, { useState, useEffect, useRef } from "react";
import { Edit } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import { formatCurrency } from "./LoanQualificationUtils";
import DTICircleIndicator from "./DTICircleIndicator";
import PaymentInfoSection from "./PaymentInfoSection";
import LoanInfoSection from "./LoanInfoSection";
import LoadingSkeleton from "./LoadingSkeleton";
import { calculateDefaultLoanValues } from "./LoanQualificationUtils";
import LoanParametersModal from "../../LoanParametersModal";

// Import calculation utilities from the modal's dependencies
import {
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets,
} from "../../utils/LoanCalculationUtils";

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
    baseRate: 0,
    rateAdjustment: 0,
    loanTerm: 30,
  });

  // Initial data loading effect - fetch programs and rates
  useEffect(() => {
    const initializeCard = async () => {
      if (!loan?._id) return;

      setIsLoading(true);

      try {
        // Fetch all data in parallel for maximum speed
        const [programsResponse, ratesResponse, loanResponse] = await Promise.all([
          fetchAPI("/loan-programs"),
          fetchAPI("/loan-rates"),
          fetchAPI(`/loans/${loan._id}`)
        ]);

        // Set programs and rates immediately
        if (programsResponse.status === "success") {
          setLoanPrograms(programsResponse.data);
        }
        if (ratesResponse.status === "success") {
          setLoanRates(ratesResponse.data);
        }

        if (loanResponse.status !== "success" || !loanResponse.data) {
          throw new Error("Failed to fetch loan data");
        }

        const loanData = loanResponse.data;
        const programs = programsResponse.data || [];
        const rates = ratesResponse.data || [];

        // Check if we have valid calculations
        const hasValidCalcs = loanData.loanCalculations && 
                             loanData.loanCalculations.monthlyPayment > 0 && 
                             loanData.loanCalculations.dti > 0;

        if (hasValidCalcs) {
          // Use existing calculations immediately
          console.log('[LoanQualificationCard] Using existing calculations');
          displayCalculationsSync(loanData, programs);
        } else {
          // Calculate quickly with the data we already have
          console.log('[LoanQualificationCard] Fast calculating...');
          await fastCalculateAndSave(loanData, programs, rates);
        }
      } catch (error) {
        console.error("Error initializing card:", error);
        setIsLoading(false);
      }
    };

    initializeCard();
  }, [loan?._id]); // Only depend on loan ID

  // NEW: Add a dedicated effect to watch for income and debt changes and recalculate
  useEffect(() => {
    // Skip if not initialized yet or modal is open (modal handles its own calculations)
    if (!loan?._id || isLoading || isModalOpen || !loanPrograms.length || !loanRates.length) {
      return;
    }

    // Check if we have loan data with income/debts and the card is already initialized
    if (loan.income || loan.debts) {
      console.log('[LoanQualificationCard] Income or debts changed, recalculating...');
      fastCalculateAndSave(loan, loanPrograms, loanRates);
    }
  }, [
    // Dependencies for income and debt recalculation
    loan?.income, 
    loan?.debts,
    // We need these references too
    loan?._id,
    isLoading,
    isModalOpen,
    loanPrograms,
    loanRates
  ]);

  // Synchronous display function for immediate rendering
  const displayCalculationsSync = (loanData, programs = loanPrograms) => {
    const calcs = loanData.loanCalculations;
    const params = loanData.loanParameters || {};
    
    // Update selected program and extract rate adjustment
    if (params.selectedProgramId && programs.length > 0) {
      const program = programs.find(p => p._id === params.selectedProgramId);
      if (program) {
        setSelectedProgram(program);
        console.log(`[LoanQualificationCard] Selected program: ${program.displayName}, Rate Adjustment: ${program.rateAdjustment || 0}%`);
        
        // If rate adjustment is not stored in params but exists in program, use program's value
        if (!params.rateAdjustment && program.rateAdjustment) {
          params.rateAdjustment = program.rateAdjustment;
          console.log(`[LoanQualificationCard] Applied missing rate adjustment from program: ${program.rateAdjustment}%`);
        }
      }
    }

    const interestRate = parseFloat(params.interestRate || 6.75);
    const baseRate = parseFloat(params.baseRate || interestRate);
    const rateAdjustment = parseFloat(params.rateAdjustment || 0);
    
    console.log(`[LoanQualificationCard] Display rates - Base: ${baseRate}%, Adjustment: ${rateAdjustment}%, Final: ${interestRate}%`);

    setCalculations({
      loanAmount: parseFloat(params.loanAmount || 0),
      downPayment: parseFloat(params.downPayment || 0),
      downPaymentPercent: parseFloat(params.downPaymentPercent || 0),
      monthlyPayment: parseFloat(calcs.monthlyPayment || 0),
      dti: parseFloat(calcs.dti || 0),
      principalAndInterest: parseFloat(calcs.principalAndInterest || 0),
      taxes: parseFloat(calcs.taxes || 0),
      insurance: parseFloat(calcs.insurance || 0),
      mortgageInsurance: parseFloat(calcs.mortgageInsurance || 0),
      hoa: parseFloat(calcs.hoa || 0),
      isQualified: calcs.isQualified === true || calcs.isQualified === "true",
      programName: programs.find(p => p._id === params.selectedProgramId)?.displayName || "Conventional",
      interestRate,
      baseRate,
      rateAdjustment,
      loanTerm: programs.find(p => p._id === params.selectedProgramId)?.loanTerm || 30,
    });

    setIsLoading(false);
    if (onUpdate) {
      onUpdate({
        ...loan,
        loanParameters: params,
        loanCalculations: calcs
      });
    }
  };

  // Ultra-fast calculation with minimal processing
  const fastCalculateAndSave = async (loanData, programs, rates) => {
    try {
      // Get loan amount from multiple possible sources
      const loanAmount = loanData.loanParameters?.loanAmount ||
                        loanData.loanDetails?.loanAmount || 
                        loanData.loanDetails?.purchasePrice || 
                        loanData.loanDetails?.requestedLoanAmount || 
                        loanData.property?.propertyValue || 400000;
      
      const downPayment = loanData.loanParameters?.downPayment || 
                         loanData.loanDetails?.downPayment || 
                         (loanAmount * 0.2);
      const downPaymentPercent = (downPayment / loanAmount) * 100;

      // Quick program selection
      const program = programs.find(p => p.programType === "conventional") || programs[0];
      if (program) setSelectedProgram(program);

      // Quick rate lookup with rate adjustment
      const programRate = rates.find(r => r.programType === program?.programType);
      const baseRate = programRate?.rate || 6.75;
      const rateAdjustment = program?.rateAdjustment || 0;
      const effectiveInterestRate = baseRate + rateAdjustment; // Use for calculations
      const displayInterestRate = baseRate; // Use base rate for display

      console.log(`[LoanQualificationCard] Rate calculation - Base: ${baseRate}%, Adjustment: ${rateAdjustment}%, Effective: ${effectiveInterestRate}%, Display: ${displayInterestRate}%`);

      // PROPERLY EXTRACT REAL INCOME AND DEBT DATA
      let totalIncome = 0;
      let totalDebts = 0;

      // Extract income from loan data - check multiple sources
      if (loanData.income && Array.isArray(loanData.income) && loanData.income.length > 0) {
        console.log('[LoanQualificationCard] Extracting income from loan.income array:', loanData.income);
        totalIncome = loanData.income.reduce((total, incomeItem) => {
          const amount = parseFloat(incomeItem.amount || incomeItem.monthlyAmount || incomeItem.grossAmount || 0);
          const frequency = (incomeItem.frequency || incomeItem.payFrequency || 'monthly').toLowerCase();
          
          // Convert to monthly - handle all possible frequency values
          let monthlyAmount = amount;
          if (frequency.includes('year') || frequency.includes('annual')) {
            monthlyAmount = amount / 12;
          } else if (frequency.includes('week') && !frequency.includes('biweek')) {
            monthlyAmount = amount * 4.33;
          } else if (frequency.includes('biweek') || frequency.includes('bi-week')) {
            monthlyAmount = amount * 2.17;
          } else if (frequency.includes('hour')) {
            // Assume 40 hours/week, 4.33 weeks/month
            monthlyAmount = amount * 40 * 4.33;
          }
          
          return total + monthlyAmount;
        }, 0);
      }

      // Extract debts from loan data - check multiple sources
      if (loanData.debts && Array.isArray(loanData.debts) && loanData.debts.length > 0) {
        console.log('[LoanQualificationCard] Extracting debts from loan.debts array:', loanData.debts);
        totalDebts = loanData.debts.reduce((total, debtItem) => {
          const monthlyPayment = parseFloat(debtItem.monthlyPayment || debtItem.amount || debtItem.payment || 0);
          return total + monthlyPayment;
        }, 0);
      }

      // Try alternative sources if arrays are empty or don't exist
      if (totalIncome === 0) {
        console.log('[LoanQualificationCard] Trying alternative income sources...');
        totalIncome = parseFloat(loanData.loanCalculations?.monthlyIncome || 0) ||
                     parseFloat(loanData.borrowerDetails?.monthlyIncome || 0) ||
                     parseFloat(loanData.borrower?.monthlyIncome || 0) ||
                     parseFloat(loanData.personalInfo?.monthlyIncome || 0) ||
                     parseFloat(loanData.financialInfo?.monthlyIncome || 0);
        
        // Try to extract from employment data
        if (totalIncome === 0 && loanData.employment && Array.isArray(loanData.employment)) {
          totalIncome = loanData.employment.reduce((total, job) => {
            const salary = parseFloat(job.annualSalary || job.monthlySalary || job.baseSalary || 0);
            const monthlyAmount = job.annualSalary ? salary / 12 : salary;
            return total + monthlyAmount;
          }, 0);
        }

        // Try extracting from nested borrower structures
        if (totalIncome === 0 && loanData.borrowers && Array.isArray(loanData.borrowers)) {
          totalIncome = loanData.borrowers.reduce((total, borrower) => {
            const income = parseFloat(borrower.monthlyIncome || borrower.annualIncome / 12 || 0);
            return total + income;
          }, 0);
        }
      }

      if (totalDebts === 0) {
        console.log('[LoanQualificationCard] Trying alternative debt sources...');
        totalDebts = parseFloat(loanData.loanCalculations?.monthlyDebt || 0) ||
                    parseFloat(loanData.borrowerDetails?.monthlyDebt || 0) ||
                    parseFloat(loanData.borrower?.monthlyDebt || 0) ||
                    parseFloat(loanData.personalInfo?.monthlyDebt || 0) ||
                    parseFloat(loanData.financialInfo?.monthlyDebt || 0) ||
                    parseFloat(loanData.financialInfo?.totalMonthlyDebts || 0);

        // Try extracting from nested borrower structures
        if (totalDebts === 0 && loanData.borrowers && Array.isArray(loanData.borrowers)) {
          totalDebts = loanData.borrowers.reduce((total, borrower) => {
            const debts = parseFloat(borrower.monthlyDebt || borrower.totalMonthlyDebts || 0);
            return total + debts;
          }, 0);
        }
      }

      // Use the utility functions as a fallback
      if (totalIncome === 0) {
        try {
          totalIncome = calculateTotalIncome(loanData.income) || 0;
        } catch (e) {
          console.log("calculateTotalIncome failed:", e);
        }
      }

      if (totalDebts === 0) {
        try {
          totalDebts = calculateTotalDebts(loanData.debts) || 0;
        } catch (e) {
          console.log("calculateTotalDebts failed:", e);
        }
      }

      console.log(`[LoanQualificationCard] Final extracted values - Income: ${totalIncome}, Debts: ${totalDebts}`);

      // Validate data quality for DTI calculation
      let dtiDataQuality = 'good';
      if (totalIncome === 0) {
        console.warn('[LoanQualificationCard] No income data found - DTI calculation will be invalid');
        totalIncome = 0.01; // Tiny amount to avoid division by zero, DTI will be very high
        dtiDataQuality = 'no-income';
      } else if (totalIncome < 1000) {
        console.warn('[LoanQualificationCard] Very low income detected - DTI calculation may be unreliable');
        dtiDataQuality = 'low-income';
      }

      if (totalDebts === 0 && dtiDataQuality === 'good') {
        console.log('[LoanQualificationCard] No existing debts found - this is acceptable for DTI calculation');
      }

      // Ultra-fast loan calculations
      const principal = loanAmount - downPayment;
      const monthlyRate = effectiveInterestRate / 100 / 12; // Use effective rate for calculations
      const payments = (program?.loanTerm || 30) * 12;
      
      const principalAndInterest = monthlyRate > 0 ? 
        principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1) :
        principal / payments;

      // Use reasonable defaults for speed
      const taxes = Math.max(300, loanAmount * 0.012 / 12); // 1.2% annually
      const insurance = Math.max(100, loanAmount * 0.004 / 12); // 0.4% annually
      const mortgageInsurance = downPaymentPercent < 20 ? (principal * 0.005) / 12 : 0;
      const hoa = 0;

      const monthlyPayment = principalAndInterest + taxes + insurance + mortgageInsurance + hoa;
      const dti = totalIncome > 0 ? ((totalDebts + monthlyPayment) / totalIncome) * 100 : 999;
      const isQualified = dti <= 43 && dtiDataQuality === 'good';

      console.log(`[LoanQualificationCard] Calculated DTI: ${dti.toFixed(2)}%, Qualified: ${isQualified}, Data Quality: ${dtiDataQuality}`);

      // Create simplified data objects
      const loanParameters = {
        loanAmount,
        downPayment,
        downPaymentPercent,
        propertyTaxes: taxes * 12,
        homeownersInsurance: insurance * 12,
        hoaFees: 0,
        interestRate: displayInterestRate, // Store base rate for display
        baseRate, // Include base rate for reference
        rateAdjustment, // Include rate adjustment for modal
        loanTerm: program?.loanTerm || 30,
        selectedProgramId: program?._id,
        propertyTaxesUnit: 'dollar',
        propertyTaxesFrequency: 'yearly',
        homeownersInsuranceUnit: 'dollar',
        homeownersInsuranceFrequency: 'yearly',
        hoaFeesUnit: 'dollar',
        hoaFeesFrequency: 'monthly'
      };

      const loanCalculations = {
        loanAmount,
        downPayment,
        downPaymentPercent,
        monthlyPayment,
        dti,
        principalAndInterest,
        taxes,
        insurance,
        mortgageInsurance,
        hoa,
        isQualified,
        monthlyIncome: totalIncome,
        monthlyDebt: totalDebts,
        dtiDataQuality, // Track data quality for debugging
        calculatedAt: new Date().toISOString()
      };

      // Display immediately, save in background
      displayCalculationsSync({
        ...loanData,
        loanParameters,
        loanCalculations
      }, programs);

      // Save to database asynchronously (don't wait for it)
      fetchAPI(`/loans/${loanData._id}`, {
        method: 'PUT',
        body: { loanParameters, loanCalculations }
      }).catch(err => console.error("Background save failed:", err));

    } catch (error) {
      console.error("Error in fast calculation:", error);
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  
  const handleCloseModal = async () => {
    setIsModalOpen(false);
    // Quick refresh after modal close
    if (loan?._id) {
      try {
        const response = await fetchAPI(`/loans/${loan._id}`);
        if (response.status === "success" && response.data) {
          displayCalculationsSync(response.data);
        }
      } catch (error) {
        console.error("Error refreshing after modal close:", error);
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
