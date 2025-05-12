import React from 'react';

/**
 * Loading skeleton for the loan qualification card
 * Displays a placeholder UI while data is being fetched
 */
const LoadingSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-1/3 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* DTI Circle Skeleton */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-200"></div>
          <div className="mt-2 text-center w-full">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </div>
        
        {/* Payment Info Skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        
        {/* Loan Info Skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
