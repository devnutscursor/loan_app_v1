import React from 'react';

/**
 * Component for selecting which loan to upload documents for
 * Shows loan cards with status indicators and selection functionality
 */
const LoanSelector = ({ 
  loans, 
  selectedLoanId, 
  isLoadingLoans, 
  onLoanSelection 
}) => {
  // Auto-select first loan if none selected
  React.useEffect(() => {
    if (!selectedLoanId && loans.length > 0 && !isLoadingLoans) {
      onLoanSelection(loans[0]._id);
    }
  }, [selectedLoanId, loans, isLoadingLoans, onLoanSelection]);

  if (isLoadingLoans) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Select Loan Application
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose the loan application you want to upload documents for
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
            <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Select Loan Application
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose the loan application you want to upload documents for
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-6">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No loan applications found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by creating a new loan application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900">
          Select Loan Application
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose the loan application you want to upload documents for
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="max-h-[300px] overflow-y-auto px-1 py-1 space-y-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loans.map((loan) => {
            // Determine status color
            let statusColor = "bg-gray-100 text-gray-800";
            if (loan.status) {
              const status = loan.status.toLowerCase();
              if (status.includes("approved") || status.includes("conditional approval"))
                statusColor = "bg-green-100 text-green-800";
              else if (status.includes("review"))
                statusColor = "bg-yellow-100 text-yellow-800";
              else if (status.includes("submit"))
                statusColor = "bg-blue-100 text-blue-800";
              else if (status.includes("reject") || status.includes("declined"))
                statusColor = "bg-red-100 text-red-800";
            }

            return (
              <div
                key={loan._id || `loan-${Math.random()}`}
                onClick={() => onLoanSelection(loan._id)}
                className={`cursor-pointer p-3 rounded-md hover:bg-blue-50 transition-colors duration-150 ${
                  selectedLoanId === loan._id
                    ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded-full ${
                        selectedLoanId === loan._id
                          ? "bg-blue-500"
                          : "border-2 border-gray-300"
                      }`}
                    ></div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {loan.loanNumber || loan._id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {loan.loanDetails?.loanType || "Loan"}{" "}
                        {loan.loanDetails?.loanPurpose
                          ? `- ${loan.loanDetails.loanPurpose}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                  >
                    {loan.status?.toLowerCase() === 'conditional approval' ? 'Approved' :
                     loan.status?.toLowerCase() === 'declined' ? 'Denied' :
                     loan.status || "Processing"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoanSelector;
