import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * DocumentUpload Component
 * 
 * Provides a drag-and-drop and file selection interface for uploading documents.
 * Includes document type categorization and description fields.
 */
const DocumentUpload = ({ onUpload, categories, maxFileSize = 10 }) => {
  // State for drag-and-drop functionality
  const [isDragging, setIsDragging] = useState(false);
  
  // State for selected files
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // State for document metadata
  const [documentData, setDocumentData] = useState({
    category: categories?.[0]?.value || '',
    description: ''
  });
  
  // State for upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Reference to the file input
  const fileInputRef = useRef(null);

  // Handle file selection from file input
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    validateAndSetFiles(files);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    validateAndSetFiles(files);
  };

  // Validate files and update state
  const validateAndSetFiles = (files) => {
    // Filter out files that are too large (size in MB)
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= maxFileSize * 1024 * 1024;
      if (!isValidSize) {
        toast.error(`File ${file.name} exceeds the ${maxFileSize}MB limit`);
      }
      return isValidSize;
    });
    
    // Update state with valid files
    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  // Handle removal of a selected file
  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles(prevFiles => 
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // Handle input change for document metadata
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to get file size in readable format
  const getFileSize = (size) => {
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  // Trigger file browser when the upload area is clicked
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
    
    if (!documentData.category) {
      toast.error('Please select a document category');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create form data for upload
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('category', documentData.category);
      formData.append('description', documentData.description);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      // Call the onUpload callback which should handle the actual API call
      await onUpload(formData);
      
      // Clear progress interval and complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setSelectedFiles([]);
      setDocumentData({
        category: categories?.[0]?.value || '',
        description: ''
      });
      
      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Document type selection */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Document Category *
          </label>
          <select
            id="category"
            name="category"
            value={documentData.category}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            required
          >
            <option value="">Select a category</option>
            {categories?.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Document description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows="2"
            value={documentData.description}
            onChange={handleInputChange}
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Add a brief description of the document(s)"
          />
        </div>
        
        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary'
          }`}
          onClick={triggerFileInput}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48" 
            aria-hidden="true"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-4 0v12m-12-4h.01M20 16h.01" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PDF, PNG, JPG, DOCX up to {maxFileSize}MB
          </p>
        </div>
        
        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
            <ul className="divide-y divide-gray-200 border rounded-md">
              {selectedFiles.map((file, index) => (
                <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate mr-4 max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-500">{getFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                    disabled={isUploading}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Upload progress bar (shown when uploading) */}
        {isUploading && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary-50">
                    Uploading
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                <div 
                  style={{ width: `${uploadProgress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;
