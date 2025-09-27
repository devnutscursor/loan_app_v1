import React from 'react';
import RateCard from './RateCard';

const RatesGrid = ({ rates, saving }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8">
      {rates.map((rate) => (
        <RateCard
          key={rate.programType}
          rate={rate}
          saving={saving}
        />
      ))}
    </div>
  );
};

export default RatesGrid;
