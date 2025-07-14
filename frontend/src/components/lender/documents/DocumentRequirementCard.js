import React, { useEffect, useState } from "react";
import LenderDocumentViewer from "./LenderDocumentViewer";

const DocumentRequirementCard = ({
  req,
  processingDocId,
  formatDate,
  onApprove,
  onReject,
  openRequestModal,
  isSelectable = false,
  isSelected = false,
  onSelectToggle = null,
}) => {
  // useEffect(() => {
  //   console.log("DocumentRequirementCard updated");
  //   console.log("DocumentRequirementCard", req);
    
  //   // Force re-render when status changes
  //   Lif (req.status) {
  //     console.log(`Document status: ${req.status}`);
  //   }
  // }, [req, req.status, processingDocId]); // Re-run when req, req.status, or processingDocId changes

  // State to track when the document viewer should be shown
  const [viewingDocument, setViewingDocument] = useState(null);

  // Enhanced handler for document download
  const handleDownload = (docToDownload) => {
    // Look for all possible URL field names
    const docUrlPath = docToDownload?.url || docToDownload?.path || docToDownload?.filePath || docToDownload?.fileName;
    
    if (docToDownload && docUrlPath) {
      // Extract filename from path if it contains a timestamp format (e.g., 1747561194941-filename.pdf)
      let path = docUrlPath;
      if (path.includes('/')) {
        // If the path contains slashes, get just the filename
        path = path.split('/').pop();
      }
      
      // Construct proper URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      let url;
      
      if (path.startsWith('/uploads/')) {
        url = `${baseUrl}${path}`;
      } else if (path.startsWith('uploads/')) {
        url = `${baseUrl}/${path}`;
      } else {
        url = `${baseUrl}/uploads/${path}`;
      }
      
      console.log("Opening document in new tab:", url);
      
      // Just open in new tab, don't create a download link
      window.open(url, '_blank');
    }
  };
  
  return (
    <li
      style={{
        position: 'relative',
        padding: '0.75rem',
        paddingLeft: req.status ? '1rem' : '0',
        borderLeft: req.status === "Approved" || req.status === "Conditional Approval"
          ? '4px solid #22c55e' // Green border for approved
          : req.status === "Rejected" || req.status === "Declined"
          ? '4px solid #ef4444' // Red border for rejected
          : req.status === "Pending Review"
          ? '4px solid #eab308' // Blue border for pending review
          : req.isSubmitted || req.status === "Needs Correction"
          ? '4px solid #eab308' // Yellow border for submitted/needs correction
          : 'none'
      }}
      
    >
      <div className="flex items-start space-x-3" >
        {isSelectable && !req.isSubmitted && (
          <div className="flex-shrink-0 pt-1.5 mr-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectToggle && onSelectToggle(req)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        )}

        <div className="flex-shrink-0 pt-0.5">
          {req.isSubmitted ? (
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center ${
                req.status === "Approved"
                  ? "bg-green-100"
                  : req.status === "Rejected"
                  ? "bg-red-100"
                  : "bg-yellow-100"
              }`}
            >
              {req.status === "Approved" ? (
                <svg
                  className="h-3 w-3 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : req.status === "Rejected" ? (
                <svg
                  className="h-3 w-3 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-3 w-3 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </span>
          ) : (
            <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="h-3 w-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate mr-2">
                {req.title}
              </p>
              {req.isSubmitted && req.uploadDate && (
                <p className="hidden sm:inline-block text-xs text-gray-500">
                  ({formatDate(req.uploadDate)})
                </p>
              )}
            </div>
            <div className="ml-1 flex-shrink-0">
              <p
                className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                  req.status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : req.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : req.isSubmitted
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {req.status || "Not Submitted"}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-1">
            {req.description}
          </p>

          {/* Mobile-only upload date */}
          {req.isSubmitted && req.uploadDate && (
            <p className="mt-0.5 text-xs text-gray-500 sm:hidden">
              Uploaded: {formatDate(req.uploadDate)}
            </p>
          )}

          {req.isSubmitted ? (
            <div className="mt-1.5">
              {/* Action buttons in a single button group */}
              <div className="inline-flex rounded-md shadow-sm">
                {/* View button */}
                {req.url && (
                  <button
                    onClick={() => setViewingDocument(req)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-l text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-0.5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View
                  </button>
                )}

                {/* Approve button */}
                {req.status !== "Approved" && !req.requestedUpdate && (
                  <button
                    onClick={() => onApprove(req.documentId)}
                    disabled={
                      processingDocId === `${req.category}-${req.documentType}`
                    }
                    className={`inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium ${
                      !req.url ? "rounded-l" : "-ml-px"
                    } text-green-700 bg-white hover:bg-green-50`}
                  >
                    {processingDocId ===
                    `${req.category}-${req.documentType}` ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5 mr-0.5 text-green-500"
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
                    ) : (
                      <svg
                        className="h-3.5 w-3.5 mr-0.5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    Approve
                  </button>
                )}

                {/* Reject button */}
                {req.status !== "Rejected" && !req.requestedUpdate && (
                  <button
                    onClick={() =>
                      onReject(
                        req.documentId,
                        "Document does not meet requirements"
                      )
                    }
                    disabled={
                      processingDocId === `${req.category}-${req.documentType}`
                    }
                    className={`inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium -ml-px text-red-700 bg-white hover:bg-red-50`}
                  >
                    {processingDocId ===
                    `${req.category}-${req.documentType}` ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5 mr-0.5 text-red-500"
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
                    ) : (
                      <svg
                        className="h-3.5 w-3.5 mr-0.5 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    Reject
                  </button>
                )}

                {/* Update button */}
                {/* Update Button - Only show if not already requested */}
                {req.requestedUpdate ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-r -ml-px text-gray-500 bg-gray-100 cursor-not-allowed"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-0.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Update Requested
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Log the current state before opening the modal
                      console.log("Current document state before update request:", req);
                      openRequestModal(
                        req.documentType,
                        req.category,
                        req.title,
                        true
                      );
                    }}
                    id={`update-btn-${req.category}-${req.documentType}`}
                    disabled={
                      processingDocId === `${req.category}-${req.documentType}`
                    }
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-r -ml-px text-indigo-700 bg-white hover:bg-indigo-50"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-0.5 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Update
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Request document button - only for not submitted documents */
            <div className="mt-2">
              {req.status === "Needs Correction" || req.requestedUpdate ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-500 bg-gray-100 cursor-not-allowed"
                >
                  <svg
                    className="h-3.5 w-3.5 mr-1 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Document Requested
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openRequestModal(
                      req.documentType,
                      req.category,
                      req.title,
                      false
                    )
                  }
                  disabled={
                    processingDocId === `${req.category}-${req.documentType}`
                  }
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {processingDocId === `${req.category}-${req.documentType}` ? (
                    <svg
                      className="animate-spin h-3.5 w-3.5 mr-1 text-white"
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
                  ) : (
                    <svg
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  )}
                  Request Document
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <LenderDocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={handleDownload}
        />
      )}
    </li>
  );
};

export default DocumentRequirementCard;
