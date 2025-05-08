import { useState, useCallback, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import { useAllProgramGuidelines } from './ProgramGuidelinesProvider';

/**
 * AutoSaveHandler component 
 * Manages the auto-saving functionality for loan parameters
 */
const AutoSaveHandler = ({ 
  loan, 
  localParams, 
  calculations, 
  toggleStates, 
  selectedProgram
}) => {
  // Get access to all program guidelines
  const { allProgramGuidelines } = useAllProgramGuidelines();
  // Store the last saved parameters to compare with current values
  const [lastSavedParams, setLastSavedParams] = useState(null);
  
  const autoSaveChanges = useCallback(async () => {
    try {
      // Skip auto-save during initialization
      if (!loan?._id || !localParams.loanAmount) return;
      
      // Check if there are actual changes since last save
      if (lastSavedParams) {
        // Deep comparison helper function to check if values are different
        const isDifferent = (obj1, obj2, keys) => {
          return keys.some(key => {
            // Handle case when both are numbers - check if numeric difference is significant
            if (typeof obj1[key] === 'number' && typeof obj2[key] === 'number') {
              // Only consider changes larger than 0.01 (avoid floating point precision issues)
              return Math.abs(obj1[key] - obj2[key]) > 0.01;
            }
            return obj1[key] !== obj2[key];
          });
        };
        
        // Get important parameter keys to compare
        const paramKeys = [
          'loanAmount', 'downPayment', 'downPaymentPercent', 'interestRate', 'loanTerm',
          'dtiMax', 'downPaymentMin', 'downPaymentMax', 'loanAmountMin', 'loanAmountMax',
          'upfrontMIP', 'annualMIP', 'originationFees', 'closingCosts', 'otherFees'
        ];
        const calcKeys = ['monthlyPayment', 'principalAndInterest', 'dti'];
        
        // Only save if important values have changed
        const hasParamChanges = isDifferent(lastSavedParams.params, localParams, paramKeys);
        const hasCalcChanges = isDifferent(lastSavedParams.calculations, calculations, calcKeys);
        
        // Skip save if nothing significant changed
        if (!hasParamChanges && !hasCalcChanges) {
          console.log('[DEBUG] Skipping auto-save - no significant changes detected');
          return;
        }
        
        console.log('[DEBUG] Changes detected - saving:', hasParamChanges ? 'parameter changes' : '', hasCalcChanges ? 'calculation changes' : '');
      }
      
      // Prepare parameters data for saving - these are loan-wide parameters, not program-specific
      const loanParameters = {
        loanAmount: localParams.loanAmount,
        downPayment: localParams.downPayment,
        downPaymentPercent: localParams.downPaymentPercent,
        propertyTaxes: localParams.propertyTaxes,
        propertyTaxesUnit: toggleStates.propertyTaxes.isPercent ? 'percent' : 'dollar',
        propertyTaxesFrequency: toggleStates.propertyTaxes.isYearly ? 'yearly' : 'monthly',
        homeownersInsurance: localParams.homeownersInsurance,
        homeownersInsuranceUnit: toggleStates.homeownersInsurance.isPercent ? 'percent' : 'dollar',
        homeownersInsuranceFrequency: toggleStates.homeownersInsurance.isYearly ? 'yearly' : 'monthly',
        hoaFees: localParams.hoaFees,
        hoaFeesUnit: toggleStates.hoaFees.isPercent ? 'percent' : 'dollar',
        hoaFeesFrequency: toggleStates.hoaFees.isYearly ? 'yearly' : 'monthly',
        interestRate: localParams.interestRate,
        loanTerm: localParams.loanTerm,
        selectedProgramId: localParams.selectedProgramId,
        propertyType: localParams.propertyType,
        propertyUse: localParams.propertyUse,
        propertyValue: localParams.propertyValue,
        creditScore: localParams.creditScore,
        monthlyIncome: localParams.monthlyIncome,
        monthlyDebt: localParams.monthlyDebt,
        employmentStatus: localParams.employmentStatus
      };
      
      // Get the current program ID
      const currentProgramId = localParams.selectedProgramId;
      
      // Create program-specific guidelines for the current program to update in allProgramGuidelines
      // These are the values from the UI for the currently selected program
      const currentProgramGuidelines = {
        // Program guidelines fields
        dtiMax: localParams.dtiMax,
        downPaymentMin: localParams.downPaymentMin,
        downPaymentMax: localParams.downPaymentMax,
        loanAmountMin: localParams.loanAmountMin,
        loanAmountMax: localParams.loanAmountMax,
        upfrontMIP: localParams.upfrontMIP,
        annualMIP: localParams.annualMIP,
        originationFees: localParams.originationFees,
        closingCosts: localParams.closingCosts,
        otherFees: localParams.otherFees
      };
      
      // Save all program guidelines, updating the current program's values
      const programGuidelines = {
        ...allProgramGuidelines,
        [currentProgramId]: currentProgramGuidelines
      };
      
      console.log('[DEBUG] Preparing to save data. Parameters:', loanParameters);
      console.log('[DEBUG] Program-specific guidelines:', programGuidelines);
      console.log('[DEBUG] Calculations to save:', calculations);
      
      // Use updateLoan endpoint
      const response = await fetchAPI(`/loans/${loan._id}`, {
        method: 'PUT',
        body: {
          loanParameters,
          programGuidelines, // Send program-specific guidelines as a map
          loanCalculations: calculations
        }
      });
      
      console.log('[DEBUG] Server response:', response);
      
      // Store the parameters we just saved for future comparison
      setLastSavedParams({
        params: {...localParams},
        calculations: {...calculations}
      });
      
      console.log('Parameters and calculations auto-saved successfully');
    } catch (error) {
      console.error('[DEBUG] Error auto-saving parameters:', error);
    }
  }, [loan?._id, localParams, calculations, toggleStates]);
  
  // Auto-save whenever parameters or calculations change
  useEffect(() => {
    // Add a debounce delay to prevent too many API calls
    const debounceTimeout = setTimeout(() => {
      autoSaveChanges();
    }, 3000); // 3 second delay - increased to reduce API calls
    
    return () => clearTimeout(debounceTimeout);
  }, [localParams, calculations, autoSaveChanges]);

  return null; // This is a logic-only component, no UI
};

export default AutoSaveHandler;
