import React from 'react';

// Skeleton components for lender stats page
export const HeaderSkeleton = () => (
  <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
    <div className="flex items-start justify-center space-x-4 flex-col">
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4 ml-5"></div>
      <div>
        <div className="h-6 sm:h-8 w-80 sm:w-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

export const LenderInfoCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1">
        <div className="h-5 sm:h-6 w-40 sm:w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mt-2">
          <div className="h-5 sm:h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export const StatsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="h-32 sm:h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
    ))}
  </div>
);

export const RecentLoansSectionSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:col-span-2">
    <div className="flex items-center justify-between mb-5">
      <div className="h-6 sm:h-7 w-40 sm:w-48 bg-gray-200 rounded animate-pulse"></div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4 animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 sm:h-5 w-20 sm:w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-14 sm:w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-4 sm:h-5 w-14 sm:w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="w-full">
                <div className="h-3 w-10 sm:w-12 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 sm:h-4 w-14 sm:w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-7 sm:h-8 w-full bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Performance Metrics Skeleton */}
    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 sm:w-36 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <div className="h-4 w-20 sm:w-24 bg-gray-200 rounded mb-3"></div>
            <div className="flex items-end space-x-2 mb-2">
              <div className="h-8 sm:h-10 w-12 sm:w-16 bg-gray-200 rounded"></div>
              <div className="h-3 sm:h-4 w-6 sm:w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-3 w-28 sm:w-32 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 w-28 sm:w-32 bg-gray-200 rounded mb-3"></div>
            <div className="flex items-end space-x-2 mb-2">
              <div className="h-8 sm:h-10 w-6 sm:w-8 bg-gray-200 rounded"></div>
              <div className="h-4 sm:h-5 w-10 sm:w-12 bg-gray-200 rounded"></div>
              <div className="h-3 sm:h-4 w-6 sm:w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-3 w-36 sm:w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const BorrowersCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 sm:h-6 w-32 sm:w-36 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="space-y-1">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-2 sm:p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-28 sm:w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-4 sm:h-5 w-12 sm:w-16 bg-gray-200 rounded"></div>
              <div className="h-3 sm:h-4 w-3 sm:w-4 bg-gray-200 rounded-full ml-2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RecentActivityTimelineSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 sm:h-6 w-32 sm:w-36 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 sm:h-5 w-12 sm:w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 min-w-0">
            <div className="h-3 sm:h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);

export const LoanProgramsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 sm:h-6 w-28 sm:w-32 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="py-2 sm:py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-3 sm:h-4 w-28 sm:w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const LenderStatsSkeleton = () => (
  <div className="py-4 sm:py-6">
    <HeaderSkeleton />
    <LenderInfoCardSkeleton />
    <StatsGridSkeleton />

    {/* Main Content Layout Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <RecentLoansSectionSkeleton />
      
      {/* Right Column Skeleton */}
      <div className="space-y-4 sm:space-y-6">
        <BorrowersCardSkeleton />
        <RecentActivityTimelineSkeleton />
        <LoanProgramsSkeleton />
      </div>
    </div>
  </div>
);
