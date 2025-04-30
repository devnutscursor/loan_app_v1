import React from 'react';

const DocumentRequestModal = ({ 
  show, 
  onClose, 
  requestDetails, 
  setRequestDetails, 
  handleSubmitRequest,
  isUpdate 
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
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isUpdate ? 'Request Document Update' : 'Request Document'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {isUpdate 
                    ? `Specify why the ${requestDetails.documentType} document needs to be updated.` 
                    : `Request the borrower to submit their ${requestDetails.documentType} document.`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <form onSubmit={handleSubmitRequest}>
              {!isUpdate && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documentType">
                      Document Type
                    </label>
                    <input
                      id="documentType"
                      type="text"
                      value={requestDetails.documentType || ''}
                      onChange={(e) => setRequestDetails({...requestDetails, documentType: e.target.value})}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., Driver's License"
                      required
                      disabled={isUpdate}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                      Category
                    </label>
                    <input
                      id="category"
                      type="text"
                      value={requestDetails.category || ''}
                      onChange={(e) => setRequestDetails({...requestDetails, category: e.target.value})}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., Identity"
                      required
                      disabled={isUpdate}
                    />
                  </div>
                </>
              )}

              {isUpdate && (
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for update request
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={requestDetails.reason || ''}
                    onChange={(e) => setRequestDetails({...requestDetails, reason: e.target.value})}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="incorrect">Incorrect document</option>
                    <option value="quality">Low quality or unreadable</option>
                    <option value="expired">Document expired</option>
                    <option value="incomplete">Document incomplete</option>
                    <option value="wrong_type">Wrong document type</option>
                    <option value="custom">Other (specify)</option>
                  </select>

                  {requestDetails.reason === 'custom' && (
                    <div className="mt-3">
                      <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                        Custom reason
                      </label>
                      <textarea
                        id="customReason"
                        name="customReason"
                        rows="3"
                        value={requestDetails.customReason || ''}
                        onChange={(e) => setRequestDetails({...requestDetails, customReason: e.target.value})}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Please provide a detailed explanation"
                        required={requestDetails.reason === 'custom'}
                      ></textarea>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                  Message to Borrower
                </label>
                <textarea
                  id="message"
                  value={requestDetails.message || ''}
                  onChange={(e) => setRequestDetails({...requestDetails, message: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Please explain what the borrower needs to provide..."
                  rows="4"
                  required
                />
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  {isUpdate ? 'Request Update' : 'Send Request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestModal;
