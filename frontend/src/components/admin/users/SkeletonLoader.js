import React from 'react';

const SkeletonLoader = () => (
  <div className="space-y-6">
    <div className="flex justify-between animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-1/6"></div>
    </div>

    <div className="flex justify-between space-x-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
    </div>

    {/* Desktop Table Skeleton */}
    <div className="hidden lg:block border rounded-lg overflow-hidden">
      <div className="h-12 bg-gray-100 animate-pulse"></div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="border-t border-gray-200 h-16 animate-pulse flex">
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Mobile/Tablet Card Skeleton */}
    <div className="lg:hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="p-4">
              {/* Card Header - User Info Skeleton */}
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>

              {/* Card Content - User Details Skeleton */}
              <div className="space-y-2">
                {/* Role Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>

                {/* Status Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>

                {/* Created Date Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>

              {/* Card Footer - Action Button Skeleton */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <div className="h-8 bg-gray-200 rounded-md w-full"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
