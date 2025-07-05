import { useState, useEffect, useCallback } from 'react';
import { 
  calculatePrincipalAndInterest,
  calculateMortgageInsurance,
  calculateVAFundingFee,
  calculateUSDAFees
} from '../../utils/LoanCalculationUtils';

/**
 * ParametersProvider component
 * Manages the loan parameters state and calculations
 */
const ParametersProvider = ({
  loan,
  selectedProgram,
  initialCalculations,
  loadingStates,
  children
}) => {
  // Initialize loan parameter state
  const [localParams, setLocalParams] = useState({
    loanAmount: 0,
    downPayment: 0,
    downPaymentPercent: 0,
    propertyTaxes: 0,
    homeownersInsurance: 0,
    hoaFees: 0,
    income: 0,
    debts: 0,
    assets: 0,
    selectedProgramId: '',
    interestRate: 0,
    rateAdjustment: 0, // Add rate adjustment field
    loanTerm: 30,
    dtiMax: 43,
    downPaymentMin: 3,
    downPaymentMax: 100,
    loanAmountMin: 0,
    loanAmountMax: 0,
    upfrontMIP: 1.75,
    annualMIP: 0.85,
    originationFees: 0,
    closingCosts: 0,
    otherFees: 0
  });

  // State for toggle unit values (dollar/percent, monthly/yearly)
  const [toggleStates, setToggleStates] = useState({
    propertyTaxes: { isPercent: false, isYearly: true },
    homeownersInsurance: { isPercent: false, isYearly: true },
    hoaFees: { isPercent: false, isYearly: false },
    // Add toggle states for fee fields in Program Guidelines section with matching property names as in ProgramGuidelinesSection
    originationFees: { isPercent: false, frequency: 'once' },
    closingCosts: { isPercent: false, frequency: 'once' },
    otherFees: { isPercent: false, frequency: 'once' }
  });
  
  // State for calculation results
  const [calculations, setCalculations] = useState({
    principalAndInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoa: 0,
    monthlyPayment: 0,
    dti: 0,
    isQualified: false
  });

  // Handle toggle changes for unit type ($ or %) and frequency (monthly or yearly, once)
  const handleToggleChange = (field, toggleType, newValue) => {
    // Make sure the field exists in toggleStates before proceeding
    if (!field || !toggleStates[field]) {
      console.error(`[ERROR] Toggle field '${field}' is not initialized in toggleStates`);
      return;
    }

    setToggleStates(prev => {
      // Handle two different formats:
      // 1. Two params: field, toggleType - traditional toggle (boolean flip)
      // 2. Three params: field, toggleType, newValue - direct value set
      
      let newState;
      
      if (newValue !== undefined) {
        // Format 2: Set the toggle value directly
        newState = {
          ...prev,
          [field]: {
            ...prev[field],
            [toggleType]: newValue
          }
        };
      } else {
        // Format 1: Toggle the boolean value
        newState = {
          ...prev,
          [field]: {
            ...prev[field],
            [toggleType]: !prev[field][toggleType]
          }
        };
        
        // Convert values when toggling between percentage and dollar
        if (toggleType === 'isPercent') {
          const isNowPercent = !prev[field].isPercent;
          let convertedValue;
          
          if (isNowPercent) {
            // Convert from dollar to percentage based on loan amount
            convertedValue = (localParams[field] / localParams.loanAmount) * 100;
          } else {
            // Convert from percentage to dollar amount
            convertedValue = (localParams[field] / 100) * localParams.loanAmount;
          }
          
          setLocalParams(prevParams => ({
            ...prevParams,
            [field]: parseFloat(convertedValue.toFixed(2))
          }));
        }
      }
      
      return newState;
    });
  };
  
  // Handle loan parameter changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let numValue = type === 'number' ? parseFloat(value) : value;

    if (type === 'number' && isNaN(numValue)) {
      numValue = 0;
    }

    // Special handling for down payment which affects down payment percentage
    if (name === 'downPayment') {
      const downPaymentPercent = (numValue / localParams.loanAmount) * 100;
      setLocalParams(prev => ({
        ...prev,
        downPayment: numValue,
        downPaymentPercent: downPaymentPercent
      }));
    }
    // Special handling for down payment percentage which affects down payment
    else if (name === 'downPaymentPercent') {
      const downPayment = (numValue / 100) * localParams.loanAmount;
      setLocalParams(prev => ({
        ...prev,
        downPayment: downPayment,
        downPaymentPercent: numValue
      }));
    }
    // Special handling for loan amount which affects both loan amount and down payment amount
    else if (name === 'loanAmount') {
      const downPayment = (localParams.downPaymentPercent / 100) * numValue;
      setLocalParams(prev => ({
        ...prev,
        loanAmount: numValue,
        downPayment: downPayment
      }));
    }
    // Special handling for rate adjustment which affects effective interest rate
    else if (name === 'rateAdjustment') {
      setLocalParams(prev => ({
        ...prev,
        rateAdjustment: numValue
      }));
    }
    // For all other fields, just update the value directly
    else {
      setLocalParams(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
    
    // Check if we're updating fields that affect interest rate calculations
    const isRateField = name === 'interestRate' || name === 'rateAdjustment';
    // Check if we're updating property taxes, homeowners insurance, or HOA fees
    const isPropertyField = name === 'propertyTaxes' || name === 'homeownersInsurance' || name === 'hoaFees';

    // Schedule a state-based recalculation on the next tick
    console.log(`[DEBUG] Field ${name} changed to ${numValue}, scheduling recalculation...`);
    
    // Calculate Principal and Interest using combined rate (base + adjustment)
    const currentRateAdjustment = (name === 'rateAdjustment') ? numValue : (localParams.rateAdjustment || 0);
    const currentInterestRate = (name === 'interestRate') ? numValue : localParams.interestRate;
    const effectiveInterestRate = currentInterestRate + currentRateAdjustment;
    
    const pAndI = calculatePrincipalAndInterest(
      localParams.loanAmount,
      (name === 'downPaymentPercent') ? numValue : localParams.downPaymentPercent,
      effectiveInterestRate,
      (name === 'loanTerm') ? numValue : localParams.loanTerm
    );
    
    // Calculate other values and update calculations
    // This performs the same work as calculateLoanValues but inline
    if (selectedProgram) {
      // Use a shorter timeout (0ms) for rate and property-related fields to make them update immediately
      const timeoutDelay = (isPropertyField || isRateField) ? 0 : 50;
      setTimeout(() => {
        // Calculate individual components
        // Use the new value if this property was just changed
        let taxes = name === 'propertyTaxes' ? numValue : localParams.propertyTaxes || 0;
        let insurance = name === 'homeownersInsurance' ? numValue : localParams.homeownersInsurance || 0;
        let hoa = name === 'hoaFees' ? numValue : localParams.hoaFees || 0;
        
        // Convert any percentage values to dollar amounts
        if (toggleStates.propertyTaxes.isPercent) {
          taxes = (taxes / 100) * localParams.loanAmount;
        }
        
        // Handle frequency conversions
        if (toggleStates.propertyTaxes.isYearly) {
          taxes = taxes / 12;
        }
        
        if (toggleStates.homeownersInsurance.isPercent) {
          insurance = (insurance / 100) * localParams.loanAmount;
        }
        
        if (toggleStates.homeownersInsurance.isYearly) {
          insurance = insurance / 12;
        }
        
        if (toggleStates.hoaFees.isPercent) {
          hoa = (hoa / 100) * localParams.loanAmount;
        }
        
        if (toggleStates.hoaFees.isYearly) {
          hoa = hoa / 12;
        }
        
        // Calculate mortgage insurance
        let mortgageInsurance = 0;
        
        if (selectedProgram) {
          if (selectedProgram.programType === 'conventional') {
            // For conventional loans, use the PMI tiers
            mortgageInsurance = calculateMortgageInsurance(
              localParams.loanAmount,
              localParams.downPaymentPercent,
              selectedProgram
            );
          } else if (selectedProgram.programType === 'fha') {
            // For FHA loans, use the annual MIP rate
            mortgageInsurance = (selectedProgram.mortgageInsurance / 100) * 
              (localParams.loanAmount - localParams.downPayment) / 12;
          } else if (selectedProgram.programType === 'usda') {
            // For USDA loans, use the annual fee
            const usdaFees = calculateUSDAFees(localParams.loanAmount, selectedProgram);
            mortgageInsurance = usdaFees.annualFee;
          } else if (selectedProgram.programType === 'va') {
            // VA loans don't have monthly mortgage insurance
            mortgageInsurance = 0;
          } else {
            // Default calculation for other loan types
            mortgageInsurance = calculateMortgageInsurance(
              localParams.loanAmount,
              localParams.downPaymentPercent,
              selectedProgram
            );
          }
        }
        
        // Total monthly payment
        const monthlyPayment = pAndI + taxes + insurance + mortgageInsurance + hoa;
        
        // DTI calculation
        const dti = localParams.income > 0 ? 
          ((localParams.debts + monthlyPayment) / localParams.income) * 100 : 0;
        
        // Determine qualification based on DTI
        // Use the new dtiMax if it's being updated, otherwise use current value
        const dtiMax = (name === 'dtiMax') ? numValue : localParams.dtiMax;
        const isQualified = dti <= dtiMax;
        
        // Update calculation state
        setCalculations({
          principalAndInterest: pAndI,
          taxes,
          insurance,
          mortgageInsurance,
          hoa,
          monthlyPayment,
          dti,
          isQualified
        });
      }, timeoutDelay);
    }
  };

  // Recalculate values when the component mounts or when program changes
  const recalculateValues = useCallback(() => {
    // Skip if there's no selected program
    if (!selectedProgram) return;
    
    // Calculate Principal and Interest using combined rate (base + adjustment)
    const effectiveInterestRate = localParams.interestRate + (localParams.rateAdjustment || 0);
    const pAndI = calculatePrincipalAndInterest(
      localParams.loanAmount,
      localParams.downPaymentPercent,
      effectiveInterestRate,
      localParams.loanTerm
    );
    
    // Calculate monthly property taxes (handle both percentage and flat rates)
    let taxes = localParams.propertyTaxes || 0;
    if (toggleStates.propertyTaxes.isPercent) {
      taxes = (taxes / 100) * localParams.loanAmount;
    }
    if (toggleStates.propertyTaxes.isYearly) {
      taxes = taxes / 12;
    }
    
    // Calculate monthly homeowners insurance
    let insurance = localParams.homeownersInsurance || 0;
    if (toggleStates.homeownersInsurance.isPercent) {
      insurance = (insurance / 100) * localParams.loanAmount;
    }
    if (toggleStates.homeownersInsurance.isYearly) {
      insurance = insurance / 12;
    }
    
    // Calculate monthly HOA fees
    let hoa = localParams.hoaFees || 0;
    if (toggleStates.hoaFees.isPercent) {
      hoa = (hoa / 100) * localParams.loanAmount;
    }
    if (toggleStates.hoaFees.isYearly) {
      hoa = hoa / 12;
    }
    
    // Calculate mortgage insurance
    let mortgageInsurance = 0;
    
    if (selectedProgram) {
      if (selectedProgram.programType === 'conventional') {
        // For conventional loans, use the PMI tiers
        mortgageInsurance = calculateMortgageInsurance(
          localParams.loanAmount,
          localParams.downPaymentPercent,
          selectedProgram
        );
      } else if (selectedProgram.programType === 'fha') {
        // For FHA loans, use the annual MIP rate
        mortgageInsurance = (selectedProgram.mortgageInsurance / 100) * 
          (localParams.loanAmount - localParams.downPayment) / 12;
      } else if (selectedProgram.programType === 'usda') {
        // For USDA loans, use the annual fee
        const usdaFees = calculateUSDAFees(localParams.loanAmount, selectedProgram);
        mortgageInsurance = usdaFees.annualFee;
      } else if (selectedProgram.programType === 'va') {
        // VA loans don't have monthly mortgage insurance
        mortgageInsurance = 0;
      } else {
        // Default calculation for other loan types
        mortgageInsurance = calculateMortgageInsurance(
          localParams.loanAmount,
          localParams.downPaymentPercent,
          selectedProgram
        );
      }
    }
    
    // Total monthly payment
    const monthlyPayment = pAndI + taxes + insurance + mortgageInsurance + hoa;
    
    // DTI calculation (income and debts are monthly)
    const dti = localParams.income > 0 ? 
      ((localParams.debts + monthlyPayment) / localParams.income) * 100 : 0;
    
    // Determine if the applicant qualifies based on DTI
    const isQualified = dti <= localParams.dtiMax;
    
    // Update calculation state
    setCalculations({
      principalAndInterest: pAndI,
      taxes,
      insurance,
      mortgageInsurance,
      hoa,
      monthlyPayment,
      dti,
      isQualified
    });
    
    console.log('[DEBUG] Recalculated loan values:', {
      principalAndInterest: pAndI,
      taxes,
      insurance,
      mortgageInsurance,
      hoa,
      monthlyPayment,
      dti,
      dtiMax: localParams.dtiMax,
      isQualified
    });
  }, [localParams, toggleStates, selectedProgram]);

  // Recalculate when parameters change
  useEffect(() => {
    if (selectedProgram) {
      recalculateValues();
    }
  }, [localParams, recalculateValues, selectedProgram]);

  // Provide all the state and handlers to children
  return children({
    localParams,
    setLocalParams,
    toggleStates,
    setToggleStates,
    calculations,
    setCalculations,
    handleInputChange,
    handleToggleChange,
    recalculateValues,
    loadingStates
  });
};

export default ParametersProvider;