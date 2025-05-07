import React from 'react';

/**
 * Component that displays the loan qualification status
 */
const CalculationStatusCard = ({ isQualified }) => {
  return (
    <div className={`p-4 mb-6 rounded-md ${isQualified
        ? 'bg-green-50 border border-green-200'
        : 'bg-red-50 border border-red-200'
      }`}>
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-3 ${isQualified ? 'bg-green-100' : 'bg-red-100'
          }`}>
          <span className="text-2xl">
            {isQualified ? '😊' : '😔'}
          </span>
        </div>
        <div>
          <h3 className={`font-semibold ${isQualified ? 'text-green-700' : 'text-red-700'
            }`}>
            Calculation Status: {isQualified ? 'Qualified' : 'Not Qualified'}
          </h3>
          <p className={`text-sm ${isQualified ? 'text-green-600' : 'text-red-600'
            }`}>
            {isQualified
              ? 'Your calculations are looking good, and this scenario is Qualified!'
              : 'Your debt is too high for this type of loan.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalculationStatusCard;
