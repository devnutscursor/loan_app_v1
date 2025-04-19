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

  // Document categories available for upload
  const documentCategories = [
    { value: 'identification', label: 'Identification Documents' },
    { value: 'income', label: 'Income Verification' },
    { value: 'property', label: 'Property Documents' },
    { value: 'bank', label: 'Bank Statements' },
    { value: 'tax', label: 'Tax Returns' },
    { value: 'insurance', label: 'Insurance Documents' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch documents on component mount or when refreshTrigger changes
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        let response;
        
        if (loanId) {
          // Fetch documents for a specific loan
          response = await DocumentService.getLoanDocuments(loanId);
        } else {
          // Fetch all documents for the current user
          response = await DocumentService.getUserDocuments();
        }
        
        if (response.success) {
          // Format documents for display
          const formattedDocs = response.data.map(doc => ({
            id: doc._id,
            name: doc.fileName,
            description: doc.description || '',
            category: doc.type,
            status: doc.status,
            notes: doc.notes,
            uploadedAt: new Date(doc.createdAt),
            size: formatFileSize(doc.fileSize),
            url: doc.fileUrl,
            metadata: doc.metadata || {}
          }));
          
          setDocuments(formattedDocs);
        } else {
          toast.error('Failed to load documents');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents. Please try again later.');
        
        // In development environment, use sample data as fallback
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Using sample document data due to API error');
          
          const sampleDocuments = [
            {
              id: 'sample-1',
              name: 'passport.pdf',
              description: 'Passport for identification',
              category: 'identification',
              status: 'approved',
              uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              size: '2.3 MB',
              url: '/sample-files/passport.pdf'
            },
            {
              id: 'sample-2',
              name: 'pay-stub-march-2023.pdf',
              description: 'Pay stub for March 2023',
              category: 'income',
              status: 'pending',
              uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              size: '1.8 MB',
              url: '/sample-files/pay-stub.pdf'
            }
          ];
          
          setDocuments(sampleDocuments);
        }
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
  const handleUpload = async (documentData) => {
    try {
      const response = await DocumentService.uploadDocument(
        {
          type: documentData.category,
          description: documentData.description,
          tags: documentData.tags || []
        },
        loanId,
        documentData.file
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
