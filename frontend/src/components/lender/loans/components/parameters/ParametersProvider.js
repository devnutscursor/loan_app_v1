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
  
  // Function to perform calculations with specific parameter values
  const performCalculationWithParams = useCallback((params) => {
    if (!selectedProgram || !params.loanAmount || !params.interestRate) {
      console.log('[DEBUG] Skipping calculation - missing data:', {
        selectedProgram: !!selectedProgram,
        loanAmount: params.loanAmount,
        interestRate: params.interestRate
      });
      return;
    }

    // Calculate Principal and Interest using combined rate (base + adjustment)
    const effectiveInterestRate = params.interestRate + (params.rateAdjustment || 0);
    
    // For P&I calculation, we need to determine if loanAmount is purchase price or net loan amount
    // If we have both loanAmount and downPayment, we can calculate the purchase price
    let purchasePrice = params.loanAmount;
    let actualLoanAmount = params.loanAmount;
    
    // If downPaymentPercent is provided and > 0, calculate the actual loan amount
    if (params.downPaymentPercent > 0) {
      // If loanAmount represents the net loan amount (after down payment)
      // then purchasePrice = loanAmount / (1 - downPaymentPercent/100)
      // But if loanAmount represents purchase price, then it's already correct
      
      // Check if this looks like a net loan amount by comparing with down payment
      const calculatedPurchasePrice = params.loanAmount / (1 - (params.downPaymentPercent / 100));
      const calculatedDownPayment = calculatedPurchasePrice - params.loanAmount;
      
      // If the calculated down payment is close to the provided down payment,
      // then loanAmount is likely the net loan amount
      if (params.downPayment && Math.abs(calculatedDownPayment - params.downPayment) < 100) {
        purchasePrice = calculatedPurchasePrice;
        actualLoanAmount = params.loanAmount;
      } else {
        // Otherwise, loanAmount is likely the purchase price
        purchasePrice = params.loanAmount;
        actualLoanAmount = params.loanAmount * (1 - (params.downPaymentPercent / 100));
      }
    }
    
    console.log('[DEBUG] P&I Calculation inputs:', {
      originalLoanAmount: params.loanAmount,
      purchasePrice,
      actualLoanAmount,
      downPayment: params.downPayment,
      downPaymentPercent: params.downPaymentPercent,
      effectiveInterestRate,
      loanTerm: params.loanTerm
    });
    
    const pAndI = calculatePrincipalAndInterest(
      purchasePrice,
      params.downPaymentPercent,
      effectiveInterestRate,
      params.loanTerm
    );
    
    console.log('[DEBUG] Calculated P&I:', pAndI);
    console.log('[DEBUG] Expected P&I should be around $2,485 if correct, but getting:', pAndI);
    
    // Calculate monthly property taxes (handle both percentage and flat rates)
    let taxes = params.propertyTaxes || 0;
    if (toggleStates.propertyTaxes.isPercent) {
      taxes = (taxes / 100) * params.loanAmount;
    }
    if (toggleStates.propertyTaxes.isYearly) {
      taxes = taxes / 12;
    }
    
    // Calculate monthly homeowners insurance
    let insurance = params.homeownersInsurance || 0;
    if (toggleStates.homeownersInsurance.isPercent) {
      insurance = (insurance / 100) * params.loanAmount;
    }
    if (toggleStates.homeownersInsurance.isYearly) {
      insurance = insurance / 12;
    }
    
    // Calculate monthly HOA fees
    let hoa = params.hoaFees || 0;
    if (toggleStates.hoaFees.isPercent) {
      hoa = (hoa / 100) * params.loanAmount;
    }
    if (toggleStates.hoaFees.isYearly) {
      hoa = hoa / 12;
    }
    
    // Calculate mortgage insurance using the correct loan amounts
    let mortgageInsurance = 0;
    
    if (selectedProgram) {
      if (selectedProgram.programType === 'conventional') {
        mortgageInsurance = calculateMortgageInsurance(
          purchasePrice,
          params.downPaymentPercent,
          selectedProgram
        );
      } else if (selectedProgram.programType === 'fha') {
        mortgageInsurance = (selectedProgram.mortgageInsurance / 100) * 
          actualLoanAmount / 12;
      } else if (selectedProgram.programType === 'usda') {
        const usdaFees = calculateUSDAFees(actualLoanAmount, selectedProgram);
        mortgageInsurance = usdaFees.annualFee;
      } else if (selectedProgram.programType === 'va') {
        mortgageInsurance = 0;
      } else {
        mortgageInsurance = calculateMortgageInsurance(
          purchasePrice,
          params.downPaymentPercent,
          selectedProgram
        );
      }
    }
    
    // Total monthly payment
    const monthlyPayment = pAndI + taxes + insurance + mortgageInsurance + hoa;
    
    // DTI calculation
    const dti = params.income > 0 ? 
      ((params.debts + monthlyPayment) / params.income) * 100 : 0;
    
    // Determine qualification
    const isQualified = dti <= params.dtiMax;
    
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
  }, [selectedProgram, toggleStates]);

  // Handle loan parameter changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let numValue = type === 'number' ? parseFloat(value) : value;

    if (type === 'number' && isNaN(numValue)) {
      numValue = 0;
    }

    // Create a function to update parameters and trigger calculations with the new values
    const updateParamsAndCalculate = (updateFn) => {
      setLocalParams(prev => {
        const newParams = updateFn(prev);
        
        // Schedule calculation with the new parameters
        setTimeout(() => {
          performCalculationWithParams(newParams);
        }, 0);
        
        return newParams;
      });
    };

    // Special handling for down payment which affects down payment percentage
    if (name === 'downPayment') {
      updateParamsAndCalculate(prev => {
        const downPaymentPercent = (numValue / prev.loanAmount) * 100;
        return {
          ...prev,
          downPayment: numValue,
          downPaymentPercent: downPaymentPercent
        };
      });
    }
    // Special handling for down payment percentage which affects down payment
    else if (name === 'downPaymentPercent') {
      updateParamsAndCalculate(prev => {
        const downPayment = (numValue / 100) * prev.loanAmount;
        return {
          ...prev,
          downPayment: downPayment,
          downPaymentPercent: numValue
        };
      });
    }
    // Special handling for loan amount which affects both loan amount and down payment amount
    else if (name === 'loanAmount') {
      updateParamsAndCalculate(prev => {
        const downPayment = (prev.downPaymentPercent / 100) * numValue;
        return {
          ...prev,
          loanAmount: numValue,
          downPayment: downPayment
        };
      });
    }
    // For all other fields, just update the value directly
    else {
      updateParamsAndCalculate(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // Recalculate values when the component mounts or when program changes
  const recalculateValues = useCallback(() => {
    // Skip if there's no selected program or if essential data is missing
    if (!selectedProgram || !localParams.loanAmount || !localParams.interestRate) {
      console.log('[DEBUG] Skipping calculation - missing required data:', {
        selectedProgram: !!selectedProgram,
        loanAmount: localParams.loanAmount,
        interestRate: localParams.interestRate
      });
      return;
    }
    
    // Calculate Principal and Interest using combined rate (base + adjustment)
    const effectiveInterestRate = localParams.interestRate + (localParams.rateAdjustment || 0);
    
    // For P&I calculation, we need to determine if loanAmount is purchase price or net loan amount
    // Use the same logic as performCalculationWithParams
    let purchasePrice = localParams.loanAmount;
    let actualLoanAmount = localParams.loanAmount;
    
    // If downPaymentPercent is provided and > 0, calculate the actual loan amount
    if (localParams.downPaymentPercent > 0) {
      // Check if this looks like a net loan amount by comparing with down payment
      const calculatedPurchasePrice = localParams.loanAmount / (1 - (localParams.downPaymentPercent / 100));
      const calculatedDownPayment = calculatedPurchasePrice - localParams.loanAmount;
      
      // If the calculated down payment is close to the provided down payment,
      // then loanAmount is likely the net loan amount
      if (localParams.downPayment && Math.abs(calculatedDownPayment - localParams.downPayment) < 100) {
        purchasePrice = calculatedPurchasePrice;
        actualLoanAmount = localParams.loanAmount;
      } else {
        // Otherwise, loanAmount is likely the purchase price
        purchasePrice = localParams.loanAmount;
        actualLoanAmount = localParams.loanAmount * (1 - (localParams.downPaymentPercent / 100));
      }
    }
    
    console.log('[DEBUG] recalculateValues P&I Calculation inputs:', {
      originalLoanAmount: localParams.loanAmount,
      purchasePrice,
      actualLoanAmount,
      downPayment: localParams.downPayment,
      downPaymentPercent: localParams.downPaymentPercent,
      effectiveInterestRate,
      loanTerm: localParams.loanTerm
    });
    
    const pAndI = calculatePrincipalAndInterest(
      purchasePrice,
      localParams.downPaymentPercent,
      effectiveInterestRate,
      localParams.loanTerm
    );
    
    console.log('[DEBUG] recalculateValues Calculated P&I:', pAndI);
    
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
    
    // Calculate mortgage insurance using the correct loan amounts
    let mortgageInsurance = 0;
    
    if (selectedProgram) {
      if (selectedProgram.programType === 'conventional') {
        // For conventional loans, use the PMI tiers
        mortgageInsurance = calculateMortgageInsurance(
          purchasePrice,
          localParams.downPaymentPercent,
          selectedProgram
        );
      } else if (selectedProgram.programType === 'fha') {
        // For FHA loans, use the annual MIP rate
        mortgageInsurance = (selectedProgram.mortgageInsurance / 100) * 
          actualLoanAmount / 12;
      } else if (selectedProgram.programType === 'usda') {
        // For USDA loans, use the annual fee
        const usdaFees = calculateUSDAFees(actualLoanAmount, selectedProgram);
        mortgageInsurance = usdaFees.annualFee;
      } else if (selectedProgram.programType === 'va') {
        // VA loans don't have monthly mortgage insurance
        mortgageInsurance = 0;
      } else {
        // Default calculation for other loan types
        mortgageInsurance = calculateMortgageInsurance(
          purchasePrice,
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
    if (selectedProgram && !loadingStates.isLoadingDetails && !loadingStates.isLoadingCalculations) {
      // Add a small delay to ensure state has been updated
      const timeoutId = setTimeout(() => {
        recalculateValues();
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [localParams, recalculateValues, selectedProgram, loadingStates.isLoadingDetails, loadingStates.isLoadingCalculations]);

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