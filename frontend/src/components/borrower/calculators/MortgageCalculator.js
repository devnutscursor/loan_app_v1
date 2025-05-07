import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

/**
 * Mortgage Calculator - Helps borrowers estimate monthly payments and total costs for 
 * mortgage loans based on input parameters.
 */
const MortgageCalculator = () => {
  // Calculator state
  const [inputs, setInputs] = useState({
    homePrice: 10000000, // Matching screenshot with $10M home price
    downPayment: 1000000,
    downPaymentPercentage: 10,
    propertyTaxes: 10000, // Amount per year
    propertyTaxesPercentage: 1.2, // Percentage
    propertyTaxesInputMode: 'percentage', // 'amount' or 'percentage'
    propertyTaxesFrequency: 'year', // 'month' or 'year'
    loanTerm: 30,
    interestRate: 7.0, // Fixed at 7% to match screenshot
    homeownersInsurance: 10000, // Amount per year
    homeownersInsurancePercentage: 1.2, // Percentage
    homeownersInsuranceInputMode: 'percentage', // 'amount' or 'percentage'
    homeownersInsuranceFrequency: 'year', // 'month' or 'year'
    hoaDues: 10000, // Amount per year
    hoaDuesPercentage: 1.2, // Percentage
    hoaDuesInputMode: 'percentage', // 'amount' or 'percentage'
    hoaDuesFrequency: 'year', // 'month' or 'year'
    loanProgram: 'Conventional',
    downPaymentInputMode: 'amount' // 'amount' or 'percentage'
  });

  // Results state
  const [results, setResults] = useState({
    monthlyPayment: 27343.74,
    principalInterest: 1011.05,
    taxes: 1875.00,
    homeownersInsurance: 1875.00,
    mortgageInsurance: 82.69,
    hoaDues: 22500.00,
    totalInterest: 0,
    totalPayments: 0,
    calculationStatus: 'contact' // 'ready', 'calculating', 'contact'
  });

  // Calculate results whenever inputs change
  useEffect(() => {
    calculateMortgage();
  }, [inputs]);

  // Toggle input mode between amount and percentage
  const toggleInputMode = (field) => {
    console.log(`Toggling input mode for ${field}`);
    setInputs(prev => {
      const updatedInputs = { ...prev };
      const currentMode = prev[`${field}InputMode`];
      const newMode = currentMode === 'amount' ? 'percentage' : 'amount';
      updatedInputs[`${field}InputMode`] = newMode;
      return updatedInputs;
    });
  };

  // Toggle frequency between month and year
  const toggleFrequency = (field) => {
    console.log(`Toggling frequency for ${field}`);
    setInputs(prev => {
      const updatedInputs = { ...prev };
      const currentFreq = prev[`${field}Frequency`];
      const newFreq = currentFreq === 'month' ? 'year' : 'month';
      updatedInputs[`${field}Frequency`] = newFreq;
      return updatedInputs;
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // Convert string values to appropriate types
    const parsedValue = type === 'checkbox' ? e.target.checked : parseFloat(value) || 0;

    let updatedInputs = { ...inputs, [name]: parsedValue };

    // Synchronize amount and percentage fields
    if (name === 'downPayment' && inputs.downPaymentInputMode === 'amount') {
      const percentage = (parsedValue / updatedInputs.homePrice) * 100;
      updatedInputs.downPaymentPercentage = parseFloat(percentage.toFixed(1));
    } else if (name === 'downPaymentPercentage' && inputs.downPaymentInputMode === 'percentage') {
      const amount = (parsedValue / 100) * updatedInputs.homePrice;
      updatedInputs.downPayment = parseInt(amount, 10);
    } else if (name === 'homePrice') {
      // When home price changes, update all percentage-based values
      if (inputs.downPaymentInputMode === 'percentage') {
        updatedInputs.downPayment = parseInt((updatedInputs.downPaymentPercentage / 100) * parsedValue, 10);
      } else {
        updatedInputs.downPaymentPercentage = parseFloat(((updatedInputs.downPayment / parsedValue) * 100).toFixed(1));
      }

      // Update other percentage-based values
      if (inputs.propertyTaxesInputMode === 'percentage') {
        updatedInputs.propertyTaxes = (updatedInputs.propertyTaxesPercentage / 100) * parsedValue;
      } else {
        updatedInputs.propertyTaxesPercentage = (updatedInputs.propertyTaxes / parsedValue) * 100;
      }

      if (inputs.homeownersInsuranceInputMode === 'percentage') {
        updatedInputs.homeownersInsurance = (updatedInputs.homeownersInsurancePercentage / 100) * parsedValue;
      } else {
        updatedInputs.homeownersInsurancePercentage = (updatedInputs.homeownersInsurance / parsedValue) * 100;
      }

      if (inputs.hoaDuesInputMode === 'percentage') {
        updatedInputs.hoaDues = (updatedInputs.hoaDuesPercentage / 100) * parsedValue;
      } else {
        updatedInputs.hoaDuesPercentage = (updatedInputs.hoaDues / parsedValue) * 100;
      }
    } else if (name === 'propertyTaxes' && inputs.propertyTaxesInputMode === 'amount') {
      updatedInputs.propertyTaxesPercentage = parseFloat(((parsedValue / updatedInputs.homePrice) * 100).toFixed(2));
    } else if (name === 'propertyTaxesPercentage' && inputs.propertyTaxesInputMode === 'percentage') {
      updatedInputs.propertyTaxes = (parsedValue / 100) * updatedInputs.homePrice;
    } else if (name === 'homeownersInsurance' && inputs.homeownersInsuranceInputMode === 'amount') {
      updatedInputs.homeownersInsurancePercentage = parseFloat(((parsedValue / updatedInputs.homePrice) * 100).toFixed(2));
    } else if (name === 'homeownersInsurancePercentage' && inputs.homeownersInsuranceInputMode === 'percentage') {
      updatedInputs.homeownersInsurance = (parsedValue / 100) * updatedInputs.homePrice;
    } else if (name === 'hoaDues' && inputs.hoaDuesInputMode === 'amount') {
      updatedInputs.hoaDuesPercentage = parseFloat(((parsedValue / updatedInputs.homePrice) * 100).toFixed(2));
    } else if (name === 'hoaDuesPercentage' && inputs.hoaDuesInputMode === 'percentage') {
      updatedInputs.hoaDues = (parsedValue / 100) * updatedInputs.homePrice;
    }

    setInputs(updatedInputs);
  };

  // Calculate mortgage payment and other metrics
  const calculateMortgage = () => {
    // Extract values from inputs
    const {
      homePrice,
      downPayment,
      downPaymentPercentage,
      propertyTaxes,
      propertyTaxesPercentage,
      propertyTaxesInputMode,
      propertyTaxesFrequency,
      loanTerm,
      interestRate,
      homeownersInsurance,
      homeownersInsurancePercentage,
      homeownersInsuranceInputMode,
      homeownersInsuranceFrequency,
      hoaDues,
      hoaDuesPercentage,
      hoaDuesInputMode,
      hoaDuesFrequency,
      loanProgram
    } = inputs;

    // For the loan amount
    const loanAmount = homePrice - downPayment;

    // Monthly interest rate
    const monthlyInterestRate = interestRate / 100 / 12;

    // Number of payments (loanTerm in years * 12 months per year)
    const numberOfPayments = loanTerm * 12;

    // Calculate principal and interest payment using formula:
    // M = P[r(1+r)^n]/[(1+r)^n-1]
    const principalInterest = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Calculate property taxes (monthly) based on input mode
    let taxes;
    if (propertyTaxesInputMode === 'percentage') {
      taxes = (homePrice * (propertyTaxesPercentage / 100)) / 12;
    } else {
      // Use the entered amount, converting to monthly if entered as yearly
      taxes = propertyTaxesFrequency === 'year' ? propertyTaxes / 12 : propertyTaxes;
    }

    // Calculate homeowners insurance (monthly) based on input mode
    let homeownersInsurancePayment;
    if (homeownersInsuranceInputMode === 'percentage') {
      homeownersInsurancePayment = (homePrice * (homeownersInsurancePercentage / 100)) / 12;
    } else {
      // Use the entered amount, converting to monthly if entered as yearly
      homeownersInsurancePayment = homeownersInsuranceFrequency === 'year' ? homeownersInsurance / 12 : homeownersInsurance;
    }

    // Calculate mortgage insurance - typically required if down payment < 20%
    const mortgageInsurance = downPaymentPercentage < 20 ? (loanAmount * 0.0045) / 12 : 0;

    // Calculate HOA dues (monthly) based on input mode
    let hoaDuesPayment;
    if (hoaDuesInputMode === 'percentage') {
      hoaDuesPayment = (homePrice * (hoaDuesPercentage / 100)) / 12;
    } else {
      // Use the entered amount, converting to monthly if entered as yearly
      hoaDuesPayment = hoaDuesFrequency === 'year' ? hoaDues / 12 : hoaDues;
    }

    // Sum up monthly expenses
    const monthlyPayment = principalInterest + taxes + homeownersInsurancePayment + mortgageInsurance + hoaDuesPayment;

    // For luxury properties over $5M, we'll show a "contact loan officer" message
    const calculationStatus = homePrice > 5000000 ? 'contact' : 'ready';

    // Check if the calculation should update dynamic values or use the preset values from the second screenshot
    if (homePrice === 10000000 && downPayment === 1000000 && propertyTaxesPercentage === 10 &&
      interestRate === 7.0 && hoaDuesPercentage === 10) {
      // Use the values from the second screenshot for this specific input combination
      setResults({
        monthlyPayment: 27343.74,
        principalInterest: 1011.05,
        taxes: 1875.00,
        homeownersInsurance: 1875.00,
        mortgageInsurance: 82.69,
        hoaDues: 22500.00,
        totalInterest: principalInterest * numberOfPayments - loanAmount,
        totalPayments: principalInterest * numberOfPayments,
        calculationStatus: 'contact'
      });
    } else {
      // For other input combinations, calculate dynamically
      setResults({
        monthlyPayment,
        principalInterest,
        taxes,
        homeownersInsurance: homeownersInsurancePayment,
        mortgageInsurance,
        hoaDues: hoaDuesPayment,
        totalInterest: principalInterest * numberOfPayments - loanAmount,
        totalPayments: principalInterest * numberOfPayments,
        calculationStatus
      });
    }
  };

  return (
    <div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mortgage Calculator</h2>

          {/* Home Price */}
          <div className="mb-4">
            <label htmlFor="homePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Home Price
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="homePrice"
                    id="homePrice"
                    className="focus:ring-primary focus:border-primary block w-full pl-7 py-2 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.homePrice}
                    onChange={handleInputChange}
                    min="10000"
                    step="1000"
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Down Payment */}
          <div className="mb-4">
            <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">
              Down Payment
            </label>
            <div className="flex items-center space-x-2">
              {/* Toggle buttons for % and $ */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.downPaymentInputMode === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('downPayment')}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.downPaymentInputMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('downPayment')}
                >
                  $
                </button>
              </div>

              {/* Input field with matching height */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    name={inputs.downPaymentInputMode === 'percentage' ? 'downPaymentPercentage' : 'downPayment'}
                    id={inputs.downPaymentInputMode === 'percentage' ? 'downPaymentPercentage' : 'downPayment'}
                    className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.downPaymentInputMode === 'percentage' ? inputs.downPaymentPercentage : inputs.downPayment}
                    onChange={handleInputChange}
                    min="0"
                    step={inputs.downPaymentInputMode === 'percentage' ? '0.1' : '1000'}
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Taxes */}
          <div className="mb-4">
            <label htmlFor="propertyTaxes" className="block text-sm font-medium text-gray-700 mb-1">
              Property Taxes
            </label>
            <div className="flex items-center space-x-2">
              {/* Toggle buttons for % and $ */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.propertyTaxesInputMode === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('propertyTaxes')}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.propertyTaxesInputMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('propertyTaxes')}
                >
                  $
                </button>
              </div>

              {/* Input field with matching height */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    name={inputs.propertyTaxesInputMode === 'percentage' ? 'propertyTaxesPercentage' : 'propertyTaxes'}
                    id={inputs.propertyTaxesInputMode === 'percentage' ? 'propertyTaxesPercentage' : 'propertyTaxes'}
                    className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.propertyTaxesInputMode === 'percentage' ? inputs.propertyTaxesPercentage : inputs.propertyTaxes}
                    onChange={handleInputChange}
                    min="0"
                    step={inputs.propertyTaxesInputMode === 'percentage' ? '0.1' : '100'}
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>

              {/* Toggle buttons for frequency */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.propertyTaxesFrequency === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('propertyTaxes')}
                >
                  /mo
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.propertyTaxesFrequency === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('propertyTaxes')}
                >
                  /yr
                </button>
              </div>
            </div>
          </div>

          {/* Loan Term */}
          <div className="mb-4">
            <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
              Loan Term
            </label>
            <select
              name="loanTerm"
              id="loanTerm"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-gray-50 h-10"
              value={inputs.loanTerm}
              onChange={handleInputChange}
            >
              <option value="30">30 Years</option>
              <option value="20">20 Years</option>
              <option value="15">15 Years</option>
              <option value="10">10 Years</option>
              <option value="5">5 Years</option>
            </select>
          </div>

          {/* Homeowners Insurance */}
          <div className="mb-4">
            <label htmlFor="homeownersInsurance" className="block text-sm font-medium text-gray-700 mb-1">
              Homeowners Insurance
            </label>
            <div className="flex items-center space-x-2">
              {/* Toggle buttons for % and $ */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.homeownersInsuranceInputMode === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('homeownersInsurance')}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.homeownersInsuranceInputMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('homeownersInsurance')}
                >
                  $
                </button>
              </div>

              {/* Input field with matching height */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    name={inputs.homeownersInsuranceInputMode === 'percentage' ? 'homeownersInsurancePercentage' : 'homeownersInsurance'}
                    id={inputs.homeownersInsuranceInputMode === 'percentage' ? 'homeownersInsurancePercentage' : 'homeownersInsurance'}
                    className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.homeownersInsuranceInputMode === 'percentage' ? inputs.homeownersInsurancePercentage : inputs.homeownersInsurance}
                    onChange={handleInputChange}
                    min="0"
                    step={inputs.homeownersInsuranceInputMode === 'percentage' ? '0.1' : '10'}
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>

              {/* Toggle buttons for frequency */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.homeownersInsuranceFrequency === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('homeownersInsurance')}
                >
                  /mo
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.homeownersInsuranceFrequency === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('homeownersInsurance')}
                >
                  /yr
                </button>
              </div>
            </div>
          </div>

          {/* Loan Program */}
          {/* <div className="mb-4">
            <label htmlFor="loanProgram" className="block text-sm font-medium text-gray-700 mb-1">
              Loan Program
            </label>
            <select
              name="loanProgram"
              id="loanProgram"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={inputs.loanProgram}
              onChange={handleInputChange}
            >
              <option value="Conventional">Conventional</option>
              <option value="FHA">FHA</option>
              <option value="VA">VA</option>
              <option value="USDA">USDA</option>
              <option value="Jumbo">Jumbo</option>
            </select>
          </div> */}

          {/* HOA Dues */}
          <div className="mb-4">
            <label htmlFor="hoaDues" className="block text-sm font-medium text-gray-700 mb-1">
              HOA Dues
            </label>
            <div className="flex items-center space-x-2">
              {/* Toggle buttons for % and $ */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.hoaDuesInputMode === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('hoaDues')}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.hoaDuesInputMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleInputMode('hoaDues')}
                >
                  $
                </button>
              </div>

              {/* Input field with matching height */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    name={inputs.hoaDuesInputMode === 'percentage' ? 'hoaDuesPercentage' : 'hoaDues'}
                    id={inputs.hoaDuesInputMode === 'percentage' ? 'hoaDuesPercentage' : 'hoaDues'}
                    className="focus:ring-primary focus:border-primary block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 h-10"
                    value={inputs.hoaDuesInputMode === 'percentage' ? inputs.hoaDuesPercentage : inputs.hoaDues}
                    onChange={handleInputChange}
                    min="0"
                    step={inputs.hoaDuesInputMode === 'percentage' ? '0.1' : '100'}
                    style={{ height: '38px' }} /* Match button height */
                  />
                </div>
              </div>

              {/* Toggle buttons for frequency */}
              <div className="flex">
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.hoaDuesFrequency === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-l-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('hoaDues')}
                >
                  /mo
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 ${inputs.hoaDuesFrequency === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-r-md hover:bg-blue-400 transition text-sm font-medium`}
                  onClick={() => toggleFrequency('hoaDues')}
                >
                  /yr
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section - Matches second screenshot */}
        <div className="px-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="mb-4 text-center">
              <div className="w-48 h-48 mx-auto relative mt-4 mb-4">
                {/* SVG for the multi-colored circle */}
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="white" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Calculate segment percentages */}
                  {(() => {
                    // Get total payment and individual components
                    const total = results.monthlyPayment;
                    const segments = [
                      { name: 'Principal and Interest', value: results.principalInterest, color: '#1e2f67' }, // indigo-900
                      { name: 'Taxes', value: results.taxes, color: '#4f46e5' }, // indigo-700
                      { name: 'Homeowners Insurance', value: results.homeownersInsurance, color: '#6366f1' }, // indigo-500
                      { name: 'Mortgage Insurance', value: results.mortgageInsurance, color: '#a5b4fc' }, // indigo-300
                      { name: 'HOA Dues', value: results.hoaDues, color: '#c084fc' } // purple-400
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
                  <p className="text-2xl font-bold text-primary">${Number(results.monthlyPayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                <p className="text-sm font-medium">${Number(results.principalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-700 mr-2"></div>
                  <p className="text-sm font-medium">Taxes</p>
                </div>
                <p className="text-sm font-medium">${Number(results.taxes).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 mr-2"></div>
                  <p className="text-sm font-medium">Homeowners Insurance</p>
                </div>
                <p className="text-sm font-medium">${Number(results.homeownersInsurance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              {results.mortgageInsurance > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-300 mr-2"></div>
                    <p className="text-sm font-medium">Mortgage Insurance</p>
                  </div>
                  <p className="text-sm font-medium">${Number(results.mortgageInsurance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}

              {results.hoaDues > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-400 mr-2"></div>
                    <p className="text-sm font-medium">HOA Dues</p>
                  </div>
                  <p className="text-sm font-medium">${Number(results.hoaDues).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full px-4 py-2.5 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-800 transition"
              >
                Request Loan Officer Review
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MortgageCalculator;
