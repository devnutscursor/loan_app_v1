import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../utils/formatters';

/**
 * LenderDocumentViewer Component
 * 
 * Displays a preview of document content in a modal popup with metadata and download button.
 * Supports different file types including PDF, images, Office documents, and text files.
 * Uses direct embed for PDFs and images, and Google Docs Viewer for Office documents when possible.
 */
const LenderDocumentViewer = ({ document, onClose, onDownload }) => {
  // State to track if document is loading
  const [isLoading, setIsLoading] = useState(true);
  
  // State to track if there's a viewing error
  const [error, setError] = useState(null);
  
  // State to track which viewer to use
  const [viewerType, setViewerType] = useState('direct'); // 'direct', 'google', 'office', 'none'
  
  // State to track if iframe loaded successfully
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // State to track if we should use fallback rendering
  const [useFallback, setUseFallback] = useState(false);
  
  // Document URL state
  const [documentUrl, setDocumentUrl] = useState('');
  
  // Base64 content state (for PDF viewer)
  const [base64Content, setBase64Content] = useState('');

  // Reset component state when document changes
  useEffect(() => {
    if (document) {
      console.log("Document to view:", document);
      setIsLoading(true);
      setError(null);
      setIframeLoaded(false);
      setUseFallback(false);
      setBase64Content('');
      
      // Construct document URL
      const url = constructDocumentUrl(document);
      setDocumentUrl(url);
      
      // Determine best viewer based on file type
      const fileType = getFileType(document);
      console.log("Detected file type:", fileType);
      
      if (fileType === 'image') {
        setViewerType('direct');
      } else if (fileType === 'pdf') {
        setViewerType('pdf-viewer');
        // Fetch PDF content if it's a PDF
        if (url) {
          fetchDocument(url, fileType);
        }
      } else if (['word', 'excel', 'powerpoint'].includes(fileType)) {
        setViewerType('google');
      } else {
        setViewerType('direct');
      }
      
      // Simulate document loading if not a PDF
      if (fileType !== 'pdf') {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [document]);
  
  // Fetch document content when needed
  const fetchDocument = async (url, fileType) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      // Convert to blob
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        setBase64Content(base64data);
        setIsLoading(false);
      };
      reader.onerror = () => {
        console.error("Error reading file");
        setError("Failed to read document");
        setUseFallback(true);
        setIsLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error fetching document:", err);
      setError(`Failed to load document: ${err.message}`);
      setUseFallback(true);
      setIsLoading(false);
    }
  };

  if (!document) {
    return null;
  }

  // Enhanced file type detection with more specific categories
  function getFileType(doc) {
    console.log("Detecting file type for document:", doc);
    
    // Extract filename from document object, checking multiple possible field names
    const fileName = doc.filename || doc.name || doc.originalname || doc.fileName || 
                     (doc.url && doc.url.split('/').pop()) || '';
                     
    // Handle case when we have just a URL or path
    const path = doc.url || doc.path || doc.filePath || '';
    
    // Check content type first if available as it's more reliable
    const mimeType = doc.mimetype || doc.contentType || doc.type || '';
    if (mimeType) {
      console.log('Mime type detected:', mimeType);
      if (mimeType.includes('image/')) return 'image';
      if (mimeType.includes('pdf') || mimeType === 'application/pdf') return 'pdf';
      if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessing')) return 'word';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('ms-excel')) return 'excel';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
      if (mimeType.includes('text/')) return 'text';
    }
    
    // Extract extension from file path or name
    let extension = '';
    
    if (fileName && fileName.includes('.')) {
      extension = fileName.split('.').pop().toLowerCase();
    } else if (path && path.includes('.')) {
      const parts = path.split('.');
      extension = parts[parts.length - 1].split('?')[0].toLowerCase();
    }
    
    console.log('File extension detected from name/path:', extension);
    
    // Determine file type based on extension
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } 
    else if (extension === 'pdf') {
      return 'pdf';
    }
    else if (['doc', 'docx', 'rtf'].includes(extension)) {
      return 'word';
    }
    else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'excel';
    }
    else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    }
    else if (['txt', 'text', 'md', 'markdown', 'json', 'xml', 'html', 'htm', 'css', 'js'].includes(extension)) {
      return 'text';
    }
    
    // Extract filename from path if it contains a timestamp format (e.g., 1747561194941-filename.pdf)
    if (path) {
      const timestampMatch = path.match(/\/(\d+-[^\/]+\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|ppt|pptx|txt))$/i);
      if (timestampMatch && timestampMatch[2]) {
        const fileExt = timestampMatch[2].toLowerCase();
        console.log('Extracted extension from timestamp pattern:', fileExt);
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExt)) return 'image';
        if (fileExt === 'pdf') return 'pdf';
        if (['doc', 'docx', 'rtf'].includes(fileExt)) return 'word';
        if (['xls', 'xlsx', 'csv'].includes(fileExt)) return 'excel';
        if (['ppt', 'pptx'].includes(fileExt)) return 'powerpoint';
        if (['txt', 'text', 'md'].includes(fileExt)) return 'text';
      }
    }
    
    // Fall back to checking patterns in the path
    if (path) {
      if (path.match(/\.(pdf)$/i)) return 'pdf';
      if (path.match(/\.(docx?|rtf)$/i)) return 'word';
      if (path.match(/\.(xlsx?|csv)$/i)) return 'excel';
      if (path.match(/\.(pptx?)$/i)) return 'powerpoint';
      if (path.match(/\.(jpe?g|png|gif|bmp|webp|svg)$/i)) return 'image';
    }
    
    // Default
    console.log('Could not determine file type, defaulting to "other"');
    return 'other';
  }

  // Construct document URL with proper error handling and checks
  function constructDocumentUrl(doc) {
    // Check all possible URL-related fields
    const urlPath = doc.url || doc.path || doc.filePath || doc.fileName;
    
    if (!urlPath) {
      console.error("No URL path found in document", doc);
      return null;
    }
    
    // Handle case when url is already a complete URL
    if (urlPath.startsWith('http')) {
      return urlPath;
    }
    
    // Base API URL
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    // Handle different path formats
    if (urlPath.startsWith('/uploads/')) {
      return `${baseApiUrl}${urlPath}`;
    } else if (urlPath.startsWith('uploads/')) {
      return `${baseApiUrl}/${urlPath}`;
    } else {
      // Assume it's just a filename that needs to be in the uploads directory
      return `${baseApiUrl}/uploads/${urlPath}`;
    }
  }

  // Build Google Docs Viewer URL for Office documents
  const googleDocsViewerUrl = documentUrl 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true` 
    : null;
    
  // Build Microsoft Office Online Viewer URL as an alternative
  const msOfficeViewerUrl = documentUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`
    : null;

  // Handle iframe load error
  const handleIframeError = () => {
    console.error("Error loading document preview");
    setUseFallback(true);
    setError('Preview failed to load. You can download the file to view it.');
  };
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    console.log("Iframe loaded successfully");
    setIframeLoaded(true);
    setIsLoading(false);
  };

  // Get file type for rendering
  const fileType = getFileType(document);

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
                  <h4 className="text-md font-semibold text-gray-900">{document.title || document.name || document.filename}</h4>
                  {document.category && (
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-medium text-gray-900">{document.category}</p>
                      </div>
                      {document.status && (
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p>
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              document.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : document.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                            </span>
                          </p>
                        </div>
                      )}
                      {document.uploadDate && (
                        <div>
                          <p className="text-gray-500">Uploaded</p>
                          <p className="font-medium text-gray-900">{formatDate(document.uploadDate)}</p>
                        </div>
                      )}
                    </div>
                  )}
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
                      <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                      <button
                        type="button"
                        onClick={() => window.open(documentUrl, '_blank')}
                        className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Download to View
                      </button>
                    </div>
                  ) : (
                    <div className="h-96 overflow-auto">
                      {/* Image files */}
                      {fileType === 'image' && !useFallback && (
                        <div className="flex items-center justify-center h-full">
                          <img 
                            src={documentUrl} 
                            alt={document.title || document.name || document.filename}
                            className="max-h-full max-w-full object-contain"
                            onError={() => {
                              console.error("Image failed to load");
                              setUseFallback(true);
                              setError('Failed to load image');
                            }}
                          />
                        </div>
                      )}
                      
                      {/* PDF files - using PDF.js viewer or embed/object tag */}
                      {fileType === 'pdf' && viewerType === 'pdf-viewer' && !useFallback && (
                        <div className="h-full w-full">
                          {base64Content ? (
                            <object
                              data={base64Content}
                              type="application/pdf"
                              className="w-full h-full"
                              aria-label={document.title || document.name || document.filename}
                            >
                              <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                                <p className="text-sm text-gray-500">
                                  Your browser doesn't support PDF preview.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => window.open(documentUrl, '_blank')}
                                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Download to View
                                </button>
                              </div>
                            </object>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-500">
                                PDF preview could not be loaded
                              </p>
                              <button
                                type="button"
                                onClick={() => window.open(documentUrl, '_blank')}
                                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Download to View
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Office documents with Google Docs/Office Viewer */}
                      {(fileType === 'word' || fileType === 'excel' || fileType === 'powerpoint') && !useFallback && (
                        <div className="h-full w-full">
                          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">
                              {fileType.charAt(0).toUpperCase() + fileType.slice(1)} files can't be previewed directly
                            </p>
                            <div className="mt-4 space-y-2">
                              <button
                                type="button"
                                onClick={() => window.open(documentUrl, '_blank')}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Download to View
                              </button>
                              <button
                                type="button"
                                onClick={() => window.open(googleDocsViewerUrl, '_blank')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Open with Google Docs
                              </button>
                              <button
                                type="button"
                                onClick={() => window.open(msOfficeViewerUrl, '_blank')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Open with Office Online
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Text files */}
                      {fileType === 'text' && !useFallback && (
                        <div className="h-full w-full bg-gray-50 p-4 overflow-auto">
                          <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-sm text-gray-500">
                              Text files can't be previewed directly
                            </p>
                            <button
                              type="button"
                              onClick={() => window.open(documentUrl, '_blank')}
                              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Download to View
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback for unsupported or failed-to-load files */}
                      {(useFallback || fileType === 'other' || 
                         (fileType !== 'image' && fileType !== 'pdf' && 
                          fileType !== 'word' && fileType !== 'excel' && 
                          fileType !== 'powerpoint' && fileType !== 'text')) && (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                          {/* File type icon */}
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          
                          <p className="mt-2 text-sm text-gray-500">
                            {useFallback 
                              ? "Preview failed to load" 
                              : "No preview available"}
                          </p>
                          
                          <div className="mt-4 space-y-2">
                            <button
                              type="button"
                              onClick={() => window.open(documentUrl, '_blank')}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Download to View
                            </button>
                            
                            {(fileType === 'pdf' || fileType === 'word' || fileType === 'excel' || fileType === 'powerpoint') && (
                              <button
                                type="button"
                                onClick={() => window.open(googleDocsViewerUrl, '_blank')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Open with Google Docs
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={() => window.open(documentUrl, '_blank')}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderDocumentViewer;
