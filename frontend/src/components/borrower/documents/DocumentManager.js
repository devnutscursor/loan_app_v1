import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentService } from '../../../services';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DocumentViewer from './DocumentViewer';

/**
 * DocumentManager Component
 * 
 * Main container for document management functionality.
 * Handles document operations including upload, download, deletion, and viewing.
 * Integrates all document-related components into a cohesive system.
 */
const DocumentManager = ({ loanId, userRole = 'borrower' }) => {
  // State for documents
  const [documents, setDocuments] = useState([]);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  
  // State for document currently being viewed
  const [viewingDocument, setViewingDocument] = useState(null);
  
  // State for refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch documents on component mount or when refreshTrigger changes
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching real documents from API');
        
        // Get documents based on whether a loan is selected or not
        let response;
        if (loanId) {
          // Get documents for the specific loan
          response = await DocumentService.getLoanDocuments(loanId);
          console.log('Fetched loan documents:', response);
        } else {
          // Get all user documents
          response = await DocumentService.getUserDocuments();
          console.log('Fetched user documents:', response);
        }
        
        if (response.success) {
          // Handle the nested structure - documents are in response.data.data
          const documentsArray = response.data.data || [];
          console.log('Documents array:', documentsArray);
          
          if (Array.isArray(documentsArray) && documentsArray.length > 0) {
            // Format the documents for display
            const formattedDocuments = documentsArray.map(doc => ({
              id: doc._id,
              name: doc.name,
              description: doc.description || '',
              category: doc.category,
              status: doc.status,
              uploadedAt: new Date(doc.createdAt || Date.now()),
              size: formatFileSize(doc.size) || 'Unknown',
              url: `/api/v1/documents/${doc._id}/download`,
              originalFilename: doc.originalFilename
            }));
            
            console.log('Formatted documents:', formattedDocuments);
            setDocuments(formattedDocuments);
          } else {
            // If no documents found
            console.log('No documents found in the response');
            setDocuments([]);
          }
        } else {
          // If API error, show empty state
          console.log('API error:', response.message);
          setDocuments([]);
          toast.error(response.message || 'Failed to fetch documents');
        }
      } catch (error) {
        console.error('Error handling documents:', error);
        toast.error('Failed to load documents. Using sample data instead.');
        
        // Fallback to empty state on critical error
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to format file size
    const formatFileSize = (bytes) => {
      if (!bytes) return 'Unknown';
      
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    fetchDocuments();
  }, [loanId, refreshTrigger]);

  // Handle document upload
  const handleUpload = async (formData) => {
    try {
      // Extract the file, category and description from the FormData
      const files = formData.getAll('files');
      const file = files[0]; // Get the first file
      const category = formData.get('category');
      const description = formData.get('description');
      
      if (!file || !category) {
        throw new Error('File and category are required');
      }
      
      // Get a valid document type for the selected category
      const validCategory = documentCategories.find(c => c.value === category)?.value || 'Other';
      
      // Select an appropriate document type based on the category and filename
      let documentType = 'Other'; // Default
      
      if (documentTypes[validCategory] && documentTypes[validCategory].length > 0) {
        // For simplicity, just use the first available document type for this category
        documentType = documentTypes[validCategory][0];
        
        // Try to guess a more appropriate document type based on filename (optional)
        const fileName = file.name.toLowerCase();
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
        if (!documentTypes[validCategory].includes(documentType)) {
          documentType = documentTypes[validCategory][0];
        }
      }
      
      console.log(`Using category: ${validCategory}, document type: ${documentType}`);
      
      // Pass the properly structured data to DocumentService
      const response = await DocumentService.uploadDocument(
        {
          name: file.name,
          type: documentType,  // Use a valid document type
          category: validCategory, // Use a valid category from the enum
          description: description || '',
          tags: []
        },
        loanId,
        file
      );
      
      if (response.success) {
        toast.success('Document uploaded successfully');
        // Refresh document list
        setRefreshTrigger(prev => prev + 1);
        return true;
      } else {
        toast.error(response.message || 'Failed to upload document');
        return false;
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload document. Please try again.');
      throw error;
    }
  };

  // Handle document view
  const handleView = (document) => {
    setViewingDocument(document);
  };

  // Handle document download
  const handleDownload = async (document) => {
    try {
      const response = await DocumentService.downloadDocument(document.id);
      
      if (response.success) {
        toast.success(`Downloading ${document.name}`);
        
        // Create a download link and trigger download
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = response.data.filename || document.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Revoke the blob URL after download
        setTimeout(() => {
          URL.revokeObjectURL(response.data.url);
        }, 100);
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  // Handle document deletion
  const handleDelete = async (document) => {
    try {
      const response = await DocumentService.deleteDocument(document.id);
      
      if (response.success) {
        // Update local state to remove the document
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== document.id));
        
        toast.success(`Document "${document.name}" successfully deleted`);
      } else {
        toast.error(response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document. Please try again.');
    }
  };

  // Handle document status update (for lenders)
  const handleStatusUpdate = async (updatedDocument) => {
    try {
      // For lenders, this is a document verification action
      const response = await DocumentService.verifyDocument(updatedDocument.id, {
        status: updatedDocument.status,
        notes: updatedDocument.notes || ''
      });
      
      if (response.success) {
        // Update local state with the updated document
        setDocuments(prevDocs => 
          prevDocs.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
        );
        
        // Close the viewer
        setViewingDocument(null);
        
        toast.success(`Document status updated successfully`);
      } else {
        toast.error(response.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Document Upload Section */}
      <DocumentUpload 
        onUpload={handleUpload} 
        categories={documentCategories} 
        maxFileSize={10} 
      />
      
      {/* Document List Section */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DocumentList 
          documents={documents} 
          onView={handleView} 
          onDelete={handleDelete} 
          onDownload={handleDownload} 
        />
      )}
      
      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer 
          document={viewingDocument} 
          onClose={() => setViewingDocument(null)} 
          onDownload={handleDownload}
          // Only pass status update handler for lenders and admins
          onStatusUpdate={['lender', 'admin'].includes(userRole) ? handleStatusUpdate : undefined}
        />
      )}
    </div>
  );
};

export default DocumentManager;
