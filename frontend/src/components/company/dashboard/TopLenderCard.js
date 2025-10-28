import React from 'react';

export const TopLenderCardSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-full max-w-32 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-full max-w-40 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const TopLenderCard = ({ lender, rank, onClick, sortBy }) => (
  <div 
    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
          {rank}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{lender.lender.user.name}</h4>
          <p className="text-sm text-gray-600 max-w-[150px] truncate">{lender.lender.user.email}</p>
        </div>
      </div>
      <div className="text-right">
        {sortBy === 'borrowerCount' ? (
          <>
            <p className="text-sm font-bold text-primary">{lender.metrics.borrowerCount} borrowers</p>
            <p className="text-xs text-gray-600">${lender.metrics.totalLoanAmount?.toLocaleString() || '0'}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-primary">${lender.metrics.totalLoanAmount?.toLocaleString() || '0'}</p>
            <p className="text-xs text-gray-600">{lender.metrics.borrowerCount} borrowers</p>
          </>
        )}
      </div>
    </div>
  </div>
);

export default TopLenderCard;


