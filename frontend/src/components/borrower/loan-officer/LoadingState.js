import React from 'react';

/**
 * Component for displaying loading state while fetching loan officer details
 * Shows animated spinner with loading message
 */
const LoadingState = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
      <div className="animate-spin mx-auto rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <div className="mt-3 text-gray-600 text-sm">Loading loan officer details…</div>
    </div>
  );
};

export default LoadingState;
