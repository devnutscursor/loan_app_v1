import React from 'react';

const RatesLoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow overflow-hidden border border-gray-100"
        >
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RatesLoadingSkeleton;
