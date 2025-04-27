import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentService } from '../../../services';

/**
 * DocumentUploadForm Component
 * 
 * A clean, simple interface for uploading documents with category selection and description.
 */
const DocumentUploadForm = ({ loanId, onUploadSuccess }) => {
  const [category, setCategory] = useState('Identity');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Document categories available for upload - must match backend enum values
  const documentCategories = [
    { value: 'Identity', label: 'Identification Documents' },
    { value: 'Income', label: 'Income Verification' },
    { value: 'Assets', label: 'Asset Documents' },
    { value: 'Credit', label: 'Credit Documents' },
    { value: 'Property', label: 'Property Documents' },
    { value: 'Employment', label: 'Employment Verification' },
    { value: 'Insurance', label: 'Insurance Documents' },
    { value: 'Disclosures', label: 'Disclosure Documents' },
    { value: 'Legal', label: 'Legal Documents' },
    { value: 'Other', label: 'Other Documents' }
  ];

  // Document types corresponding to categories
  const documentTypes = {
    Identity: ['Driver License', 'Passport', 'Social Security Card'],
    Income: ['Pay Stub', 'W2', 'Tax Return'],
    Assets: ['Bank Statement', 'Retirement Account Statement', 'Investment Account Statement', 'Gift Letter'],
    Credit: ['Credit Report'],
    Property: ['Purchase Agreement', 'Property Appraisal', 'Title Report'],
    Insurance: ['Insurance Declaration'],
    Disclosures: ['Loan Estimate', 'Closing Disclosure'],
    Employment: ['Employment Verification', 'Offer Letter'],
    Legal: ['Contract', 'Agreement'],
    Other: ['Other']
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle drag and drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!category) {
      toast.error('Please select a document category');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get a valid document type for the selected category
      let documentType = 'Other'; // Default
      
      if (documentTypes[category] && documentTypes[category].length > 0) {
        // For simplicity, just use the first available document type for this category
        documentType = documentTypes[category][0];
        
        // Try to guess a more appropriate document type based on filename
        const fileName = selectedFile.name.toLowerCase();
        if (fileName.includes('passport')) {
          documentType = 'Passport';
        } else if (fileName.includes('license')) {
          documentType = 'Driver License';
        } else if (fileName.includes('bank') || fileName.includes('statement')) {
          documentType = 'Bank Statement';
        } else if (fileName.includes('tax') || fileName.includes('return')) {
          documentType = 'Tax Return';
        } else if (fileName.includes('pay') || fileName.includes('stub')) {
          documentType = 'Pay Stub';
        }
        
        // Ensure the selected document type is valid for the category
        if (!documentTypes[category].includes(documentType)) {
          documentType = documentTypes[category][0];
        }
      }
      
      // Create document data
      const documentData = {
        name: selectedFile.name,
        category: category,
        type: documentType,
        description: description
      };
      
      // Upload the document
      const response = await DocumentService.uploadDocument(documentData, loanId, selectedFile);
      
      if (response.success) {
        toast.success('Document uploaded successfully');
        
        // Reset form
        setSelectedFile(null);
        setDescription('');
        
        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        toast.error(response.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {documentCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a brief description of the document(s)"
            rows="3"
          />
        </div>
        
        <div 
          className={`border-2 border-dashed rounded-md p-6 mb-4 text-center cursor-pointer ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } ${selectedFile ? 'bg-green-50' : ''}`}
          onClick={triggerFileInput}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.docx,application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          
          <div className="flex flex-col items-center">
            <svg 
              className="w-10 h-10 text-gray-400 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-blue-500 font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG, DOCX up to 10MB</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploadForm;
