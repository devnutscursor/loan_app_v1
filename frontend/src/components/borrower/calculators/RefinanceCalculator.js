import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

/**
 * Refinance Calculator - Helps borrowers determine if refinancing their mortgage is beneficial
 * by comparing current loan terms with potential new terms.
 */
const RefinanceCalculator = () => {
  // Calculator state for current loan
  const [currentLoan, setCurrentLoan] = useState({
    balance: 250000,
    interestRate: 7.5,
    monthlyPayment: 1750,
    remainingTerm: 25 // in years
  });

  // Calculator state for new loan
  const [newLoan, setNewLoan] = useState({
    interestRate: 6.0,
    term: 30, // in years
    closingCosts: 6000
  });

  // Results state
  const [results, setResults] = useState({
    newMonthlyPayment: 0,
    monthlySavings: 0,
    lifetimeSavings: 0,
    breakEvenMonths: 0,
    isRefinancingWorth: false
  });

  // Show/hide advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate results whenever inputs change
  useEffect(() => {
    calculateRefinance();
  }, [currentLoan, newLoan]);

  // Handle input changes for current loan
  const handleCurrentLoanChange = (e) => {
    const { name, value } = e.target;
    setCurrentLoan(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Handle input changes for new loan
  const handleNewLoanChange = (e) => {
    const { name, value } = e.target;
    setNewLoan(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Calculate refinance benefits
  const calculateRefinance = () => {
    // Extract values
    const { balance, interestRate: currentRate, monthlyPayment: currentPayment, remainingTerm } = currentLoan;
    const { interestRate: newRate, term: newTerm, closingCosts } = newLoan;
    
    // Calculate monthly payment for new loan
    const monthlyInterestRate = newRate / 100 / 12;
    const numberOfPayments = newTerm * 12;
    
    // Calculate new monthly payment using formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    const newMonthlyPayment = balance * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    // Calculate monthly savings
    const monthlySavings = currentPayment - newMonthlyPayment;
    
    // Calculate break-even point (in months)
    const breakEvenMonths = monthlySavings <= 0 ? Infinity : Math.ceil(closingCosts / monthlySavings);
    
    // Calculate remaining payments on current loan
    const remainingPayments = remainingTerm * 12;
    
    // Calculate total cost of current loan (remaining)
    const currentTotalCost = currentPayment * remainingPayments;
    
    // Calculate total cost of new loan
    const newTotalCost = (newMonthlyPayment * numberOfPayments) + closingCosts;
    
    // Calculate lifetime savings
    const lifetimeSavings = currentTotalCost - newTotalCost;
    
    // Determine if refinancing is worth it (positive savings and break-even before loan ends)
    const isRefinancingWorth = lifetimeSavings > 0 && breakEvenMonths < Math.min(remainingPayments, numberOfPayments);
    
    // Update results
    setResults({
      newMonthlyPayment,
      monthlySavings,
      lifetimeSavings,
      breakEvenMonths,
      isRefinancingWorth
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Refinance Calculator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Loan Section */}
        <div className="p-4 border border-gray-200 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Current Loan</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="balance"
                  id="balance"
                  className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  value={currentLoan.balance}
                  onChange={handleCurrentLoanChange}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                Current Interest Rate
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="number"
                  name="interestRate"
                  id="interestRate"
                  className="focus:ring-primary focus:border-primary block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
                  value={currentLoan.interestRate}
                  onChange={handleCurrentLoanChange}
                  min="0"
                  max="20"
                  step="0.125"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700 mb-1">
                Current Monthly Payment
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="monthlyPayment"
                  id="monthlyPayment"
                  className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  value={currentLoan.monthlyPayment}
                  onChange={handleCurrentLoanChange}
                  min="0"
                  step="50"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="remainingTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Term (Years)
              </label>
              <input
                type="number"
                name="remainingTerm"
                id="remainingTerm"
                className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                value={currentLoan.remainingTerm}
                onChange={handleCurrentLoanChange}
                min="1"
                max="40"
                step="1"
              />
            </div>
          </div>
        </div>
        
        {/* New Loan Section */}
        <div className="p-4 border border-gray-200 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">New Loan</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="newInterestRate" className="block text-sm font-medium text-gray-700 mb-1">
                New Interest Rate
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="number"
                  name="interestRate"
                  id="newInterestRate"
                  className="focus:ring-primary focus:border-primary block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
                  value={newLoan.interestRate}
                  onChange={handleNewLoanChange}
                  min="0"
                  max="20"
                  step="0.125"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term (Years)
              </label>
              <select
                name="term"
                id="term"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={newLoan.term}
                onChange={handleNewLoanChange}
              >
                <option value={10}>10 Year</option>
                <option value={15}>15 Year</option>
                <option value={20}>20 Year</option>
                <option value={30}>30 Year</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="closingCosts" className="block text-sm font-medium text-gray-700 mb-1">
                Closing Costs
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="closingCosts"
                  id="closingCosts"
                  className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  value={newLoan.closingCosts}
                  onChange={handleNewLoanChange}
                  min="0"
                  step="500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Include all fees, points, and costs associated with the new loan.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced options toggle */}
      <div className="mt-4 mb-6">
        <button
          type="button"
          className="text-primary hover:text-primary-dark flex items-center text-sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Advanced Options</span>
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
      
      {/* Advanced options section */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-md mb-6">
          <p className="text-sm text-gray-700 mb-4">
            Advanced options coming soon, including:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Cash-out refinance calculations</li>
            <li>Tax deduction estimator</li>
            <li>ARM vs fixed-rate comparisons</li>
            <li>Points calculations and break-even analysis</li>
          </ul>
        </div>
      )}
      
      {/* Results Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment comparison */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Comparison</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Payment</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(currentLoan.monthlyPayment)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">New Payment</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(results.newMonthlyPayment)}</p>
              </div>
              
              <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                <p className="text-sm font-medium text-gray-500">Monthly Savings</p>
                <p className={`text-2xl font-semibold ${results.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(results.monthlySavings)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Refinance benefits */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Refinance Benefits</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Break-Even Point</p>
                <p className="text-xl font-semibold text-gray-800">
                  {results.breakEvenMonths === Infinity ? 'Never' : `${results.breakEvenMonths} months`}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Lifetime Savings</p>
                <p className={`text-xl font-semibold ${results.lifetimeSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(results.lifetimeSavings)}
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  results.isRefinancingWorth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {results.isRefinancingWorth ? 'Refinancing is worth it' : 'Refinancing may not be worth it'}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {results.isRefinancingWorth
                    ? `You'll break even in ${results.breakEvenMonths} months and save ${formatCurrency(results.lifetimeSavings)} over the life of the loan.`
                    : results.monthlySavings <= 0
                      ? "Your monthly payment would increase with this refinance."
                      : `You wouldn't break even on closing costs before the end of the loan term.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Interest comparison chart placeholder */}
        <div className="mt-8 p-6 border border-dashed border-gray-300 rounded-lg text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Interest Comparison Chart</h3>
          <p className="mt-1 text-sm text-gray-500">Interactive chart comparing interest paid over time will be available soon.</p>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-8 text-xs text-gray-500">
        <p>
          Disclaimer: This calculator provides estimates based on the information you provide and should not be considered financial advice. 
          Actual loan terms, payments, and savings may vary. Consult with a mortgage professional before making refinancing decisions.
        </p>
      </div>
    </div>
  );
};

export default RefinanceCalculator;
