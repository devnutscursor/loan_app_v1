import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

/**
 * Mortgage Calculator - Helps borrowers estimate monthly payments and total costs for different
 * loan scenarios based on loan amount, interest rate, and term.
 */
const MortgageCalculator = () => {
  // Calculator state
  const [inputs, setInputs] = useState({
    homePrice: 350000,
    downPayment: 70000,
    downPaymentPercentage: 20,
    loanAmount: 280000,
    interestRate: 6.5,
    loanTerm: 30,
    includeTaxesInsurance: true,
    propertyTaxRate: 1.2,
    homeownersInsurance: 1200,
    hoaDues: 0,
    includeMortgageInsurance: true
  });

  // Results state
  const [results, setResults] = useState({
    monthlyPayment: 0,
    principalInterest: 0,
    taxes: 0,
    insurance: 0,
    mortgageInsurance: 0,
    hoaDues: 0,
    totalInterest: 0,
    totalPayments: 0,
    totalCost: 0
  });

  // Show/hide amortization table
  const [showAmortizationTable, setShowAmortizationTable] = useState(false);
  
  // Amortization schedule (limited to first 12 periods for display)
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);

  // Use effect to synchronize home price and down payment
  useEffect(() => {
    calculateMortgage();
  }, [inputs]);

  // Handle amount input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert string values to appropriate types
    const parsedValue = type === 'checkbox' ? e.target.checked : parseFloat(value) || 0;
    
    let updatedInputs = { ...inputs, [name]: parsedValue };
    
    // Synchronize down payment and percentage when either changes
    if (name === 'downPayment') {
      const percentage = (parsedValue / updatedInputs.homePrice) * 100;
      updatedInputs.downPaymentPercentage = parseFloat(percentage.toFixed(2));
      updatedInputs.loanAmount = updatedInputs.homePrice - parsedValue;
    } else if (name === 'downPaymentPercentage') {
      const amount = (parsedValue / 100) * updatedInputs.homePrice;
      updatedInputs.downPayment = parseInt(amount, 10);
      updatedInputs.loanAmount = updatedInputs.homePrice - updatedInputs.downPayment;
    } else if (name === 'homePrice') {
      // When home price changes, maintain down payment percentage
      const amount = (updatedInputs.downPaymentPercentage / 100) * parsedValue;
      updatedInputs.downPayment = parseInt(amount, 10);
      updatedInputs.loanAmount = parsedValue - updatedInputs.downPayment;
    } else if (name === 'loanAmount') {
      // When loan amount changes, recalculate down payment
      updatedInputs.downPayment = updatedInputs.homePrice - parsedValue;
      updatedInputs.downPaymentPercentage = parseFloat(((updatedInputs.downPayment / updatedInputs.homePrice) * 100).toFixed(2));
    }
    
    setInputs(updatedInputs);
  };

  // Calculate mortgage payment and other metrics
  const calculateMortgage = () => {
    // Extract values from inputs
    const {
      homePrice,
      downPayment,
      loanAmount,
      interestRate,
      loanTerm,
      includeTaxesInsurance,
      propertyTaxRate,
      homeownersInsurance,
      hoaDues,
      includeMortgageInsurance
    } = inputs;

    // Monthly interest rate
    const monthlyInterestRate = interestRate / 100 / 12;
    
    // Number of payments (loanTerm in years * 12 months per year)
    const numberOfPayments = loanTerm * 12;
    
    // Calculate principal and interest payment using formula:
    // M = P[r(1+r)^n]/[(1+r)^n-1]
    const principalInterest = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    // Calculate property taxes (monthly)
    const taxes = includeTaxesInsurance ? (homePrice * (propertyTaxRate / 100)) / 12 : 0;
    
    // Calculate homeowners insurance (monthly)
    const insurance = includeTaxesInsurance ? homeownersInsurance / 12 : 0;
    
    // Calculate mortgage insurance (monthly) if down payment < 20%
    const downPaymentPercentage = (downPayment / homePrice) * 100;
    const mortgageInsurance = includeMortgageInsurance && downPaymentPercentage < 20 
      ? (loanAmount * 0.005) / 12 // Example rate of 0.5% annually
      : 0;
    
    // Monthly HOA dues
    const monthlyHoaDues = hoaDues;
    
    // Total monthly payment
    const monthlyPayment = principalInterest + taxes + insurance + mortgageInsurance + monthlyHoaDues;
    
    // Total interest paid over life of loan
    const totalInterest = (principalInterest * numberOfPayments) - loanAmount;
    
    // Total payments over life of loan
    const totalPayments = monthlyPayment * numberOfPayments;
    
    // Total cost (home price + total interest + all fees)
    const totalCost = homePrice + totalInterest + (taxes * numberOfPayments) + (insurance * numberOfPayments) + (mortgageInsurance * numberOfPayments) + (monthlyHoaDues * numberOfPayments);
    
    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(loanAmount, monthlyInterestRate, numberOfPayments, principalInterest);
    
    // Update results
    setResults({
      monthlyPayment,
      principalInterest,
      taxes,
      insurance,
      mortgageInsurance,
      hoaDues: monthlyHoaDues,
      totalInterest,
      totalPayments,
      totalCost
    });
    
    // Update amortization schedule (limit to first 12 for display)
    setAmortizationSchedule(schedule.slice(0, 12));
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (principal, rate, periods, payment) => {
    let schedule = [];
    let balance = principal;
    let totalInterest = 0;
    
    for (let period = 1; period <= periods; period++) {
      // Calculate interest for this period
      const interestPayment = balance * rate;
      
      // Calculate principal for this period
      const principalPayment = payment - interestPayment;
      
      // Update balance
      balance -= principalPayment;
      if (balance < 0) balance = 0;
      
      // Update total interest
      totalInterest += interestPayment;
      
      // Add to schedule
      schedule.push({
        period,
        payment,
        principalPayment,
        interestPayment,
        totalInterest,
        balance
      });
      
      // If we've paid off the loan, we're done
      if (balance <= 0) break;
    }
    
    return schedule;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mortgage Calculator</h2>
      
      {/* Input fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="homePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Home Price
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="homePrice"
              id="homePrice"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              value={inputs.homePrice}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="downPayment"
                id="downPayment"
                className="focus:ring-primary focus:border-primary block w-full pl-7 pr-4 sm:text-sm border-gray-300 rounded-md"
                value={inputs.downPayment}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                name="downPaymentPercentage"
                id="downPaymentPercentage"
                className="focus:ring-primary focus:border-primary block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
                value={inputs.downPaymentPercentage}
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
        </div>
        
        <div>
          <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Amount
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="loanAmount"
              id="loanAmount"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              value={inputs.loanAmount}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
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
              className="focus:ring-primary focus:border-primary block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
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
        
        <div className="flex items-start mt-4">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              name="includeTaxesInsurance"
              id="includeTaxesInsurance"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={inputs.includeTaxesInsurance}
              onChange={handleInputChange}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="includeTaxesInsurance" className="font-medium text-gray-700">
              Include Taxes and Insurance
            </label>
          </div>
        </div>
      </div>
      
      {/* Additional options if taxes and insurance included */}
      {inputs.includeTaxesInsurance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-md">
          <div>
            <label htmlFor="propertyTaxRate" className="block text-sm font-medium text-gray-700 mb-1">
              Property Tax Rate
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="number"
                name="propertyTaxRate"
                id="propertyTaxRate"
                className="focus:ring-primary focus:border-primary block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
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
                step="100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">/year</span>
              </div>
            </div>
          </div>
          
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
          
          <div className="flex items-start mt-4">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="includeMortgageInsurance"
                id="includeMortgageInsurance"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={inputs.includeMortgageInsurance}
                onChange={handleInputChange}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="includeMortgageInsurance" className="font-medium text-gray-700">
                Include Mortgage Insurance
              </label>
              <p className="text-gray-500">(Required for down payments less than 20%)</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Results Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="mb-8">
          <div className="bg-primary text-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Monthly Payment</h3>
              <p className="text-4xl font-bold">{formatCurrency(results.monthlyPayment)}</p>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="text-sm text-white/80">Loan Amount</h4>
                <p className="text-xl font-semibold">{formatCurrency(inputs.loanAmount)}</p>
              </div>
              <div className="text-center">
                <h4 className="text-sm text-white/80">Interest Rate</h4>
                <p className="text-xl font-semibold">{inputs.interestRate}%</p>
              </div>
              <div className="text-center">
                <h4 className="text-sm text-white/80">Loan Term</h4>
                <p className="text-xl font-semibold">{inputs.loanTerm} years</p>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                <p className="text-sm font-medium text-gray-500">Insurance</p>
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
        
        <h3 className="text-lg font-medium text-gray-900 mb-3">Loan Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Total Principal</p>
            <p className="text-lg font-medium text-gray-800">{formatCurrency(inputs.loanAmount)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Total Interest</p>
            <p className="text-lg font-medium text-gray-800">{formatCurrency(results.totalInterest)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Total Cost of Loan</p>
            <p className="text-lg font-medium text-gray-800">{formatCurrency(results.totalCost)}</p>
          </div>
        </div>
        
        {/* Amortization Schedule Toggle */}
        <div className="mt-6">
          <button
            type="button"
            className="text-primary hover:text-primary-dark flex items-center text-sm"
            onClick={() => setShowAmortizationTable(!showAmortizationTable)}
          >
            <span>{showAmortizationTable ? 'Hide' : 'Show'} Amortization Schedule</span>
            <svg 
              className={`ml-1 h-5 w-5 transform ${showAmortizationTable ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Amortization Table */}
        {showAmortizationTable && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Principal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {amortizationSchedule.map((payment) => (
                  <tr key={payment.period}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.period}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.payment)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.principalPayment)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.interestPayment)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-gray-500 mt-2">
              * Showing first 12 payments of {inputs.loanTerm * 12} total payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageCalculator;
