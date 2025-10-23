import React from "react";

const LoanDetailsSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">
          {/* Back button skeleton */}
          <div className="flex items-center px-2 py-1 rounded">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="ml-1 h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="block w-px h-5 bg-gray-200"></div>
          {/* Title skeleton */}
          <div className="h-7 w-48 bg-gray-200 rounded"></div>
        </div>

        {/* Loan info header skeleton */}
        <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Loan icon skeleton */}
            <div className="flex-shrink-0 bg-gray-200 rounded-md p-2 h-10 w-10"></div>
            <div className="ml-2 min-w-0">
              {/* Loan number skeleton */}
              <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
              {/* Loan type skeleton */}
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-1">
            {/* Circular button skeletons */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-9 bg-gray-200 rounded-full"
              ></div>
            ))}
            {/* Main action button skeleton */}
            <div className="ml-2 h-9 w-40 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Tabs skeleton - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block w-60 flex-shrink-0 mr-6">
          <div className="rounded-xl bg-white p-2 shadow-md border border-gray-100">
            <div className="flex flex-col space-y-2">
              {[1, 2, 3, 4].map((tab) => (
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

        {/* Content area skeleton */}
        <div className="flex-1 w-full">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <div className="h-7 bg-gray-200 rounded w-48"></div>
              <div className="h-7 bg-gray-200 rounded w-24"></div>
            </div>

            {/* Dashboard-like content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4">
              <div className="space-y-4">
                {/* Card 1 */}
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-0 sm:mr-3 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Card 3 */}
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                    <div className="flex items-center">
                      <div className="h-6 w-10 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4"></div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                    <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-36 mb-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-3">
                    <div className="h-16 w-16 rounded-full bg-gray-200 mr-0 sm:mr-3 flex-shrink-0"></div>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailsSkeleton;

