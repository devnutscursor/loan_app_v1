import { useState, useCallback, useEffect, useRef } from 'react';
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
  selectedProgram,
  updateLoadingState // Add loading state setter
}) => {
  // Get access to all program guidelines
  const { allProgramGuidelines } = useAllProgramGuidelines();
  // Store the last saved parameters to compare with current values
  const [lastSavedParams, setLastSavedParams] = useState(null);
  
  const autoSaveChanges = useCallback(async () => {
    try {
      // Skip auto-save during initialization
      if (!loan?._id || !localParams.loanAmount) {
        // Make sure loading is turned off even if we skip auto-save
        // if (setIsLoading) setIsLoading(false);
        return;
      }
      
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
        
        // Get important parameter keys to compare - adding property taxes and related values
        const paramKeys = [
          'loanAmount', 'downPayment', 'downPaymentPercent', 'interestRate', 'rateAdjustment',
          'dtiMax', 'downPaymentMin', 'downPaymentMax', 'loanAmountMin', 'loanAmountMax',
          'upfrontMIP', 'annualMIP', 'originationFees', 'closingCosts', 'otherFees',
          'propertyTaxes', 'homeownersInsurance', 'hoaFees' // Explicitly check these fields
        ];
        const calcKeys = ['monthlyPayment', 'principalAndInterest', 'dti'];
        
        // Only save if important values have changed
        const hasParamChanges = isDifferent(lastSavedParams.params, localParams, paramKeys);
        const hasCalcChanges = isDifferent(lastSavedParams.calculations, calculations, calcKeys);
        
        // Also check for toggle state changes
        const hasToggleChanges = JSON.stringify(lastSavedParams.toggles) !== JSON.stringify(toggleStates);
        
        // Skip save if nothing significant changed
        if (!hasParamChanges && !hasCalcChanges && !hasToggleChanges) {
          console.log('[DEBUG] Skipping auto-save - no significant changes detected');
          return;
        }
        
        console.log('[DEBUG] Changes detected - saving:', 
          hasParamChanges ? 'parameter changes' : '', 
          hasCalcChanges ? 'calculation changes' : '',
          hasToggleChanges ? 'toggle changes' : '');
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
        rateAdjustment: localParams.rateAdjustment, // Add rate adjustment to saved parameters
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
      
      // Prepare program guidelines for saving - specifically for the selected program
      let programGuidelines = {};
      
      if (selectedProgram?._id) {
        const programId = selectedProgram._id;
        programGuidelines = {
          [programId]: {
            dtiMax: localParams.dtiMax || 0,
            downPaymentMin: localParams.downPaymentMin || 0,
            downPaymentMax: localParams.downPaymentMax || 0,
            loanAmountMin: localParams.loanAmountMin || 0,
            loanAmountMax: localParams.loanAmountMax || 0,
            upfrontMIP: localParams.upfrontMIP || 0,
            annualMIP: localParams.annualMIP || 0,
            
            // Fee values with their unit and frequency settings
            originationFees: localParams.originationFees || 0,
            originationFeesUnit: toggleStates.originationFees?.isPercent ? 'percent' : 'dollar',
            originationFeesFrequency: toggleStates.originationFees?.frequency || 'once',
            
            closingCosts: localParams.closingCosts || 0,
            closingCostsUnit: toggleStates.closingCosts?.isPercent ? 'percent' : 'dollar',
            closingCostsFrequency: toggleStates.closingCosts?.frequency || 'once',
            
            otherFees: localParams.otherFees || 0,
            otherFeesUnit: toggleStates.otherFees?.isPercent ? 'percent' : 'dollar',
            otherFeesFrequency: toggleStates.otherFees?.frequency || 'once'
          }
        };
        
        // Merge in any other program guidelines from state, ensuring they have unit and frequency fields
        for (const [otherId, guidelines] of Object.entries(allProgramGuidelines)) {
          if (otherId !== programId) {
            // Make sure the other program has unit and frequency fields
            programGuidelines[otherId] = {
              ...guidelines,
              // Add defaults for fee fields if they don't exist
              originationFeesUnit: guidelines.originationFeesUnit || 'dollar',
              originationFeesFrequency: guidelines.originationFeesFrequency || 'once',
              closingCostsUnit: guidelines.closingCostsUnit || 'dollar',
              closingCostsFrequency: guidelines.closingCostsFrequency || 'once',
              otherFeesUnit: guidelines.otherFeesUnit || 'dollar',
              otherFeesFrequency: guidelines.otherFeesFrequency || 'once'
            };
          }
        }
      }
      
      console.log('[DEBUG] Preparing to save data. Parameters:', loanParameters);
      // console.log('[DEBUG] Program-specific guidelines:', programGuidelines);
      // console.log('[DEBUG] Calculations to save:', calculations);
      // Show saving indicator
      updateLoadingState('isSaving', true);
      
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
        calculations: {...calculations},
        toggles: {...toggleStates}  // Also store toggle states for comparison
      });
      // Indicate save is complete
      setTimeout(() => {
        updateLoadingState('isSaving', false);
      }, 800);
      console.log('Parameters and calculations auto-saved successfully');
    } catch (error) {
      updateLoadingState('isSaving', false);
      console.error('[DEBUG] Error auto-saving parameters:', error);
    } finally {
      updateLoadingState('isSaving', false);
      
      // Reset the saving flag so future saves can proceed
      isSavingRef.current = false;
    }
  }, [loan?._id, localParams, calculations, toggleStates, updateLoadingState, selectedProgram, allProgramGuidelines]);
  
  // Track if we're currently in an auto-save operation
  const isSavingRef = useRef(false);
  
  // Track typingTimer for debouncing user input
  const typingTimerRef = useRef(null);
  
  // Function to check if there are actual changes compared to the last saved values
  const hasChanges = useCallback(() => {
    if (!lastSavedParams) return true; // First save
    
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
    
    // Get important parameter keys to compare - include property taxes and related fields
    const paramKeys = [
      'loanAmount', 'downPayment', 'downPaymentPercent', 'interestRate', 'loanTerm',
      'dtiMax', 'downPaymentMin', 'downPaymentMax', 'loanAmountMin', 'loanAmountMax',
      'upfrontMIP', 'annualMIP', 'originationFees', 'closingCosts', 'otherFees',
      'propertyTaxes', 'homeownersInsurance', 'hoaFees'  // Explicitly include these
    ];
    const calcKeys = ['monthlyPayment', 'principalAndInterest', 'dti'];
    
    // Also check toggle states
    const toggleStatesDifferent = JSON.stringify(lastSavedParams.toggles) !== JSON.stringify(toggleStates);
    
    // Check if there are changes
    const hasParamChanges = isDifferent(lastSavedParams.params, localParams, paramKeys);
    const hasCalcChanges = isDifferent(lastSavedParams.calculations, calculations, calcKeys);
    
    return hasParamChanges || hasCalcChanges || toggleStatesDifferent;
  }, [lastSavedParams, localParams, calculations, toggleStates]);
  
  // Auto-save whenever parameters or calculations change
  useEffect(() => {
    // Prevent auto-saving if we're missing required data
    if (!loan?._id || !localParams.loanAmount) {
      return;
    }
    
    // Clear previous timer when values change
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Set a new debounce timer - only after user stops typing
    typingTimerRef.current = setTimeout(() => {
      // Skip if nothing has changed or we're already saving
      if (!hasChanges() || isSavingRef.current) {
        return;
      }
      
      // Show loading indicator once typing has stopped
      // if (setIsLoading) setIsLoading(true);
      
      // Set saving flag to prevent duplicate calls
      isSavingRef.current = true;
      
      // Call the save function
      autoSaveChanges();
    }, 800); // Wait 800ms after user stops typing
    
    // Clean up the timer when component unmounts
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [loan?._id, localParams, calculations, toggleStates, autoSaveChanges, hasChanges]);

  // Return null since this is a behavior component with no UI
  return null;
};

export default AutoSaveHandler;
