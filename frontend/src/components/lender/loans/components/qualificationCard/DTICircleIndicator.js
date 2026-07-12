import React from 'react';

/**
 * DTI Circle Indicator component - displays a circular progress indicator for DTI
 */
const DTICircleIndicator = ({ dti, isQualified }) => {
  const clamped = Number.isFinite(dti) ? Math.max(0, Math.min(100, dti)) : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isQualified ? '#10b981' : '#ef4444'}
            strokeWidth="10"
            strokeDasharray={`${clamped * 2.83} 283`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Number(dti || 0).toFixed(0)}%</span>
          <span className="text-xs text-gray-500">DTI</span>
        </div>
      </div>
    </div>
  );
};

export default DTICircleIndicator;
