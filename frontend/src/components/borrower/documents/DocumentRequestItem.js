import React from 'react';

/**
 * Component for displaying individual document requests
 * Shows request details, due dates, and upload functionality
 */
const DocumentRequestItem = ({ request, onUpload, isUploading = false }) => {
  // Calculate if due date is soon (within 24 hours)
  const dueDate = new Date(request.dueDate);
  const today = new Date();
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isDueSoon = diffDays <= 1 && diffDays >= 0;
  const isPastDue = diffDays < 0;

  const handleUploadClick = () => {
    // Don't allow upload if already uploading
    if (isUploading) {
      return;
    }

    // Create a dedicated file input for this document request
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Handle file selection
    fileInput.onchange = async (e) => {
      onUpload(e, request);
    };

    // Trigger the file input click
    fileInput.click();
  };

  return (
    <li className="transition-all duration-200 hover:bg-gray-50">
      <div className="py-2.5 px-4">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
              {request.title}
              {isDueSoon && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Due Soon
                </span>
              )}
              {isPastDue && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Past Due
                </span>
              )}
            </h4>
            <p className="mt-1 text-xs text-gray-600">
              {request.description}
            </p>
            <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Due:{" "}
                {new Date(request.dueDate).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Loan: {request.loanNumber}
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transform hover:-translate-y-0.5'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                    />
                  </svg>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default DocumentRequestItem;
