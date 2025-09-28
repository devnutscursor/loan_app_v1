import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const NoLoansView = ({ filter }) => (
  <div className="bg-white shadow-sm rounded-lg p-8 text-center border border-gray-100">
    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50 mb-4">
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="mt-2 text-lg font-medium text-gray-900">No loans found</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
      {filter !== 'all' 
        ? `No loans match the "${filter}" filter. Try another filter or apply for a new loan.`
        : "Get started by applying for a loan. Our process is quick, easy, and designed to help you meet your financial goals."}
    </p>
    <div className="mt-6">
      <Link
        href="/borrower/apply"
        className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
      >
        <Plus className="-ml-1 mr-2 h-5 w-5" />
        Apply for Loan
      </Link>
    </div>
  </div>
);

export default NoLoansView;
