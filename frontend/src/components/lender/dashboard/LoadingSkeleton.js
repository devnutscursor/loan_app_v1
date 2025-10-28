import React from 'react';

const LoadingSkeleton = () => {
  return (
    <>
      {/* Stats Cards Loading Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 sm:h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>

      {/* Main Content Layout Loading Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Loans Section Loading Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-full">
                      <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Performance Metrics Loading Skeleton */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-gray-300 rounded-full" 
                        style={{ width: `${(i * 20) + 10}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="flex items-end space-x-1 mb-1">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 w-36 bg-gray-200 rounded mb-4"></div>
                
                <div className="h-3 w-36 bg-gray-200 rounded mb-2"></div>
                <div className="flex items-end space-x-1 mb-1">
                  <div className="h-8 w-10 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Borrowers, Activities and Programs Loading Skeleton */}
        <div className="space-y-6">
          {/* Borrowers Card Loading Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-5 w-16 bg-gray-200 rounded"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded-full ml-2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity Timeline Loading Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <ul className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map(i => (
                <li key={i} className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Loan Programs Loading Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-2.5 w-2.5 bg-gray-200 rounded-full mr-2"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingSkeleton;
