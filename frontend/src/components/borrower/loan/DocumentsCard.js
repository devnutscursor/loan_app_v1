import React from 'react';

/**
 * DocumentsCard component displays loan documents in a visually appealing card
 * @param {Array} documents - The documents array from the loan
 * @param {Function} formatDate - Function to format date values
 * @param {Function} handleRemoveDocument - Function to handle document removal
 */
const DocumentsCard = ({ documents, formatDate, handleRemoveDocument, isLenderView = false }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-6">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
        <p className="mt-1 text-sm text-gray-500">No documents have been uploaded for this loan application yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100 my-6">
      <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="ml-2 text-lg font-semibold text-gray-900">Documents</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">Documents submitted with your application</p>
      </div>
      
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc._id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-50 rounded-md mr-4">
                  <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{doc.originalFilename || doc.name || 'Document'}</p>
                  <p className="text-xs text-gray-500 mt-1">{doc.category} - {doc.documentType || 'Uploaded document'}</p>
                  {(doc.createdAt || doc.uploadedAt) && (
                    <p className="text-xs text-gray-400 mt-1">Uploaded: {formatDate(doc.createdAt || doc.uploadedAt)}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {(doc.fileUrl || doc.url) && (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${doc.fileUrl || doc.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </a>
                )}
                {!isLenderView && (
                  <button
                    onClick={() => handleRemoveDocument(doc._id)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DocumentsCard;
