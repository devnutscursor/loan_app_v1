import React, { useState } from 'react';
import AffordabilityCalculator from './AffordabilityCalculator';
import MortgageCalculator from './MortgageCalculator';
import RefinanceCalculator from './RefinanceCalculator';

/**
 * CalculatorContainer - A tabbed container component that houses all financial calculators
 * and allows users to switch between them.
 */
const CalculatorContainer = () => {
  // State to track active calculator
  const [activeCalculator, setActiveCalculator] = useState('affordability');

  // Array of available calculators
  const calculators = [
    { id: 'affordability', name: 'Affordability Calculator', description: 'Estimate how much home you can afford' },
    { id: 'mortgage', name: 'Mortgage Calculator', description: 'Calculate your monthly payments' },
    { id: 'refinance', name: 'Refinance Calculator', description: 'See if refinancing makes sense' }
  ];

  // Render the active calculator component
  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'affordability':
        return <AffordabilityCalculator />;
      case 'mortgage':
        return <MortgageCalculator />;
      case 'refinance':
        return <RefinanceCalculator />;
      default:
        return <AffordabilityCalculator />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Calculator navigation tabs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="flex -mb-px px-4 sm:px-6">
          {calculators.map(calculator => (
            <button
              key={calculator.id}
              onClick={() => setActiveCalculator(calculator.id)}
              className={`inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeCalculator === calculator.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap mx-4 first:ml-0`}
            >
              {calculator.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Calculator description */}
      <div className="bg-gray-50 px-4 py-2 sm:px-6">
        <p className="text-sm text-gray-600">
          {calculators.find(calc => calc.id === activeCalculator)?.description}
        </p>
      </div>
      
      {/* Active calculator component */}
      <div className="p-4 sm:p-6">
        {renderCalculator()}
      </div>
    </div>
  );
};

export default CalculatorContainer;
