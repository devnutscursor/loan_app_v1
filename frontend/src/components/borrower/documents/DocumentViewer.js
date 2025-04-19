import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../utils/formatters';

/**
 * DocumentViewer Component
 * 
 * Displays a preview of document content with metadata and status information.
 * Supports different file types including PDF, images, and fallback for other formats.
 */
const DocumentViewer = ({ document, onClose, onDownload, onStatusUpdate }) => {
  // State to track if document is loading
  const [isLoading, setIsLoading] = useState(true);
  
  // State to track if there's a viewing error
  const [error, setError] = useState(null);
  
  // State for the document status when editing
  const [status, setStatus] = useState(document?.status || 'pending');
  
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  
  // State for notes
  const [notes, setNotes] = useState(document?.notes || '');

  // Reset component state when document changes
  useEffect(() => {
    if (document) {
      setIsLoading(true);
      setError(null);
      setStatus(document.status);
      setNotes(document.notes || '');
      
      // Simulate document loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [document]);

  if (!document) {
    return null;
  }

  // Determine file type from extension
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'other';
    }
  };

  const fileType = getFileType(document.name);

  // Handle status change
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  // Save changes
  const handleSave = () => {
    onStatusUpdate && onStatusUpdate({
      ...document,
      status,
      notes
    });
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setStatus(document.status);
    setNotes(document.notes || '');
    setIsEditing(false);
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Document Viewer
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Document metadata */}
                <div className="mt-4 mb-6">
                  <h4 className="text-md font-semibold text-gray-900">{document.name}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">{document.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeStyle(document.status)}`}>
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Uploaded</p>
                      <p className="font-medium text-gray-900">{formatDate(document.uploadedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Size</p>
                      <p className="font-medium text-gray-900">{document.size}</p>
                    </div>
                  </div>
                  {document.description && (
                    <div className="mt-3">
                      <p className="text-gray-500">Description</p>
                      <p className="font-medium text-gray-900">{document.description}</p>
                    </div>
                  )}
                </div>
                
                {/* Document preview */}
                <div className="mt-4 border border-gray-300 rounded-md">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-gray-50">
                      <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">Loading document...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-gray-50">
                      <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    </div>
                  ) : (
                    <div className="h-96 overflow-auto">
                      {fileType === 'image' ? (
                        <div className="flex items-center justify-center h-full">
                          <img 
                            src={document.url || '/placeholder-image.jpg'} 
                            alt={document.name}
                            className="max-h-full max-w-full object-contain"
                            onError={() => setError('Failed to load image')}
                          />
                        </div>
                      ) : fileType === 'pdf' ? (
                        <div className="h-full w-full">
                          <iframe
                            src={document.url || '/sample-pdf.pdf'}
                            title={document.name}
                            className="w-full h-full"
                            onError={() => setError('Failed to load PDF')}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Preview not available for this file type</p>
                          <button
                            type="button"
                            onClick={() => onDownload && onDownload(document)}
                            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            Download to View
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Edit area for lenders and admins */}
                {onStatusUpdate && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    {isEditing ? (
                      <div>
                        <div className="mb-4">
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            id="status"
                            name="status"
                            value={status}
                            onChange={handleStatusChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="pending">Pending</option>
                            <option value="review">In Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                          <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            value={notes}
                            onChange={handleNotesChange}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Add notes about this document..."
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {document.notes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Notes</p>
                            <p className="mt-1 text-sm text-gray-500">{document.notes}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          Edit Status & Notes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={() => onDownload && onDownload(document)}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
