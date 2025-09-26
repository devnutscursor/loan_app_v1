import React from 'react';

const QuickActionSkeleton = () => (
  <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-100 animate-pulse">
    <div className="h-6 w-6 bg-gray-200 rounded"></div>
    <div className="text-left flex-1">
      <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
      <div className="h-3 w-40 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default QuickActionSkeleton;


