import React from 'react';

/**
 * BatchRequestModal Component
 * 
 * Modal for requesting multiple documents at once
 */
const BatchRequestModal = ({ 
  show, 
  onClose, 
  selectedDocuments = [],
  onRequestBatch,
  processing = false
}) => {
  if (!show) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Request Multiple Documents
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You're about to request {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} from the borrower.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="max-h-60 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {selectedDocuments.map((doc, index) => (
                  <li key={index} className="py-2">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {selectedDocuments.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-500">No documents selected</p>
              </div>
            )}
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              disabled={processing || selectedDocuments.length === 0}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                processing || selectedDocuments.length === 0 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
              } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm`}
              onClick={onRequestBatch}
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Request Selected Documents'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              disabled={processing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchRequestModal; 