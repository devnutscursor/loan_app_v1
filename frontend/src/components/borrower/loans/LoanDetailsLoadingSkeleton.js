import React from 'react';

const LoanDetailsLoadingSkeleton = () => (
  <div className="flex">
    {/* Tabs Skeleton */}
    <div className="w-60 flex-shrink-0 mr-6 animate-pulse">
      <div className="rounded-xl bg-white p-3 shadow-md border border-gray-100">
        <div className="flex flex-col space-y-2">
          {[1, 2, 3, 4, 5, 6].map((tab) => (
            <div key={tab} className="py-3 px-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="flex-1">
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LoanDetailsLoadingSkeleton;
