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
    debtToIncomeRatio: 36
  });

  // Results state
  const [results, setResults] = useState({
    monthlyPayment: 0,
    homePrice: 0,
    principalInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoaDues: 0
  });

  // Show/hide advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate results whenever inputs change
  useEffect(() => {
    calculateAffordability();
  }, [inputs]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert string values to appropriate types
    const processedValue = type === 'checkbox' 
      ? e.target.checked 
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
      debtToIncomeRatio
    } = inputs;

    // Monthly income
    const monthlyIncome = annualIncome / 12;
    
    // Maximum monthly payment based on DTI ratio
    const maxMonthlyPayment = (monthlyIncome * (debtToIncomeRatio / 100)) - monthlyDebts;
    
    // Calculate maximum loan amount based on payment, interest rate, and term
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate base loan amount (principal & interest only)
    let piPayment = maxMonthlyPayment;
    
    // Reserve funds for taxes, insurance, and HOA if included
    if (includeTaxesInsurance) {
      // Estimate monthly taxes & insurance as percentage of total payment
      const estimatedTaxesInsurance = hoaDues / 12 + (homeownersInsurance / 12);
      piPayment -= estimatedTaxesInsurance;
    }
    
    // Calculate maximum loan amount using financial formula
    // P = Payment * ((1 - (1 + r)^-n) / r) where P is principal, r is monthly rate, n is # of payments
    const maxLoanAmount = piPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);
    
    // Add down payment to get max home price
    const maxHomePrice = maxLoanAmount + downPayment;
    
    // Calculate detailed payment breakdown
    const loanAmount = maxHomePrice - downPayment;
    const principalInterest = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    // Calculate property taxes (monthly)
    const taxes = includeTaxesInsurance ? (maxHomePrice * (propertyTaxRate / 100)) / 12 : 0;
    
    // Calculate homeowners insurance (monthly)
    const insurance = includeTaxesInsurance ? homeownersInsurance / 12 : 0;
    
    // Calculate mortgage insurance (monthly) - typically required if down payment < 20%
    const downPaymentPercentage = (downPayment / maxHomePrice) * 100;
    const mortgageInsurance = includeMortgageInsurance && downPaymentPercentage < 20 
      ? (loanAmount * 0.0055) / 12 // Example rate of 0.55% annually for PMI
      : 0;
    
    // Monthly HOA dues (if any)
    const monthlyHoaDues = hoaDues;
    
    // Total monthly payment
    const totalMonthlyPayment = principalInterest + taxes + insurance + mortgageInsurance + monthlyHoaDues;
    
    // Update results
    setResults({
      monthlyPayment: totalMonthlyPayment,
      homePrice: maxHomePrice,
      principalInterest,
      taxes,
      insurance,
      mortgageInsurance,
      hoaDues: monthlyHoaDues
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Affordability Calculator</h2>
      
      {/* Input fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Income
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="annualIncome"
              id="annualIncome"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              value={inputs.annualIncome}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="monthlyDebts" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Debts
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="monthlyDebts"
              id="monthlyDebts"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              value={inputs.monthlyDebts}
              onChange={handleInputChange}
              min="0"
              step="50"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="downPayment"
              id="downPayment"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              value={inputs.downPayment}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
          </div>
        </div>
      </div>
      
      {/* Advanced Options Toggle */}
      <div className="mb-6">
        <button
          type="button"
          className="text-primary hover:text-primary-dark flex items-center text-sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Advanced</span>
          <svg 
            className={`ml-1 h-5 w-5 transform ${showAdvanced ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Advanced Options Section */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-md">
          <div>
            <label htmlFor="debtToIncomeRatio" className="block text-sm font-medium text-gray-700 mb-1">
              Debt to Income Ratio
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="number"
                name="debtToIncomeRatio"
                id="debtToIncomeRatio"
                className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                value={inputs.debtToIncomeRatio}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="number"
                name="interestRate"
                id="interestRate"
                className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                value={inputs.interestRate}
                onChange={handleInputChange}
                min="0"
                max="25"
                step="0.125"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
              Loan Term
            </label>
            <select
              name="loanTerm"
              id="loanTerm"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={inputs.loanTerm}
              onChange={handleInputChange}
            >
              <option value={10}>10 Year</option>
              <option value={15}>15 Year</option>
              <option value={20}>20 Year</option>
              <option value={30}>30 Year</option>
            </select>
          </div>
          
          <div className="flex items-center h-full pt-6">
            <input
              type="checkbox"
              name="includeTaxesInsurance"
              id="includeTaxesInsurance"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={inputs.includeTaxesInsurance}
              onChange={handleInputChange}
            />
            <label htmlFor="includeTaxesInsurance" className="ml-2 block text-sm text-gray-700">
              Include Taxes and Insurance
            </label>
          </div>
          
          {inputs.includeTaxesInsurance && (
            <>
              <div>
                <label htmlFor="propertyTaxRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Tax Rate
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    type="number"
                    name="propertyTaxRate"
                    id="propertyTaxRate"
                    className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                    value={inputs.propertyTaxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
              
              <div>
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
                    className="focus:ring-primary focus:border-primary block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
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
            </>
          )}
          
          <div>
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
                className="focus:ring-primary focus:border-primary block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
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
          
          <div className="flex items-center h-full">
            <input
              type="checkbox"
              name="includeMortgageInsurance"
              id="includeMortgageInsurance"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={inputs.includeMortgageInsurance}
              onChange={handleInputChange}
            />
            <label htmlFor="includeMortgageInsurance" className="ml-2 block text-sm text-gray-700">
              Include Mortgage Insurance
            </label>
          </div>
        </div>
      )}
      
      {/* Results Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-48 h-48 bg-primary rounded-full flex flex-col items-center justify-center text-white mb-4">
            <p className="text-lg font-medium">You could afford</p>
            <p className="text-3xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
            <p className="text-sm">Per Month</p>
          </div>
          <p className="text-xl font-semibold text-gray-800">
            Home price up to: {formatCurrency(results.homePrice)}
          </p>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-3">Monthly Payment Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Principal & Interest</p>
            <p className="text-lg font-medium text-gray-800">{formatCurrency(results.principalInterest)}</p>
          </div>
          
          {inputs.includeTaxesInsurance && (
            <>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-500">Property Taxes</p>
                <p className="text-lg font-medium text-gray-800">{formatCurrency(results.taxes)}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-500">Homeowner's Insurance</p>
                <p className="text-lg font-medium text-gray-800">{formatCurrency(results.insurance)}</p>
              </div>
            </>
          )}
          
          {inputs.includeMortgageInsurance && results.mortgageInsurance > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Mortgage Insurance</p>
              <p className="text-lg font-medium text-gray-800">{formatCurrency(results.mortgageInsurance)}</p>
            </div>
          )}
          
          {inputs.hoaDues > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">HOA Dues</p>
              <p className="text-lg font-medium text-gray-800">{formatCurrency(results.hoaDues)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffordabilityCalculator;
