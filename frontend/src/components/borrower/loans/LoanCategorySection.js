import React from 'react';
import LoanCard from '../../common/LoanCard';

const LoanCategorySection = ({
  title,
  loans,
  userRole,
  bgClass = "bg-white",
}) => {
  if (!loans || loans.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
          {loans.length} {loans.length === 1 ? "loan" : "loans"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map((loan) => (
          <LoanCard key={loan._id} loan={loan} userRole={userRole} />
        ))}
      </div>
    </div>
  );
};

export default LoanCategorySection;
