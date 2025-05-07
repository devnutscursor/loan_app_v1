import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import LoanParametersModal from './LoanParametersModal';
import { fetchAPI } from '@/utils/api';

const LoanQualificationCard = ({ loan, onUpdate }) => {
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

  // Calculate loan values whenever loan or selected program changes
  useEffect(() => {
    if (loan && selectedProgram) {
      calculateLoanValues();
    }
  }, [loan, selectedProgram, loanRates]);

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

  const calculateLoanValues = () => {
    // Get basic loan information
    const loanAmount = getLoanAmount();
    const interestRate = getInterestRate();
    const loanTerm = selectedProgram?.loanTerm || 30;
    const minDownPaymentPercent = getMinDownPaymentPercent();
    
    // Calculate down payment amounts
    let downPaymentPercent = 0;
    let downPayment = 0;
    
    if (loan?.loanDetails?.downPayment) {
      downPayment = loan.loanDetails.downPayment;
      downPaymentPercent = (downPayment / loanAmount) * 100;
    } else {
      downPaymentPercent = minDownPaymentPercent;
      downPayment = (loanAmount * downPaymentPercent) / 100;
    }
    
    // Calculate Principal & Interest (P&I)
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTerm * 12;
    let principal = loanAmount - downPayment;
    
    // Monthly payment formula: P*(r*(1+r)^n)/((1+r)^n-1)
    let principalAndInterest = 0;
    if (monthlyRate > 0 && totalPayments > 0 && principal > 0) {
      principalAndInterest = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
    
    // Calculate taxes, insurance, and HOA
    const taxes = loan?.loanDetails?.propertyTaxes || 0;
    const insurance = loan?.loanDetails?.homeownersInsurance || 0;
    const hoa = loan?.loanDetails?.hoaFees || 0;
    
    // Calculate mortgage insurance
    const mortgageInsurance = calculateMortgageInsurance(principal, downPaymentPercent);
    
    // Calculate total monthly payment
    const monthlyPayment = principalAndInterest + taxes + insurance + mortgageInsurance + hoa;
    
    // Calculate DTI (Debt-to-Income ratio)
    const totalDebts = getTotalDebts();
    const totalIncome = getTotalIncome();
    let dti = 0;
    
    if (totalIncome > 0) {
      dti = ((totalDebts + monthlyPayment) / totalIncome) * 100;
    }
    
    // Check if loan qualifies based on DTI limit
    const dtiLimit = selectedProgram?.restrictions?.dtiRestriction?.max || 43;
    const isQualified = dti <= dtiLimit;
    
    setCalculations({
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
      programName: selectedProgram?.displayName || 'Conventional',
      interestRate
    });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
