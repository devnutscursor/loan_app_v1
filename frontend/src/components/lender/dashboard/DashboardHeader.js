import React from 'react';
import Link from 'next/link';

const DashboardHeader = ({ onNewLoanClick }) => {
  return (
    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your lending activity
        </p>
      </div>
      
      <div className="flex space-x-3 justify-start">
        <button
          onClick={onNewLoanClick}
          className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
          New Loan
        </button>
        <Link href="/lender/borrowers" 
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          View All Borrowers
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;
