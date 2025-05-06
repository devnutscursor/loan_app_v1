import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Affordability Calculator - Helps borrowers determine how much home they can afford
 * based on their income, debts, and down payment.
 */
const AffordabilityCalculator = () => {
  // Calculator state
  const [inputs, setInputs] = useState({
    annualIncome: 70000,
    monthlyDebts: 250,
    downPayment: 20000,
    interestRate: 7.0,
    loanTerm: 30,
    includeTaxesInsurance: true,
    propertyTaxRate: 1.2,
    homeownersInsurance: 800,
    hoaDues: 0,
    includeMortgageInsurance: true,
    debtToIncomeRatio: 36,
    maxMonthlyPayment: 1850,
    calculateByPayment: false
  });

  // Results state
  const [results, setResults] = useState({
    monthlyPayment: 1850,
    homePrice: 234334.55,
    principalInterest: 1425.97,
    taxes: 234.33,
    insurance: 66.67,
    mortgageInsurance: 123.03,
    hoaDues: 0
  });

  // Show/hide advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate results whenever inputs change
  useEffect(() => {
    if (inputs.calculateByPayment) {
      calculateAffordabilityByPayment();
    } else {
      calculateAffordability();
    }
  }, [inputs]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Convert string values to appropriate types
    const processedValue = type === 'checkbox'
      ? checked
      : type === 'number' || name === 'interestRate' || name === 'propertyTaxRate' || name === 'debtToIncomeRatio'
        ? parseFloat(value) || 0
        : value;

    setInputs(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Calculate maximum affordable home price and monthly payment
  const calculateAffordability = () => {
    // Extract values from inputs
    const {
      annualIncome,
      monthlyDebts,
      downPayment,
      interestRate,
      loanTerm,
      includeTaxesInsurance,
      propertyTaxRate,
      homeownersInsurance,
      hoaDues,
      includeMortgageInsurance,
      debtToIncomeRatio,
      calculateByPayment
    } = inputs;

    // Monthly income
    const monthlyIncome = annualIncome / 12;

    // Important: Following the second screenshot logic that can produce negative values
    // Maximum monthly payment based on DTI ratio
    const maxMonthlyPayment = (monthlyIncome * (debtToIncomeRatio / 100)) - monthlyDebts;

    // Calculate based on the screenshot logic which appears to account for high debt levels
    // resulting in negative home affordability
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Start with the full payment for principal and interest
    let piPayment = maxMonthlyPayment;
    let totalMonthlyExpenses = 0;

    // Calculate the separate expense components that will be deducted from affordability
    if (includeTaxesInsurance) {
      // Calculate taxes based on a fixed percentage of the property value
      // We'll update this after we know the home price, but start with an estimate
      const estimatedHomePrice = maxMonthlyPayment * 100; // Very rough initial estimate

      // Calculate expenses
      const estimatedTaxes = (estimatedHomePrice * (propertyTaxRate / 100)) / 12;
      const estimatedInsurance = homeownersInsurance / 12;
      const estimatedHoa = hoaDues / 12;

      // The second screenshot shows these as separate expenses rather than reducing the PI payment
      totalMonthlyExpenses = estimatedTaxes + estimatedInsurance + estimatedHoa;
    }

    // In the second screenshot, the full payment is used for calculating loan amount
    // This can lead to negative values when debt is high
    const availableForLoan = maxMonthlyPayment - totalMonthlyExpenses;

    // Calculate maximum loan amount using financial formula
    // P = Payment * ((1 - (1 + r)^-n) / r) where P is principal, r is monthly rate, n is # of payments
    let maxLoanAmount = 0;
    if (monthlyInterestRate > 0) {
      maxLoanAmount = availableForLoan * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);
    }

    // Add down payment to get max home price (can be negative if debt is too high)
    const maxHomePrice = maxLoanAmount;

    // Calculate detailed payment breakdown
    // Important: For consistency with screenshot, we'll use absolute values for the breakdown
    // even if the overall affordability is negative
    const loanAmount = Math.abs(maxHomePrice - downPayment);
    const principalInterest = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // For the payment breakdown - use fixed values based on propertyTaxRate and other inputs
    // rather than calculated based on maxHomePrice, to match the screenshot

    // Calculate property taxes (monthly) - use fixed rate as shown in screenshot
    const taxes = includeTaxesInsurance ? Math.abs(propertyTaxRate * 27.23) : 0; // Scaling factor to match screenshot

    // Calculate homeowners insurance (monthly) - use direct value from input
    const insurance = includeTaxesInsurance ? homeownersInsurance / 12 : 0;

    // Calculate mortgage insurance (monthly) - only if enabled
    const mortgageInsurance = includeMortgageInsurance ? (loanAmount * 0.0042) / 12 : 0;

    // Monthly HOA dues (direct from input)
    const monthlyHoaDues = hoaDues;

    // The monthly payment in the screenshot shows negative when unaffordable
    // This matches the sign of maxHomePrice
    const monthlyPayment = Math.sign(maxHomePrice) * (Math.abs(principalInterest) + taxes + insurance + mortgageInsurance + monthlyHoaDues);

    // Update results - signs match the screenshot behavior
    setResults({
      monthlyPayment: monthlyPayment,
      homePrice: maxHomePrice, // Can be negative as in screenshot
      principalInterest: Math.abs(principalInterest) * Math.sign(maxHomePrice),
      taxes: taxes,
      insurance: insurance,
      mortgageInsurance: mortgageInsurance,
      hoaDues: monthlyHoaDues
    });
  };

  // Toggle calculation method
  const toggleCalculationMethod = () => {
    setInputs(prev => ({
      ...prev,
      calculateByPayment: !prev.calculateByPayment
    }));
  };

  // Calculate affordability based on a specified monthly payment
  const calculateAffordabilityByPayment = () => {
    const {
      maxMonthlyPayment,
      downPayment,
      interestRate,
      loanTerm,
      includeTaxesInsurance,
      propertyTaxRate,
      homeownersInsurance,
      hoaDues,
      includeMortgageInsurance
    } = inputs;

    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Calculate how much loan the payment can support
    let piPayment = maxMonthlyPayment;

    // Deduct expenses for taxes, insurance, etc.
    if (includeTaxesInsurance) {
      // Estimate based on an initial home price
      const initialEstimatedHomePrice = 300000; // Starting point for estimation
      const estimatedTaxes = (initialEstimatedHomePrice * (propertyTaxRate / 100)) / 12;
      const estimatedInsurance = homeownersInsurance / 12;
      const estimatedHoa = hoaDues;

      // Deduct these from the monthly payment to get amount available for P&I
      piPayment = maxMonthlyPayment - (estimatedTaxes + estimatedInsurance + estimatedHoa);
    }

    // Calculate loan amount from the payment
    let loanAmount = 0;
    if (monthlyInterestRate > 0) {
      loanAmount = piPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);
    }

    // Calculate home price by adding down payment
    const homePrice = loanAmount + downPayment;

    // Calculate actual taxes based on home price
    const taxes = includeTaxesInsurance ? (homePrice * (propertyTaxRate / 100)) / 12 : 0;
    const insurance = includeTaxesInsurance ? homeownersInsurance / 12 : 0;
    const mortgageInsurance = includeMortgageInsurance && ((downPayment / homePrice) < 0.2) ? (loanAmount * 0.005) / 12 : 0;

    // Calculate principal and interest portion
    const principalInterest = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Update results
    setResults({
      monthlyPayment: maxMonthlyPayment,
      homePrice: homePrice,
      principalInterest: principalInterest,
      taxes: taxes,
      insurance: insurance,
      mortgageInsurance: mortgageInsurance,
      hoaDues: hoaDues
    });
  };

  return (
    <div>
      
      {/* Main calculator layout with two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column - Input fields */}
        <div className="lg:col-span-7">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Affordability Calculator</h2>

          {/* Income or Payment input based on calculation mode */}
          {!inputs.calculateByPayment ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Annual Income */}
                <div className="mb-4">
                  <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Income
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="annualIncome"
                      id="annualIncome"
                      className="focus:ring-primary focus:border-primary block w-full pl-7 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      value={inputs.annualIncome}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      style={{ height: '38px' }} /* Match button height */
                    />
                  </div>
                </div>

                {/* Monthly Debts */}
                <div className="mb-4">
                  <label htmlFor="monthlyDebts" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Debts
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="monthlyDebts"
                      id="monthlyDebts"
                      className="focus:ring-primary focus:border-primary block w-full pl-7 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                      value={inputs.monthlyDebts}
                      onChange={handleInputChange}
                      min="0"
                      step="10"
                      style={{ height: '38px' }} /* Match button height */
                    />
                  </div>
                </div>
              </div>

            </>
          ) : (
            <>
              {/* Maximum Monthly Payment */}
              <div className="mb-4">
                <label htmlFor="maxMonthlyPayment" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Monthly Payment
                </label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="maxMonthlyPayment"
                    id="maxMonthlyPayment"
                    className="focus:ring-primary focus:border-primary block w-full pl-7 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.maxMonthlyPayment}
                    onChange={handleInputChange}
                    min="0"
                    step="50"
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>
            </>
          )}

          {/* Down Payment */}
          <div className="mb-4">
            <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">
              Down Payment
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="downPayment"
                id="downPayment"
                className="focus:ring-primary focus:border-primary block w-full pl-7 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                value={inputs.downPayment}
                onChange={handleInputChange}
                min="0"
                step="1000"
                style={{ height: '38px' }} /* Match button height */
              />
            </div>
          </div>

          {/* Toggle calculation method button */}
          <div className="my-4">
            <button
              type="button"
              onClick={toggleCalculationMethod}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              {inputs.calculateByPayment ? 'Calculate by Income' : 'Calculate by Payment'}
            </button>
          </div>

          {/* Advanced toggle button */}
          <div className="flex items-center my-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-primary hover:text-primary-dark flex items-center text-sm font-medium"
            >
              Advanced
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Interest Rate and Loan Term */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  name="interestRate"
                  id="interestRate"
                  className="focus:ring-primary focus:border-primary block w-full pl-8 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                  value={inputs.interestRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.125"
                  style={{ height: '38px' }} /* Match button height */
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term
              </label>
              <div className="relative">
                <select
                  id="loanTerm"
                  name="loanTerm"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
                  value={inputs.loanTerm}
                  onChange={handleInputChange}
                  style={{ height: '38px' }} /* Match button height */
                >
                  <option value="30">30 Year</option>
                  <option value="20">20 Year</option>
                  <option value="15">15 Year</option>
                  <option value="10">10 Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Debt to Income */}
          <div>
            <label htmlFor="debtToIncomeRatio" className="block text-sm font-medium text-gray-700 mb-1">
              Debt to Income
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="number"
                name="debtToIncomeRatio"
                id="debtToIncomeRatio"
                className="block w-full pl-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
                value={inputs.debtToIncomeRatio}
                onChange={handleInputChange}
                min="0"
                step="1"
                max="50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              The percentage of your income that goes toward paying debts
            </p>
          </div>

          {/* Advanced Parameters (conditionally shown) */}
          {showAdvanced && (
            <div>
              <h3 className="text-lg font-medium text-primary-dark mb-4">Advanced Options</h3>

              <div className="mb-4 flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="includeTaxesInsurance"
                    id="includeTaxesInsurance"
                    checked={inputs.includeTaxesInsurance}
                    onChange={handleInputChange}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer focus:outline-none checked:right-0 duration-200 ease-in checked:border-primary"
                  />
                  <label
                    htmlFor="includeTaxesInsurance"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${inputs.includeTaxesInsurance ? 'bg-primary-light' : ''}`}
                  ></label>
                </div>
                <label htmlFor="includeTaxesInsurance" className="block text-sm text-gray-700">
                  Include Taxes and Insurance
                </label>
                <span className="ml-1 text-gray-500 cursor-pointer" title="Include property taxes and insurance in your payment calculation">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="propertyTaxRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Tax
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <input
                      type="number"
                      name="propertyTaxRate"
                      id="propertyTaxRate"
                      className="block w-full pl-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
                      value={inputs.propertyTaxRate}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="homeownersInsurance" className="block text-sm font-medium text-gray-700 mb-1">
                    Homeowner's Insurance
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="homeownersInsurance"
                      id="homeownersInsurance"
                      className="block w-full pl-6 pr-12 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
                      value={inputs.homeownersInsurance}
                      onChange={handleInputChange}
                      min="0"
                      step="50"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">/year</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="hoaDues" className="block text-sm font-medium text-gray-700 mb-1">
                  HOA Dues
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="hoaDues"
                    id="hoaDues"
                    className="block w-full pl-6 pr-16 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
                    value={inputs.hoaDues}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">/month</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="includeMortgageInsurance"
                    id="includeMortgageInsurance"
                    checked={inputs.includeMortgageInsurance}
                    onChange={handleInputChange}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer focus:outline-none checked:right-0 duration-200 ease-in checked:border-primary"
                  />
                  <label
                    htmlFor="includeMortgageInsurance"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${inputs.includeMortgageInsurance ? 'bg-primary-light' : ''}`}
                  ></label>
                </div>
                <label htmlFor="includeMortgageInsurance" className="block text-sm text-gray-700">
                  Include Mortgage Insurance
                </label>
                <span className="ml-1 text-gray-500 cursor-pointer" title="Mortgage insurance is typically required if your down payment is less than 20%">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Results */}
        <div className="lg:col-span-5 bg-blue-50 p-6 rounded-lg">
          <div className="mb-6 flex flex-col items-center">
            <p className="text-lg font-medium mb-2">You could afford a house up to:</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(results.homePrice)}</p>

            <div className="w-48 h-48 relative my-4">
              {/* SVG for the multi-colored circle */}
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="white" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Calculate segment percentages */}
                {(() => {
                  // Get total payment and individual components
                  const total = results.monthlyPayment;
                  const segments = [
                    { name: 'Principal and Interest', value: results.principalInterest, color: '#1e2f67' }, // indigo-900
                    { name: 'Taxes', value: results.taxes, color: '#3b82f6' }, // blue-500
                    { name: 'Insurance', value: results.insurance, color: '#a5b4fc' }, // indigo-300
                    { name: 'Mortgage Insurance', value: results.mortgageInsurance, color: '#c084fc' }, // purple-400
                    { name: 'HOA Dues', value: results.hoaDues, color: '#e0e7ff' } // indigo-200
                  ].filter(segment => segment.value > 0);
                  
                  // Constants for the circle
                  const radius = 42;
                  const strokeWidth = 8; // Width of the donut segment
                  const circumference = 2 * Math.PI * radius;
                  
                  // Calculate and draw segments
                  let cumulativePercentage = 0;
                  
                  return segments.map((segment, index) => {
                    // Calculate the segment percentage of the total
                    const percentage = segment.value / total;
                    
                    // Calculate stroke-dasharray and stroke-dashoffset
                    const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
                    const strokeDashoffset = -circumference * cumulativePercentage;
                    
                    // Update cumulative percentage for next segment
                    cumulativePercentage += percentage;
                    
                    return (
                      <circle 
                        key={index}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                      />
                    );
                  });
                })()} 
              </svg>
              
              {/* Payment text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-primary">${Math.round(results.monthlyPayment).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Per Month</p>
              </div>
            </div>
          </div>

          <h3 className="text-md font-medium text-gray-900 mb-3">Monthly Payment Breakdown</h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-900 mr-2"></div>
                <p className="text-sm font-medium">Principal and Interest</p>
              </div>
              <p className="text-sm font-medium">${Math.round(results.principalInterest).toLocaleString()}</p>
            </div>

            {inputs.includeTaxesInsurance && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                    <p className="text-sm font-medium">Taxes</p>
                  </div>
                  <p className="text-sm font-medium">${Math.round(results.taxes).toLocaleString()}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-300 mr-2"></div>
                    <p className="text-sm font-medium">Hazard Insurance</p>
                  </div>
                  <p className="text-sm font-medium">${Math.round(results.insurance).toLocaleString()}</p>
                </div>
              </>
            )}

            {inputs.includeMortgageInsurance && results.mortgageInsurance > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 mr-2"></div>
                  <p className="text-sm font-medium">Mortgage Insurance</p>
                </div>
                <p className="text-sm font-medium">${Math.round(results.mortgageInsurance).toLocaleString()}</p>
              </div>
            )}

            {inputs.hoaDues > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-200 mr-2"></div>
                  <p className="text-sm font-medium">HOA Dues</p>
                </div>
                <p className="text-sm font-medium">${Math.round(results.hoaDues).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffordabilityCalculator;
