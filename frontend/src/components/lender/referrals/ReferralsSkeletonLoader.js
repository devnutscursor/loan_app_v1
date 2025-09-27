import React from 'react';

const ReferralsSkeletonLoader = () => (
  <div className="space-y-6">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div key={item} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-12 bg-gray-200 rounded-md w-full mt-4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ReferralsSkeletonLoader;
