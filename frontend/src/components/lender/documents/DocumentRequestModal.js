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
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    ? `Specify why the ${requestDetails.title} document needs to be updated.` 
                    : `Request the borrower to submit their ${requestDetails.title} document.`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <form onSubmit={(e) => {
              e.preventDefault(); // Prevent default form submission
              handleSubmitRequest(e);
            }}>
              {!isUpdate && (
                <>
                  {/* <div className="mb-4">
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
                  </div> */}
                  
                  {/* <div className="mb-4">
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
                  </div> */}
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
                    onChange={(e) => {
                      // When reason changes, update the message automatically based on reason
                      const newReason = e.target.value;
                      const { documentType, category, title, customReason } = requestDetails;
                      let autoMessage = '';
                      
                      // Special handling for Proof of Address
                      if (documentType === 'Utility Bill' || title.includes('Proof of Address')) {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload your Proof of Address. Acceptable documents include: Utility bill, lease agreement, or bank statement. ${reasonText}`;
                      }
                      // Special handling for Retirement account
                      else if (documentType === 'Retirement Statement' || title.includes('Retirement')) {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload your Retirement Account documents. If applicable, please submit the following: a) Most recent quarterly statement by name b) Conditions for hardship withdrawal and loans. ${reasonText}`;
                      }
                      // Special handling for Bank Statements
                      else if (documentType === 'Bank Statement') {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload your most recent consecutive two months of Bank Statements (all pages). Note: Very important that you submit ALL pages of each statement, even the last page that says "this page intentionally left blank". ${reasonText}`;
                      }
                      // Special handling for Mortgage Statement
                      else if (documentType === 'Mortgage Statement') {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload your most recent monthly mortgage statement for all real estate owned. ${reasonText}`;
                      }
                      // Special handling for Property Tax Bill
                      else if (documentType === 'Property Tax Bill') {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload the most recent full year property tax bills for all real estate owned. ${reasonText}`;
                      }
                      // Special handling for Homeowners Insurance
                      else if (documentType === 'Homeowners Insurance') {
                        const reasonText = getReasonText(newReason, documentType);
                        autoMessage = `Please upload a copy of your homeowner's insurance policy for all real estate owned. ${reasonText}`;
                      }
                      // For other document types, use a standard message
                      else {
                        autoMessage = `Please update your ${documentType} document. ${getReasonText(newReason, documentType)}`;
                      }
                      
                      // Update both reason and message
                      setRequestDetails({
                        ...requestDetails, 
                        reason: newReason,
                        message: autoMessage
                      });
                      
                      // Helper function to get reason-specific text
                      function getReasonText(reason, docType) {
                        switch(reason) {
                          case 'incorrect':
                            return `The document you submitted is not valid or does not match our requirements.`;
                          case 'quality':
                            return `The document you provided is of low quality or unreadable. Please submit a clearer, higher resolution version.`;
                          case 'expired':
                            return `Your document appears to be expired. Please submit a current, valid version.`;
                          case 'incomplete':
                            return `The document you submitted is incomplete. Please provide the complete document with all required pages and information.`;
                          case 'wrong_type':
                            return `The document you submitted is not recognized as a valid ${docType}. Please ensure you're submitting the correct document type.`;
                          default:
                            return '';
                        }
                      }
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="incorrect">Incorrect document</option>
                    <option value="quality">Low quality or unreadable</option>
                    <option value="expired">Document expired</option>
                    <option value="incomplete">Document incomplete</option>
                    <option value="wrong_type">Wrong document type</option>
                    {/* <option value="custom">Other (specify)</option> */}
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

              {/* <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                  Message to Borrower <span className="text-xs text-indigo-600 font-normal">(Auto-generated based on reason)</span>
                </label>
                <textarea
                  id="message"
                  value={requestDetails.message || ''}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-50 focus:outline-none focus:shadow-outline"
                  placeholder="Message will be automatically generated based on the selected reason..."
                  rows="4"
                  required
                />
              </div> */}

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  onClick={(e) => {
                    // Double-ensure we prevent default navigation
                    e.preventDefault(); 
                    handleSubmitRequest(e);
                    return false;
                  }}
                >
                  {isUpdate ? 'Request Update' : 'Send Request'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                  }}
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
