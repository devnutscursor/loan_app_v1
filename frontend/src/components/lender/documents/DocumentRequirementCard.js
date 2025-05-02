import React from 'react';

// The DocumentRequirementCard component displays a single document requirement
// with actions for lenders to interact with the document
const DocumentRequirementCard = ({
  req,
  processingDocId,
  formatDate,
  onApprove,
  onReject,
  openRequestModal
}) => {
  // Log the req object to see if requestedUpdate is properly set
  console.log(`⚠️ Rendering DocumentRequirementCard for ${req.documentType}, requestedUpdate=${req.requestedUpdate || false}`);
  
  // Check if req has the requestedUpdate property
  if (req.requestedUpdate) {
    console.log(`⚠️ Found a requirement with requestedUpdate=true: ${req.documentType} in ${req.category}`);
  }
  
  return (
    <li className="py-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 pt-1">
          {req.isSubmitted ? (
            <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
              req.status === 'Approved' ? 'bg-green-100' :
              req.status === 'Rejected' ? 'bg-red-100' :
              'bg-yellow-100'
            }`}>
              {req.status === 'Approved' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : req.status === 'Rejected' ? (
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
          ) : (
            <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
            <div className="ml-2 flex-shrink-0 flex">
              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                req.isSubmitted ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {req.status || 'Not Submitted'}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">{req.description}</p>
          
          {req.isSubmitted && req.uploadDate && (
            <p className="mt-1 text-xs text-gray-500">
              Uploaded: {formatDate(req.uploadDate)}
            </p>
          )}
          
          <div className="mt-2 flex">
            {req.isSubmitted ? (
              <>
                {/* View document button */}
                {req.url && (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${req.url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                  >
                    <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </a>
                )}
                
                {/* Approve button */}
                {req.status !== 'Approved' && (
                  <button
                    onClick={() => onApprove(req.documentId)}
                    disabled={processingDocId === `${req.category}-${req.documentType}`}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2"
                  >
                    {processingDocId === `${req.category}-${req.documentType}` ? (
                      <svg className="animate-spin h-4 w-4 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Approve
                  </button>
                )}
                
                {/* Reject button */}
                {req.status !== 'Rejected' && (
                  <button
                    onClick={() => onReject(req.documentId, 'Document does not meet requirements')}
                    disabled={processingDocId === `${req.category}-${req.documentType}`}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mr-2"
                  >
                    {processingDocId === `${req.category}-${req.documentType}` ? (
                      <svg className="animate-spin h-4 w-4 mr-1 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    Reject
                  </button>
                )}
                
                {/* Request Update button - only show if not already requested */}
                {(() => {
                  if (!req.requestedUpdate) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          // The parent component will handle creating the loan condition
                          // Just open the modal - no need for localStorage
                          openRequestModal(req.documentType, req.category, true);
                          
                          // Force hiding this button using DOM manipulation
                          document.getElementById(`update-btn-${req.category}-${req.documentType}`)?.classList.add('hidden');
                        }}
                        id={`update-btn-${req.category}-${req.documentType}`}
                        disabled={processingDocId === `${req.category}-${req.documentType}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {processingDocId === `${req.category}-${req.documentType}` ? (
                          <svg className="animate-spin h-4 w-4 mr-1 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Request Update
                      </button>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center px-2.5 py-1.5 border border-orange-300 text-xs font-medium rounded-md text-orange-700 bg-orange-50">
                        <svg className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Update Requested
                      </span>
                    );
                  }
                })()}
              </>
            ) : (
              /* Request document button - only for not submitted documents */
              <button
                type="button" 
                onClick={() => openRequestModal(req.documentType, req.category, false)}
                disabled={processingDocId === `${req.category}-${req.documentType}`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {processingDocId === `${req.category}-${req.documentType}` ? (
                  <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                Request Document
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default DocumentRequirementCard;
