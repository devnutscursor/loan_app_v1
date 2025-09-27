import React from 'react';

const PageHeader = () => {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Loans</h1>
        <p className="mt-2 text-gray-600">
          List of active loan applications from all borrowers across all lenders
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
