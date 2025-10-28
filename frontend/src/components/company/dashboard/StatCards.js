import React from 'react';

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass, textClass = "text-white" }) => (
  <div className={`${bgClass} rounded-xl p-6 shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`sm:text-sm text-[10px] font-medium ${textClass} opacity-90`}>{title}</p>
        <p className={`sm:text-2xl text-lg font-bold ${textClass} mt-1`}>{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {/* Consumers pass the appropriate trend icon; keep API same as original */}
            <span className={`text-sm ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>{trendValue}</span>
          </div>
        )}
      </div>
      <Icon className={`sm:h-8 sm:w-8 h-6 w-6 ${textClass} opacity-80`} />
    </div>
  </div>
);

export const StatCardSkeleton = ({ bgClass }) => (
  <div className={`${bgClass} rounded-xl p-6 shadow-lg animate-pulse`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 w-24 bg-white bg-opacity-30 rounded mb-2"></div>
        <div className="h-8 w-16 bg-white bg-opacity-30 rounded mb-2"></div>
        <div className="h-3 w-12 bg-white bg-opacity-30 rounded"></div>
      </div>
      <div className="h-8 w-8 bg-white bg-opacity-30 rounded"></div>
    </div>
  </div>
);


