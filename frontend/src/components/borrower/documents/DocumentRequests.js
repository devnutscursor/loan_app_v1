import React from 'react';
import DocumentRequestItem from './DocumentRequestItem';

/**
 * Component for displaying document requests from lenders
 * Shows loading states, empty states, and list of requests
 */
const DocumentRequests = ({ 
  requests, 
  isLoadingRequests, 
  selectedLoanNumber,
  onFileUpload 
}) => {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:shadow-xl border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-white">
        <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
          Document Requests for Selected Loan
        </h3>
        <p className="mt-0.5 max-w-2xl text-xs text-gray-500">
          The following documents have been requested for loan {selectedLoanNumber}.
        </p>
      </div>
      <div>
        {isLoadingRequests ? (
          <div className="flex justify-center items-center h-24 bg-gray-50/50">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-1 text-xs text-gray-500">
                Loading requests...
              </p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900">No document requests found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no pending document requests for this loan.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {requests.map((request) => (
              <DocumentRequestItem
                key={request._id}
                request={request}
                onUpload={onFileUpload}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentRequests;
