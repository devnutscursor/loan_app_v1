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
 * @returns {number} - Total income
 */
export const getTotalIncome = (income) => {
  if (!income) return 0;

  let total = 0;
  const { baseIncome = 0, overtime = 0, commissions = 0, bonuses = 0, militaryEntitlements = 0 } = income;

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
