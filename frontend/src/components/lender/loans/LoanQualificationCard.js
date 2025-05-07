import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import LoanParametersModal from './LoanParametersModal';
import { fetchAPI } from '@/utils/api';

const LoanQualificationCard = ({ loan, onUpdate, enablePolling = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loanPrograms, setLoanPrograms] = useState([]);
  const [loanRates, setLoanRates] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
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
    programName: 'Conventional',
    interestRate: 0
  });

  // Fetch loan programs and rates on mount
  useEffect(() => {
    const fetchProgramsAndRates = async () => {
      try {
        const programsResponse = await fetchAPI('/loan-programs');
        const ratesResponse = await fetchAPI('/loan-rates');
        
        if (programsResponse.status === 'success' && ratesResponse.status === 'success') {
          setLoanPrograms(programsResponse.data);
          setLoanRates(ratesResponse.data);
          
          // Find the default program (conventional)
          const defaultProgram = programsResponse.data.find(p => 
            p.programType === 'conventional' || p.isDefaultForIntegrations
          );
          
          if (defaultProgram) {
            setSelectedProgram(defaultProgram);
          }
        }
      } catch (error) {
        console.error('Error fetching loan programs and rates:', error);
      }
    };
    
    fetchProgramsAndRates();
  }, []);

  // Fetch the latest loan data from the server periodically
  useEffect(() => {
    // Initial calculation
    if (loan && selectedProgram) {
      calculateLoanValues();
    }
    
    // Only set up polling if explicitly enabled
    if (!enablePolling) {
      console.log('[DEBUG] Polling disabled for this component instance');
      return; // Exit early - no polling
    }
    
    // Set up polling to refresh loan data
    const pollInterval = setInterval(async () => {
      // Skip polling if modal is open to avoid excessive API calls
      if (loan?._id && !isModalOpen) {
        try {
          console.log('[DEBUG] Polling for loan updates');
          const response = await fetchAPI(`/loans/${loan._id}`);
          
          if (response.status === 'success' && response.data) {
            // If we have loan parameters saved in the database, use them
            if (response.data.loanParameters || response.data.loanCalculations) {
              // Compare the data to see if it's actually changed before updating
              const currentParamsStr = JSON.stringify(loan.loanParameters || {});
              const newParamsStr = JSON.stringify(response.data.loanParameters || {});
              const currentCalcsStr = JSON.stringify(loan.loanCalculations || {});
              const newCalcsStr = JSON.stringify(response.data.loanCalculations || {});
              
              // Only update if the data has actually changed
              if (currentParamsStr !== newParamsStr || currentCalcsStr !== newCalcsStr) {
                console.log('[DEBUG] Detected changes in loan data, updating...');
                
                // Update the loan object with the latest data
                const updatedLoan = {
                  ...loan,
                  loanParameters: response.data.loanParameters || {},
                  loanCalculations: response.data.loanCalculations || {}
                };
                
                // Calculate new values based on updated data
                calculateLoanValues(updatedLoan);
                
                // If onUpdate is provided, call it with the updated loan
                if (onUpdate) {
                  onUpdate(updatedLoan);
                }
              } else {
                console.log('[DEBUG] No changes detected in poll data, skipping update');
              }
            }
          }
        } catch (error) {
          console.error('Error polling for loan updates:', error);
        }
      }
    }, 10000); // Poll every 10 seconds - increased to reduce API load
    
    return () => clearInterval(pollInterval); // Clean up on unmount
  }, [loan?._id, selectedProgram, loanRates]);

  const getLoanAmount = () => {
    if (!loan?.loanDetails) return 0;
    
    const { loanType = 'Purchase' } = loan.loanDetails;
    
    if (loanType.toLowerCase() === 'purchase') {
      return loan.loanDetails.purchasePrice || 0;
    } else if (loanType.toLowerCase() === 'refinance') {
      return loan.loanDetails.requestedLoanAmount || 0;
    } else if (loanType.toLowerCase() === 'construction') {
      return loan.loanDetails.loanAmount || 0;
    }
    
    return 0;
  };

  const getInterestRate = () => {
    if (!selectedProgram || !loanRates.length) return 7.0; // Default fallback
    
    const programRate = loanRates.find(rate => 
      rate.programType === selectedProgram.programType
    );
    
    return programRate ? programRate.rate : 7.0;
  };

  const getMinDownPaymentPercent = () => {
    if (!selectedProgram?.restrictions?.downPaymentRestriction?.min) return 3;
    return selectedProgram.restrictions.downPaymentRestriction.min;
  };

  const getTotalIncome = () => {
    if (!loan?.income) return 0;
    
    let total = 0;
    const { baseIncome = 0, overtime = 0, commissions = 0, bonuses = 0, militaryEntitlements = 0 } = loan.income;
    
    total += parseFloat(baseIncome || 0);
    total += parseFloat(overtime || 0);
    total += parseFloat(commissions || 0);
    total += parseFloat(bonuses || 0);
    total += parseFloat(militaryEntitlements || 0);
    
    // Add other income if available
    if (loan.income.otherIncome && Array.isArray(loan.income.otherIncome)) {
      loan.income.otherIncome.forEach(income => {
        total += parseFloat(income.amount || 0);
      });
    }
    
    return total;
  };

  const getTotalDebts = () => {
    if (!loan?.debts || !Array.isArray(loan.debts)) return 0;
    
    return loan.debts.reduce((total, debt) => {
      return total + parseFloat(debt.monthlyPayment || 0);
    }, 0);
  };

  const calculateMortgageInsurance = (loanAmount, downPaymentPercent) => {
    if (!selectedProgram?.privateMortgageInsurance || !Array.isArray(selectedProgram.privateMortgageInsurance)) {
      return 0;
    }

    // Calculate LTV (Loan-to-Value) ratio
    const ltv = 100 - downPaymentPercent;
    
    // Find the applicable PMI rate based on LTV
    const pmiRate = selectedProgram.privateMortgageInsurance.find(
      pmi => ltv >= pmi.minLTV && ltv <= pmi.maxLTV
    );
    
    if (!pmiRate) {
      return 0; // No PMI if LTV is below 80% (or no matching range found)
    }
    
    // Calculate annual PMI amount and divide by 12 for monthly amount
    // PMI is calculated as annual rate * loan amount / 12
    return (pmiRate.rate / 100 * loanAmount) / 12;
  };

  const calculateLoanValues = (updatedLoan = null) => {
    // Use updatedLoan if provided, otherwise use the loan from props
    const currentLoan = updatedLoan || loan;
    
    // Check if we have saved loan parameters in the database
    const hasStoredParams = !!(currentLoan?.loanParameters);
    const hasStoredCalcs = !!(currentLoan?.loanCalculations);
    
    // Get basic loan information
    let loanAmount;
    if (hasStoredParams && currentLoan.loanParameters.loanAmount) {
      loanAmount = parseFloat(currentLoan.loanParameters.loanAmount);
    } else {
      loanAmount = getLoanAmount();
    }
    
    // Get interest rate from stored parameters or calculate it
    let interestRate;
    if (hasStoredParams && currentLoan.loanParameters.interestRate) {
      interestRate = parseFloat(currentLoan.loanParameters.interestRate);
    } else {
      interestRate = getInterestRate();
    }
    
    const minDownPaymentPercent = getMinDownPaymentPercent();
    
    // Calculate down payment - use stored value if available
    let downPaymentPercent;
    if (hasStoredParams && currentLoan.loanParameters.downPaymentPercent) {
      downPaymentPercent = parseFloat(currentLoan.loanParameters.downPaymentPercent);
    } else {
      downPaymentPercent = Math.max(minDownPaymentPercent, currentLoan?.loanDetails?.downPaymentPercent || 0);
    }
    
    let downPayment; 
    if (hasStoredParams && currentLoan.loanParameters.downPayment) {
      downPayment = parseFloat(currentLoan.loanParameters.downPayment);
    } else {
      downPayment = (loanAmount * (downPaymentPercent / 100));
    }
    
    // Get the loan term in years
    const loanTermYears = hasStoredParams && currentLoan.loanParameters.loanTerm
      ? parseFloat(currentLoan.loanParameters.loanTerm)
      : (currentLoan?.loanDetails?.loanTerm || 30);
    
    // Calculate total months
    const n = loanTermYears * 12; // Total number of months
    
    // If we have saved calculations, use those values instead of recalculating
    if (hasStoredCalcs && Object.keys(currentLoan.loanCalculations).length > 0) {
      const calcs = currentLoan.loanCalculations;
      
      // Update calculations state with stored values
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
        isQualified: calcs.isQualified === true || calcs.isQualified === 'true',
        programName: calcs.programName || selectedProgram?.displayName || 'Conventional',
        interestRate
      });
      
      return; // Exit early since we used stored calculations
    }
    
    // Otherwise, calculate all values
    // Calculate principal and interest payment (P&I)
    const r = interestRate / 100 / 12; // Monthly interest rate
    
    let principalAndInterest = 0;
    
    if (r > 0) {
      principalAndInterest = loanAmount * (1 - (downPaymentPercent / 100)) * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    
    // Get property taxes - use stored value if available
    let monthlyPropertyTaxes;
    if (hasStoredParams && currentLoan.loanParameters.propertyTaxes) {
      const propertyTaxes = parseFloat(currentLoan.loanParameters.propertyTaxes);
      const isPercent = currentLoan.loanParameters.propertyTaxesUnit === 'percent';
      const isYearly = currentLoan.loanParameters.propertyTaxesFrequency === 'yearly';
      
      if (isPercent) {
        // Convert percentage to dollar amount
        const yearlyPropertyTaxes = loanAmount * (propertyTaxes / 100);
        monthlyPropertyTaxes = isYearly ? yearlyPropertyTaxes / 12 : propertyTaxes;
      } else {
        // Already a dollar amount
        monthlyPropertyTaxes = isYearly ? propertyTaxes / 12 : propertyTaxes;
      }
    } else {
      // Use default calculation
      const yearlyPropertyTaxes = loanAmount * 0.015; // 1.5% is typical
      monthlyPropertyTaxes = yearlyPropertyTaxes / 12;
    }
    
    // Get homeowners insurance - use stored value if available
    let monthlyHomeownersInsurance;
    if (hasStoredParams && currentLoan.loanParameters.homeownersInsurance) {
      const insurance = parseFloat(currentLoan.loanParameters.homeownersInsurance);
      const isPercent = currentLoan.loanParameters.homeownersInsuranceUnit === 'percent';
      const isYearly = currentLoan.loanParameters.homeownersInsuranceFrequency === 'yearly';
      
      if (isPercent) {
        // Convert percentage to dollar amount
        const yearlyInsurance = loanAmount * (insurance / 100);
        monthlyHomeownersInsurance = isYearly ? yearlyInsurance / 12 : insurance;
      } else {
        // Already a dollar amount
        monthlyHomeownersInsurance = isYearly ? insurance / 12 : insurance;
      }
    } else {
      // Use default calculation
      const yearlyHomeownersInsurance = loanAmount * 0.0035; // 0.35% is typical
      monthlyHomeownersInsurance = yearlyHomeownersInsurance / 12;
    }
    
    // Get HOA fees - use stored value if available
    let monthlyHOA;
    if (hasStoredParams && currentLoan.loanParameters.hoaFees) {
      const hoaFees = parseFloat(currentLoan.loanParameters.hoaFees);
      const isPercent = currentLoan.loanParameters.hoaFeesUnit === 'percent';
      const isYearly = currentLoan.loanParameters.hoaFeesFrequency === 'yearly';
      
      if (isPercent) {
        // Convert percentage to dollar amount
        const yearlyHOA = loanAmount * (hoaFees / 100);
        monthlyHOA = isYearly ? yearlyHOA / 12 : hoaFees;
      } else {
        // Already a dollar amount
        monthlyHOA = isYearly ? hoaFees / 12 : hoaFees;
      }
    } else {
      // Use property data or default to 0
      monthlyHOA = currentLoan?.property?.hoaFees || 0;
    }
    
    // Calculate mortgage insurance based on loan-to-value ratio
    const mortgageInsurance = calculateMortgageInsurance(loanAmount, downPaymentPercent);
    
    // Calculate total monthly payment
    const totalMonthlyPayment = principalAndInterest + monthlyPropertyTaxes + 
      monthlyHomeownersInsurance + monthlyHOA + mortgageInsurance;
    
    // Calculate debt-to-income ratio (DTI)
    // Use stored income/debt values if available or calculate them
    let monthlyIncome, monthlyDebts;
    if (hasStoredParams) {
      monthlyIncome = currentLoan.loanParameters.monthlyIncome || (getTotalIncome() / 12);
      monthlyDebts = currentLoan.loanParameters.monthlyDebt || getTotalDebts();
    } else {
      monthlyIncome = getTotalIncome() / 12;
      monthlyDebts = getTotalDebts();
    }
    
    const dti = monthlyIncome > 0 ? ((totalMonthlyPayment + monthlyDebts) / monthlyIncome) * 100 : 0;
    
    // Check if the borrower qualifies based on DTI limits
    const dtiLimit = selectedProgram?.restrictions?.dtiRestriction?.max || 43;
    const isQualified = dti <= dtiLimit;
    
    // Update calculations state
    const newCalculations = {
      loanAmount,
      downPayment,
      downPaymentPercent,
      monthlyPayment: totalMonthlyPayment,
      dti,
      principalAndInterest,
      taxes: monthlyPropertyTaxes,
      insurance: monthlyHomeownersInsurance,
      mortgageInsurance,
      hoa: monthlyHOA,
      isQualified,
      programName: selectedProgram?.displayName || 'Conventional',
      interestRate
    };
    
    console.log('[DEBUG] Setting new calculations:', newCalculations);
    setCalculations(newCalculations);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    
    // Fetch latest loan data after closing the modal
    if (loan?._id) {
      try {
        console.log('[DEBUG] Fetching latest loan data after modal close');
        const response = await fetchAPI(`/loans/${loan._id}`);
        
        if (response.status === 'success' && response.data) {
          // Calculate new values based on the fetched data
          const updatedLoan = {
            ...loan,
            loanParameters: response.data.loanParameters || {},
            loanCalculations: response.data.loanCalculations || {}
          };
          
          // Update calculations with the new data
          calculateLoanValues(updatedLoan);
          
          // Call onUpdate with the updated loan
          if (onUpdate) {
            onUpdate(updatedLoan);
          }
        }
      } catch (error) {
        console.error('Error fetching loan data after modal close:', error);
      }
    }
  };

  const handleProgramChange = (programId) => {
    const program = loanPrograms.find(p => p._id === programId);
    if (program) {
      setSelectedProgram(program);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Loan Qualification</h2>
      <p className="text-sm text-gray-500 mb-4">Qualification status based on loan programs</p>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            calculations.isQualified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {calculations.isQualified ? 'Qualified' : 'Not Qualified'}
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
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#f3f4f6" 
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={calculations.isQualified ? '#10b981' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={`${calculations.dti > 100 ? 283 : (calculations.dti * 2.83)} 283`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{calculations.dti.toFixed(0)}%</span>
              <span className="text-xs text-gray-500">DTI</span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="text-gray-500 text-sm">Down Payment</div>
            <div className="font-medium">{calculations.downPaymentPercent.toFixed(1)}%</div>
          </div>
        </div>
        
        {/* Payment Info */}
        <div className="space-y-2">
          <div>
            <div className="text-gray-500 text-sm">Monthly Payment</div>
            <div className="font-medium">{formatCurrency(calculations.monthlyPayment)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Down Payment</div>
            <div className="font-medium">{formatCurrency(calculations.downPayment)}</div>
          </div>
        </div>
        
        {/* Loan Info */}
        <div className="space-y-2">
          <div>
            <div className="text-gray-500 text-sm">Loan Amount</div>
            <div className="font-medium">{formatCurrency(calculations.loanAmount)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Loan Program</div>
            <div className="font-medium">{calculations.programName}</div>
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
