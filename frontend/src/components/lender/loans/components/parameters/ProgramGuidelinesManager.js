import React, { useEffect, useRef } from 'react';
import { useAllProgramGuidelines } from './ProgramGuidelinesProvider';

/**
 * ProgramGuidelinesManager component
 * Handles program selection and loading of program-specific guidelines
 */
const ProgramGuidelinesManager = ({
  localParams,
  setLocalParams,
  selectedProgram,
  loanPrograms,
  loanRates = [] // Add loanRates as a prop with default empty array
}) => {
  // Use the shared program guidelines context
  const { allProgramGuidelines, updateProgramGuidelines } = useAllProgramGuidelines();

  // Track previous program ID to prevent unnecessary updates
  const previousProgramIdRef = useRef(null);

  // Handle program change to load program-specific guidelines
  useEffect(() => {
    // Skip if no program is selected
    if (!selectedProgram || !selectedProgram._id) return;

    const programId = selectedProgram._id;
    
    // Prevent infinite update loops by checking if the program has actually changed
    // Only update if the program ID is different from what we previously processed
    if (previousProgramIdRef.current === programId) {
      console.log('[DEBUG] Program already processed, skipping update');
      return;
    }
    
    console.log('[DEBUG] Program changed, loading program-specific guidelines for:', selectedProgram.displayName);

    // Save current program guidelines for the previous program before switching
    if (localParams.selectedProgramId && localParams.selectedProgramId !== programId) {
      const currentGuidelines = {
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
      
      // Update the guidelines for the previous program in the shared context
      updateProgramGuidelines(localParams.selectedProgramId, currentGuidelines);
    }

    // Get guidelines for the newly selected program from the shared context
    const programGuidelines = allProgramGuidelines[programId] || {
      dtiMax: selectedProgram?.restrictions?.dtiRestriction?.max || 43,
      downPaymentMin: selectedProgram?.restrictions?.downPaymentRestriction?.min || 3,
      downPaymentMax: selectedProgram?.restrictions?.downPaymentRestriction?.max || 100,
      loanAmountMin: selectedProgram?.restrictions?.loanAmountRestriction?.min || 0,
      loanAmountMax: selectedProgram?.restrictions?.loanAmountRestriction?.max || 0,
      upfrontMIP: selectedProgram?.fhaMortgageInsurance?.upfrontMIP || 1.75,
      annualMIP: selectedProgram?.fhaMortgageInsurance?.annualMIP || 0.85,
      originationFees: selectedProgram?.originationFees?.value || 0,
      closingCosts: selectedProgram?.closingCosts?.value || 0,
      otherFees: selectedProgram?.otherFees?.value || 0
    };

    // Get interest rate for the selected program from loanRates
    let baseInterestRate = localParams.interestRate || 5.5; // Default if no match found
    let rateAdjustment = selectedProgram?.rateAdjustment || 0; // Get rate adjustment from program
    
    if (loanRates && loanRates.length > 0) {
      const programRate = loanRates.find(rate => 
        rate.programType === selectedProgram.programType
      );
      
      if (programRate) {
        console.log(`[DEBUG] Found base interest rate ${programRate.rate}% for program type ${selectedProgram.programType}`);
        console.log(`[DEBUG] Program rate adjustment: ${rateAdjustment}%`);
        baseInterestRate = programRate.rate; // Store base rate separately
        console.log(`[DEBUG] Base interest rate: ${baseInterestRate}%, Rate adjustment: ${rateAdjustment}%`);
      } else {
        console.log(`[DEBUG] No matching interest rate found for program type ${selectedProgram.programType}`);
      }
    }

    // Only update if the program has actually changed to prevent loops
    if (localParams.selectedProgramId !== programId) {
      const newParams = {
        ...localParams,
        selectedProgramId: programId,
        interestRate: baseInterestRate, // Set the BASE interest rate (not combined)
        rateAdjustment: rateAdjustment, // Set the rate adjustment from program
        dtiMax: programGuidelines.dtiMax,
        downPaymentMin: programGuidelines.downPaymentMin,
        downPaymentMax: programGuidelines.downPaymentMax,
        loanAmountMin: programGuidelines.loanAmountMin,
        loanAmountMax: programGuidelines.loanAmountMax,
        upfrontMIP: programGuidelines.upfrontMIP,
        annualMIP: programGuidelines.annualMIP,
        originationFees: programGuidelines.originationFees,
        closingCosts: programGuidelines.closingCosts,
        otherFees: programGuidelines.otherFees
      };
      
      // Force an immediate update of all parameters when program changes
      console.log('[DEBUG] Updating parameters with program guidelines for:', selectedProgram.displayName);
      console.log('[DEBUG] Setting BASE interest rate to:', baseInterestRate, '% based on program type:', selectedProgram.programType);
      console.log('[DEBUG] Setting rate adjustment to:', rateAdjustment, '%');
      setLocalParams(newParams);
      
      // Update the ref to the current program ID to prevent future unnecessary updates
      previousProgramIdRef.current = programId;
    }
  }, [selectedProgram, setLocalParams, allProgramGuidelines, updateProgramGuidelines, localParams]);

  // Track the previous guidelines values to avoid unnecessary updates
  const previousGuidelinesRef = useRef({});

  // Save program guidelines when their values change significantly
  useEffect(() => {
    if (!localParams.selectedProgramId) return;
    
    // Get the current program guidelines
    const currentGuidelines = {
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
    
    // Get the previous guidelines for this program
    const prevGuidelines = previousGuidelinesRef.current[localParams.selectedProgramId] || {};
    
    // Check if any value has changed significantly
    const hasChanged = Object.keys(currentGuidelines).some(
      key => Math.abs((currentGuidelines[key] || 0) - (prevGuidelines[key] || 0)) > 0.001
    );
    
    // Only update if values have changed
    if (hasChanged) {
      console.log('[DEBUG] Program guidelines have changed, updating shared context');
      updateProgramGuidelines(localParams.selectedProgramId, currentGuidelines);
      
      // Update the ref with current values
      previousGuidelinesRef.current = {
        ...previousGuidelinesRef.current,
        [localParams.selectedProgramId]: {...currentGuidelines}
      };
    }
  }, [
    localParams.selectedProgramId,
    localParams.dtiMax,
    localParams.downPaymentMin,
    localParams.downPaymentMax,
    localParams.loanAmountMin,
    localParams.loanAmountMax,
    localParams.upfrontMIP,
    localParams.annualMIP,
    localParams.originationFees,
    localParams.closingCosts,
    localParams.otherFees,
    updateProgramGuidelines
  ]);
  
  return null; // Logic-only component, no UI
};

export default ProgramGuidelinesManager;