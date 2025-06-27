/**
 * Utility functions for loan calculations
 */

/**
 * Calculate the loan amount based on loan type
 * @param {Object} loanDetails - The loan details object
 * @returns {number} - The calculated loan amount
 */
export const getLoanAmount = (loanDetails) => {
  if (!loanDetails) return 0;

  const { loanType = 'Purchase' } = loanDetails;

  if (loanType.toLowerCase() === 'purchase') {
    return loanDetails.purchasePrice || 0;
  } else if (loanType.toLowerCase() === 'refinance') {
    return loanDetails.requestedLoanAmount || 0;
  } else if (loanType.toLowerCase() === 'construction') {
    return loanDetails.loanAmount || 0;
  }

  return 0;
};

/**
 * Get the interest rate for a loan program
 * @param {Object} selectedProgram - The selected loan program
 * @param {Array} loanRates - Array of loan rates
 * @returns {number} - The interest rate
 */
export const getInterestRate = (selectedProgram, loanRates) => {
  if (!selectedProgram || !loanRates.length) return 7.0;

  const programRate = loanRates.find(rate =>
    rate.programType === selectedProgram.programType
  );

  return programRate ? programRate.rate : 7.0;
};

/**
 * Calculate total income from all income sources
 * @param {Object} income - The income object
 * @returns {number} - Total monthly income
 */
export const getTotalIncome = (income) => {
  if (!income) return 5000; // Return default monthly income if no data

  let total = 0;
  const { baseIncome = 0, overtime = 0, commissions = 0, bonuses = 0, militaryEntitlements = 0 } = income;

  // Add up all income sources (already in monthly values)
  total += parseFloat(baseIncome || 0);
  total += parseFloat(overtime || 0);
  total += parseFloat(commissions || 0);
  total += parseFloat(bonuses || 0);
  total += parseFloat(militaryEntitlements || 0);

  // Add other income if available
  if (income.otherIncome && Array.isArray(income.otherIncome)) {
    income.otherIncome.forEach(income => {
      total += parseFloat(income.amount || 0);
    });
  }

  // Return total monthly income (values are already in monthly format)
  return total;
};

/**
 * Calculate total debts from debt payments
 * @param {Array} debts - Array of debts
 * @returns {number} - Total monthly debt payments
 */
export const getTotalDebts = (debts) => {
  if (!debts || !Array.isArray(debts)) return 0;

  return debts.reduce((total, debt) => {
    return total + parseFloat(debt.monthlyPayment || 0);
  }, 0);
};

/**
 * Calculate total assets from all asset sources
 * @param {Object} assets - The assets object
 * @returns {number} - Total assets value
 */
export const getTotalAssets = (assets) => {
  if (!assets) return 0;

  let total = 0;

  // Add checking and savings accounts
  if (assets.checkingAndSavings && Array.isArray(assets.checkingAndSavings)) {
    assets.checkingAndSavings.forEach(account => {
      total += parseFloat(account.value || 0);
    });
  }

  // Add stocks and bonds
  if (assets.stocksAndBonds && Array.isArray(assets.stocksAndBonds)) {
    assets.stocksAndBonds.forEach(asset => {
      total += parseFloat(asset.value || 0);
    });
  }

  // Add misc assets
  if (assets.miscellaneous && Array.isArray(assets.miscellaneous)) {
    assets.miscellaneous.forEach(asset => {
      total += parseFloat(asset.value || 0);
    });
  }

  return total;
};

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate VA funding fee based on program settings
 * @param {number} loanAmount - The loan amount
 * @param {number} downPaymentPercent - Down payment percentage
 * @param {Object} selectedProgram - Selected loan program
 * @returns {number} - Total VA funding fee
 */
export const calculateVAFundingFee = (loanAmount, downPaymentPercent, selectedProgram) => {
  if (!selectedProgram || selectedProgram.programType !== 'va') {
    return 0;
  }
  
  // Get the funding fee percentage from the program
  const fundingFeePercent = selectedProgram.fundingFee || 2.3;
  
  // Calculate funding fee amount
  return (fundingFeePercent / 100) * loanAmount;
};

/**
 * Calculate USDA fees based on program settings
 * @param {number} loanAmount - The loan amount
 * @param {Object} selectedProgram - Selected loan program
 * @returns {Object} - Object containing upfront fee and annual fee
 */
export const calculateUSDAFees = (loanAmount, selectedProgram) => {
  if (!selectedProgram || selectedProgram.programType !== 'usda') {
    return { upfrontFee: 0, annualFee: 0 };
  }
  
  // Get the upfront guarantee fee percentage from the program
  const fundingFeePercent = selectedProgram.fundingFee || 1.0;
  
  // Get the annual fee percentage from the program
  const annualFeePercent = selectedProgram.mortgageInsurance || 0.4;
  
  // Calculate upfront guarantee fee
  const upfrontFee = (fundingFeePercent / 100) * loanAmount;
  
  // Calculate annual fee (monthly portion)
  const annualFee = (annualFeePercent / 100 * loanAmount) / 12;
  
  return { upfrontFee, annualFee };
};


/**
 * Calculate mortgage insurance based on LTV ratio
 * @param {number} loanAmount - The loan amount
 * @param {number} downPaymentPercent - Down payment percentage
 * @param {Object} selectedProgram - Selected loan program
 * @returns {number} - Monthly mortgage insurance amount
 */
export const calculateMortgageInsurance = (loanAmount, downPaymentPercent, selectedProgram) => {
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
  return (pmiRate.rate / 100 * loanAmount * (1 - (downPaymentPercent / 100))) / 12;
};

/**
 * Calculate principal and interest payment
 * @param {number} loanAmount - Total loan amount
 * @param {number} downPaymentPercent - Down payment percentage
 * @param {number} interestRate - Annual interest rate
 * @param {number} termYears - Loan term in years
 * @returns {number} Monthly principal and interest payment
 */
export const calculatePrincipalAndInterest = (loanAmount, downPaymentPercent, interestRate, termYears) => {
  if (!loanAmount) return 0;
  
  // Ensure we have valid values - use sensible defaults if missing
  const principal = loanAmount * (1 - (downPaymentPercent / 100));
  const safeRate = interestRate || 6.75; // Use default rate if none provided
  const safeTerm = termYears || 30; // Use default term if none provided
  
  // Monthly interest rate
  const monthlyRate = safeRate / 100 / 12;
  
  // Total number of payments
  const payments = safeTerm * 12;
  
  // Return 0 if rate is 0 (avoid division by zero)
  if (monthlyRate === 0) return principal / payments;
  
  try {
    // Calculate payment using formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
    
    // Validate the calculation result
    if (isNaN(payment) || !isFinite(payment)) {
      console.error('[ERROR] Invalid P&I calculation result', { 
        principal, monthlyRate, payments, result: payment 
      });
      return principal / payments; // Fallback to simple calculation
    }
    
    return payment;
  } catch (error) {
    console.error('[ERROR] Exception in P&I calculation', error);
    return principal / payments; // Fallback to simple calculation
  }
};
