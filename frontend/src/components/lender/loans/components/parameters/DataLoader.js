import { useEffect, useState } from 'react';
import { fetchAPI } from '@/utils/api';
import { 
  getTotalIncome as calculateTotalIncome,
  getTotalDebts as calculateTotalDebts,
  getTotalAssets as calculateTotalAssets,
  getLoanAmount as getInitialLoanAmount,
  getInterestRate as getInitialInterestRate
} from '../../utils/LoanCalculationUtils';
import { useAllProgramGuidelines } from './ProgramGuidelinesProvider';

/**
 * DataLoader component
 * Handles loading loan parameters data and program-specific guidelines
 */
const DataLoader = ({ 
  loan, 
  loanId, 
  setLocalParams, 
  setToggleStates, 
  onProgramChange,
  selectedProgram,
  loanPrograms
}) => {
  // Get access to the shared program guidelines context
  const { setAllProgramGuidelines } = useAllProgramGuidelines();
  // Track whether we've initialized the program selection
  const [hasInitializedProgram, setHasInitializedProgram] = useState(false);

  // Fetch saved parameters when modal opens
  useEffect(() => {
    const fetchSavedParameters = async () => {
      try {
        if (!loanId) return;
        
        console.log('[DEBUG] Fetching loan parameters for loan ID:', loanId);
        
        const response = await fetchAPI(`/loans/${loanId}`, {
          method: 'GET'
        });
        
        if (response.status === 'success' && response.data) {
          const loanData = response.data;
          
          // Calculate financial values from the loan data
          const totalIncome = calculateTotalIncome(loanData.income);
          const totalDebts = calculateTotalDebts(loanData.debts);
          const totalAssets = calculateTotalAssets(loanData.assets);
          
          // If we have saved parameters, use them to initialize the local state
          if (loanData.loanParameters) {
            // Set toggles based on saved unit types
            const newToggleStates = {
              propertyTaxes: { 
                isPercent: loanData.loanParameters.propertyTaxesUnit === 'percent', 
                isYearly: loanData.loanParameters.propertyTaxesFrequency === 'yearly' 
              },
              homeownersInsurance: { 
                isPercent: loanData.loanParameters.homeownersInsuranceUnit === 'percent', 
                isYearly: loanData.loanParameters.homeownersInsuranceFrequency === 'yearly' 
              },
              hoaFees: { 
                isPercent: loanData.loanParameters.hoaFeesUnit === 'percent', 
                isYearly: loanData.loanParameters.hoaFeesFrequency === 'yearly' 
              }
            };
            setToggleStates(newToggleStates);

            // Get the selected program ID from saved parameters or use current
            const savedProgramId = loanData.loanParameters.selectedProgramId || '';
            
            // Only set the program selection during the initial load
            if (!hasInitializedProgram && savedProgramId && loanPrograms.some(p => p._id === savedProgramId)) {
              console.log('[DEBUG] Initial program selection:', savedProgramId);
              onProgramChange(savedProgramId);
              setHasInitializedProgram(true);
            }

            // Get program-specific guidelines if they exist (now from loanParameters.programGuidelines)
            const currentProgramId = savedProgramId || selectedProgram?._id;
            
            // Get all program guidelines from loanParameters if available
            const allProgramGuidelines = loanData.loanParameters?.programGuidelines || {};
            
            // Load all program guidelines into the shared context
            setAllProgramGuidelines(allProgramGuidelines);
            
            // Get guidelines for the current program
            const programGuidelines = allProgramGuidelines[currentProgramId] || {};

            console.log('[DEBUG] Loading program-specific guidelines for program:', currentProgramId, programGuidelines);

            // Set local parameters
            setLocalParams(prev => ({
              ...prev,
              // Basic loan parameters
              loanAmount: loanData.loanParameters.loanAmount || getInitialLoanAmount(loanData.loanDetails),
              downPayment: loanData.loanParameters.downPayment || loanData.loanDetails?.downPayment || 0,
              downPaymentPercent: loanData.loanParameters.downPaymentPercent || prev.downPaymentPercent,
              propertyTaxes: loanData.loanParameters.propertyTaxes || loanData.loanDetails?.propertyTaxes || 0,
              homeownersInsurance: loanData.loanParameters.homeownersInsurance || loanData.loanDetails?.homeownersInsurance || 0,
              hoaFees: loanData.loanParameters.hoaFees || loanData.loanDetails?.hoaFees || 0,
              selectedProgramId: savedProgramId || prev.selectedProgramId,
              interestRate: loanData.loanParameters.interestRate || prev.interestRate,
              loanTerm: loanData.loanParameters.loanTerm || prev.loanTerm,
              
              // Financial values
              income: totalIncome,
              debts: totalDebts,
              assets: totalAssets,

              // Program-specific guidelines from the program map or from the selected program
              dtiMax: programGuidelines?.dtiMax || selectedProgram?.restrictions?.dtiRestriction?.max || 43,
              downPaymentMin: programGuidelines?.downPaymentMin || selectedProgram?.restrictions?.downPaymentRestriction?.min || 3,
              downPaymentMax: programGuidelines?.downPaymentMax || selectedProgram?.restrictions?.downPaymentRestriction?.max || 100,
              loanAmountMin: programGuidelines?.loanAmountMin || selectedProgram?.restrictions?.loanAmountRestriction?.min || 0,
              loanAmountMax: programGuidelines?.loanAmountMax || selectedProgram?.restrictions?.loanAmountRestriction?.max || 0,
              
              // Mortgage Insurance fields
              upfrontMIP: programGuidelines?.upfrontMIP || selectedProgram?.fhaMortgageInsurance?.upfrontMIP || 1.75,
              annualMIP: programGuidelines?.annualMIP || selectedProgram?.fhaMortgageInsurance?.annualMIP || 0.85,
              fmiPercent: programGuidelines?.fmiPercent || 1,
              
              // Fee fields
              originationFees: programGuidelines?.originationFees || 0,
              closingCosts: programGuidelines?.closingCosts || 0,
              otherFees: programGuidelines?.otherFees || 0
            }));
          }

          console.log('[DEBUG] Loan parameters loaded successfully');
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching loan parameters:', error);
      }
    };

    fetchSavedParameters();
  }, [loanId, setLocalParams, setToggleStates, onProgramChange, loanPrograms, selectedProgram, hasInitializedProgram]);

  return null; // Logic-only component, no UI
};

export default DataLoader;
