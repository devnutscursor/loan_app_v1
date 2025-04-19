import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Document Upload Form Component
 * 
 * Allows borrowers to upload required documents for their loan application.
 * Integrates with document management system and shows requirements based on
 * application type.
 */
const DocumentUploadForm = ({
  formData,
  errors,
  handleDocumentUpload,
  handleDocumentRemove,
  isSubmitting
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Determine required documents based on application data
  const getRequiredDocuments = () => {
    const documents = [
      { id: 'identityDoc', name: 'Government ID', description: 'Driver\'s license, passport, or state ID', required: true },
      { id: 'incomeVerification', name: 'Income Verification', description: 'Last 2 pay stubs or income statement', required: true },
      { id: 'taxReturns', name: 'Tax Returns', description: 'Last 2 years of tax returns', required: true },
      { id: 'bankStatements', name: 'Bank Statements', description: 'Last 2 months of bank statements', required: true }
    ];

    // Add employment verification if employed
    if (formData.employmentType && !['unemployed', 'retired'].includes(formData.employmentType)) {
      documents.push({
        id: 'employmentVerification',
        name: 'Employment Verification',
        description: 'Letter of employment or recent payslips',
        required: true
      });
    }

    // Add self-employment documents
    if (formData.employmentType === 'selfEmployed') {
      documents.push({
        id: 'businessTaxReturns',
        name: 'Business Tax Returns',
        description: 'Last 2 years of business tax returns',
        required: true
      });
      documents.push({
        id: 'profitLossStatement',
        name: 'Profit & Loss Statement',
        description: 'Year-to-date profit and loss statement',
        required: true
      });
    }

    // Add property documents for refinance
    if (['refinance', 'cashout', 'homeEquity'].includes(formData.loanPurpose)) {
      documents.push({
        id: 'mortgageStatement',
        name: 'Mortgage Statement',
        description: 'Most recent mortgage statement',
        required: true
      });
      documents.push({
        id: 'homeowners',
        name: 'Homeowners Insurance',
        description: 'Current homeowners insurance declaration page',
        required: true
      });
    }

    // Add purchase documents
    if (formData.loanPurpose === 'purchase') {
      documents.push({
        id: 'purchaseAgreement',
        name: 'Purchase Agreement',
        description: 'Signed purchase agreement for the property',
        required: true
      });
    }

    return documents;
  };

  const requiredDocuments = getRequiredDocuments();

  // Get uploaded documents
  const getUploadedDocuments = () => {
    // This would normally come from the application state or API
    return formData.documents || [];
  };

  const uploadedDocuments = getUploadedDocuments();

  // Check if document is uploaded
  const isDocumentUploaded = (docId) => {
    return uploadedDocuments.some(doc => doc.documentType === docId);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file selection via doc type dropdown
  const handleDocTypeChange = (e) => {
    setSelectedDocType(e.target.value);
  };

  // Handle file selection via button
  const handleButtonClick = () => {
    if (selectedDocType && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      // Show error for missing document type selection
      alert('Please select a document type first');
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (selectedDocType && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    } else {
      alert('Please select a document type first');
    }
  };

  // Handle file selection via input
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!selectedDocType) {
      alert('Please select a document type');
      return;
    }

    // Start upload process
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 300);

    // Simulate API call to upload document
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create document object
      const document = {
        id: `doc-${Date.now()}`,
        documentType: selectedDocType,
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        status: 'uploaded',
        file: file
      };
      
      // Call parent handler
      handleDocumentUpload(document);
      
      // Reset state
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedDocType('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 3000);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get document status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Required Documents</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please upload all required documents for your loan application. All files should be in PDF, JPG, or PNG format.
        </p>
      </div>

      {/* Document Requirements List */}
      <div className="bg-white rounded-md p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Requirements</h3>
        
        <ul className="divide-y divide-gray-200">
          {requiredDocuments.map((doc) => (
            <li key={doc.id} className="py-4 flex items-start">
              <div className="flex-shrink-0 h-5 w-5 relative top-1">
                {isDocumentUploaded(doc.id) ? (
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  {doc.required && (
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{doc.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-md p-4 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Document Type Selection */}
          <div className="sm:col-span-3">
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
              Document Type
            </label>
            <div className="mt-1">
              <select
                id="documentType"
                name="documentType"
                value={selectedDocType}
                onChange={handleDocTypeChange}
                disabled={isSubmitting || isUploading}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Document Type</option>
                {requiredDocuments.map((doc) => (
                  <option 
                    key={doc.id} 
                    value={doc.id}
                    disabled={isDocumentUploaded(doc.id)}
                  >
                    {doc.name} {isDocumentUploaded(doc.id) ? '(Uploaded)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Drop Zone */}
          <div className="sm:col-span-6">
            <div 
              className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md ${
                dragActive ? 'border-primary bg-primary-50' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path 
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className={`relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none ${isSubmitting || isUploading || !selectedDocType ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span onClick={handleButtonClick}>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      disabled={isSubmitting || isUploading || !selectedDocType}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="sm:col-span-6">
              <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">{uploadProgress}% Complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents Section */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-md p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
          
          <ul className="divide-y divide-gray-200">
            {uploadedDocuments.map((doc) => {
              // Find document type info
              const docTypeInfo = requiredDocuments.find(d => d.id === doc.documentType) || { name: 'Other Document' };
              
              return (
                <li key={doc.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{docTypeInfo.name}</p>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 mr-2">{doc.name}</p>
                        <p className="text-xs text-gray-400">({formatFileSize(doc.size)})</p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(doc.status)}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDocumentRemove(doc.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Document Tips Section */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tips for document uploads:</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure all documents are clear and legible</li>
                <li>Include all pages of multi-page documents</li>
                <li>Black out or remove any sensitive information not required for the application</li>
                <li>Documents should be recent (typically within the last 60 days)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentUploadForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleDocumentUpload: PropTypes.func.isRequired,
  handleDocumentRemove: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default DocumentUploadForm;
