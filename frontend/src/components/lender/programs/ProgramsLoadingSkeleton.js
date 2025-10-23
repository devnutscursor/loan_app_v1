import React from 'react';

const ProgramsLoadingSkeleton = () => {
  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {[...Array(6)].map((_, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card Skeleton */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="p-4">
                {/* Card Header - Program Name Skeleton */}
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>

                {/* Card Content - Program Details Skeleton */}
                <div className="space-y-2">
                  {/* Program Type Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>

                  {/* Loan Term Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>

                  {/* Available Status Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>

                {/* Card Footer - Action Button Skeleton */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-center">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProgramsLoadingSkeleton;
