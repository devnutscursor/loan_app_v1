import React from 'react';

/**
 * Loading skeleton component for the milestones page
 * Shows animated placeholders while data is being fetched
 */
const MilestonesLoadingSkeleton = () => {
  return (
    <>
      {/* Loan Selection Skeleton */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6 animate-pulse">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none w-full sm:w-1/3">
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Milestones Skeleton */}
      <div className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        
        {/* Timeline Skeleton */}
        <div className="pt-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== 4 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Skeleton */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className={`h-12 rounded-md animate-pulse ${index === 0 ? 'bg-gradient-to-r from-blue-200 to-blue-300' : 'bg-gray-200'}`}></div>
        ))}
      </div>
    </>
  );
};

export default MilestonesLoadingSkeleton;
