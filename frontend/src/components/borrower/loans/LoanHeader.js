import React from 'react';
import Link from 'next/link';

const LoanHeader = ({ 
  loan, 
  getStatusBadgeColor, 
  formatDate 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              href="/borrower/loans"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
            >
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Loan Application
              {loan && loan.loanNumber && (
                <div className="ml-3 px-2.5 py-1 bg-blue-50 rounded-md flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-800">
                    {loan.loanNumber}
                  </span>
                </div>
              )}
            </h1>
          </div>
          <div className="mt-2 flex items-center">
            {loan && loan.status && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                  loan.status
                )}`}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-current"></span>
                {loan.status.toLowerCase() === 'conditional approval' ? 'Approved' :
                 loan.status.toLowerCase() === 'declined' ? 'Rejected' :
                 loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
              </span>
            )}
            {loan && loan.applicationDate && (
              <span className="ml-4 text-sm text-gray-500 flex items-center">
                <svg
                  className="mr-1 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Submitted{" "}
                {formatDate(loan.applicationDate || loan.createdAt)}
              </span>
            )}
          </div>
        </div>
        {loan && (
          <div className="flex items-center space-x-3">
            {/* Management buttons in a more compact design */}
            <div className="flex space-x-3 mr-1">
              <Link
                href={`/borrower/documents?loanId=${loan._id}`}
                className="relative inline-flex items-center p-2 border border-blue-200 rounded-full text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 group"
                aria-label="Manage Documents"
              >
                <svg
                  className="h-5 w-5"
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
                <span className="absolute bottom-full mb-2 w-auto min-w-max left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Manage Documents
                </span>
              </Link>

              <Link
                href={`/borrower/milestones?loanId=${loan._id}`}
                className="relative inline-flex items-center p-2 border border-blue-200 rounded-full text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 group"
                aria-label="Manage Milestones"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                <span className="absolute bottom-full mb-2 w-auto min-w-max left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Manage Milestones
                </span>
              </Link>
            </div>

            {/* Edit Application button - disabled if editing is not allowed by lender */}
            {loan.editingEnabled !== false ? (
              <Link
                href={`/borrower/apply?draft=${loan.loanNumber}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit this Application
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-gray-400 bg-gray-200 cursor-not-allowed transition-colors duration-200"
                title="Editing has been disabled by the lender"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit this Application
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanHeader;
