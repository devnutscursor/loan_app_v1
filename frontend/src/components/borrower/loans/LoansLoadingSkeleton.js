import React from 'react';

const LoansLoadingSkeleton = () => (
  <>
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-pulse">
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4 sm:mt-0 flex items-center">
        <div className="h-10 w-36 bg-gray-200 rounded mr-4"></div>
        <div className="h-10 w-32 bg-gradient-to-r from-blue-200 to-blue-300 rounded"></div>
      </div>
    </div>

    {/* Status Summary Skeleton */}
    <div className="bg-blue-50 p-4 mb-6 rounded-lg animate-pulse">
      <div className="h-5 w-40 bg-blue-200 rounded mb-2"></div>
      <div className="h-4 w-full bg-blue-200 rounded"></div>
    </div>

    {/* Loan Categories Skeletons */}
    {["Pending", "Processing"].map((category, index) => (
      <div key={index} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="h-9 w-28 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

export default LoansLoadingSkeleton;
