import React from 'react';

/**
 * DTI Circle Indicator component - displays a circular progress indicator for DTI
 */
const DTICircleIndicator = ({ dti, downPaymentPercent, isQualified, size = 32 }) => {
  const px = Number(size) > 0 ? Number(size) : 32;
  const sizeCls = `w-[${px * 4}px] h-[${px * 4}px]`; // fallback if Tailwind JIT supports arbitrary values
  const styleSize = { width: px * 4, height: px * 4 };
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={styleSize}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
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
            strokeDasharray={`${dti > 100 ? 283 : (dti * 2.83)} 283`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{dti.toFixed(0)}%</span>
          <span className="text-xs text-gray-500">DTI</span>
        </div>
      </div>
    </div>
  );
};

export default DTICircleIndicator;
