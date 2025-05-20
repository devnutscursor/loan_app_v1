/**
 * Utility functions for loan qualification calculations
 */

/**
 * Format a number as USD currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
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
  if (!loanAmount || !interestRate || !termYears) return 0;
  
  // Calculate loan amount after down payment
  const principal = loanAmount * (1 - (downPaymentPercent / 100));
  
  // Monthly interest rate
  const monthlyRate = interestRate / 100 / 12;
  
  // Total number of payments
  const payments = termYears * 12;
  
  // Return 0 if rate is 0 (avoid division by zero)
  if (monthlyRate === 0) return principal / payments;
  
  // Calculate payment using formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
};

/**
 * Calculate mortgage insurance based on LTV ratio
 * @param {number} loanAmount - Loan amount
 * @param {number} downPaymentPercent - Down payment percentage
 * @param {Array} pmiRates - PMI rates array from selected program
 * @returns {number} Monthly mortgage insurance amount
 */
export const calculateMortgageInsurance = (loanAmount, downPaymentPercent, pmiRates) => {
  if (!pmiRates || !Array.isArray(pmiRates) || !loanAmount) {
    return 0;
  }

  // Calculate LTV (Loan-to-Value) ratio
  const ltv = 100 - downPaymentPercent;
  
  // Find the applicable PMI rate based on LTV
  const pmiRate = pmiRates.find(
    pmi => ltv >= pmi.minLTV && ltv <= pmi.maxLTV
  );
  
  if (!pmiRate) {
    return 0; // No PMI if there's no matching range
  }
  
  // Calculate annual PMI amount and divide by 12 for monthly amount
  return (pmiRate.rate / 100 * loanAmount) / 12;
};

/**
 * Extract total income from loan data
 * @param {Object} incomeData - Income data from loan
 * @returns {number} Total monthly income
 */
export const getTotalIncome = (incomeData) => {
  if (!incomeData) return 5000; // Default income for new loans
  
  let total = 0;
  const { baseIncome = 0, overtime = 0, commissions = 0, bonuses = 0, militaryEntitlements = 0 } = incomeData;
  
  total += parseFloat(baseIncome || 0);
  total += parseFloat(overtime || 0);
  total += parseFloat(commissions || 0);
  total += parseFloat(bonuses || 0);
  total += parseFloat(militaryEntitlements || 0);
  
  // Add other income if available
  if (incomeData.otherIncome && Array.isArray(incomeData.otherIncome)) {
    incomeData.otherIncome.forEach(income => {
      total += parseFloat(income.amount || 0);
    });
  }
  
  return total;
};

/**
 * Extract total debts from loan data
 * @param {Array} debtsData - Debts data from loan
 * @returns {number} Total monthly debt payments
 */
export const getTotalDebts = (debtsData) => {
  if (!debtsData || !Array.isArray(debtsData)) return 0;
  
  return debtsData.reduce((total, debt) => {
    return total + parseFloat(debt.monthlyPayment || 0);
  }, 0);
};

/**
 * Calculate the default property tax amount
 * @param {number} propertyValue - Property value or loan amount
 * @returns {number} Monthly property tax estimate
 */
export const calculateDefaultPropertyTax = (propertyValue) => {
  const yearlyPropertyTaxes = propertyValue * 0.015; // 1.5% is typical
  return yearlyPropertyTaxes / 12;
};

/**
 * Calculate the default homeowners insurance amount
 * @param {number} propertyValue - Property value or loan amount
 * @returns {number} Monthly insurance estimate
 */
export const calculateDefaultInsurance = (propertyValue) => {
  const yearlyHomeownersInsurance = propertyValue * 0.0035; // 0.35% is typical
  return yearlyHomeownersInsurance / 12;
};

/**
 * Calculate loan values for qualification
 * @param {Object} loan - Loan data
 * @param {Array} loanPrograms - Available loan programs
 * @param {Object} selectedProgram - Currently selected program
 * @returns {Object} Calculated values for qualification
 */
export const calculateDefaultLoanValues = (loan, loanPrograms, selectedProgram) => {
  // Use default values for new loans
  const defaultInterestRate = 7.0; // Default interest rate
  const defaultLoanAmount = loan?.loanDetails?.purchasePrice || 300000; // Default loan amount
  const defaultDownPaymentPercent = selectedProgram?.restrictions?.downPaymentRestriction?.min || 3.5;
  const defaultDownPayment = defaultLoanAmount * (defaultDownPaymentPercent / 100);
  const defaultLoanTerm = 30; // Default loan term in years
  
  // Calculate principal and interest
  const principalAndInterest = calculatePrincipalAndInterest(
    defaultLoanAmount, 
    defaultDownPaymentPercent,
    defaultInterestRate,
    defaultLoanTerm
  );
  
  // Calculate other monthly costs
  const taxes = calculateDefaultPropertyTax(defaultLoanAmount);
  const insurance = calculateDefaultInsurance(defaultLoanAmount);
  const hoaFees = loan?.property?.hoaFees || 0;
  
  // Calculate mortgage insurance if applicable
  const mortgageInsurance = calculateMortgageInsurance(
    defaultLoanAmount,
    defaultDownPaymentPercent,
    selectedProgram?.privateMortgageInsurance
  );
  
  // Calculate monthly payment
  const monthlyPayment = principalAndInterest + taxes + insurance + mortgageInsurance + hoaFees;
  
  // Calculate DTI
  const monthlyIncome = getTotalIncome(loan?.income) / 12;
  const monthlyDebts = getTotalDebts(loan?.debts);
  const dti = monthlyIncome > 0 ? ((monthlyPayment + monthlyDebts) / monthlyIncome) * 100 : 0;
  
  // Determine qualification
  const dtiLimit = selectedProgram?.restrictions?.dtiRestriction?.max || 43;
  const isQualified = dti <= dtiLimit;
  
  return {
    loanAmount: defaultLoanAmount,
    downPayment: defaultDownPayment,
    downPaymentPercent: defaultDownPaymentPercent,
    monthlyPayment: monthlyPayment || 0,
    dti: dti || 0,
    principalAndInterest: principalAndInterest || 0,
    taxes: taxes || 0,
    insurance: insurance || 0,
    mortgageInsurance: mortgageInsurance || 0,
    hoa: hoaFees || 0,
    isQualified: isQualified,
    programName: selectedProgram?.displayName || 'Conventional',
    interestRate: defaultInterestRate,
    loanTerm: selectedProgram?.loanTerm || 30,
  };
};
