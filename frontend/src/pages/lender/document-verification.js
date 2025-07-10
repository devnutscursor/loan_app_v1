import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { DocumentService } from '../../services';
import { FiCheck, FiX, FiMessageSquare, FiFileText, FiDownload, FiAlertTriangle, FiFilter } from 'react-icons/fi';

const DocumentVerification = () => {
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingDoc, setProcessingDoc] = useState(null);
  const [updatedDocuments, setUpdatedDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    documentType: '',
    dateRange: ''
  });

  useEffect(() => {
    loadVerificationQueue();
  }, [currentPage, filters]);
  
  // Debug effect to help diagnose button state issues
  useEffect(() => {
    console.log('Updated documents state:', updatedDocuments);
  }, [updatedDocuments]);

  const loadVerificationQueue = async () => {
    setLoading(true);
    try {
      // Store current state of updated documents to preserve across refresh
      const currentUpdatedDocs = [...updatedDocuments];
      
      const response = await DocumentService.getVerificationQueue(filters, currentPage, 10);
      
      if (response.success) {
        setVerificationQueue(response.data.documents);
        setTotalPages(Math.ceil(response.data.total / 10));
        
        // Find all documents that should be marked as updated
        // 1. Any documents with 'Needs Correction' status from backend
        const needsChangesDocuments = response.data.documents
          .filter(doc => doc.status === 'Needs Correction')
          .map(doc => doc._id);
          
        // 2. Any documents we've already tracked as updated
        const documentsInCurrentView = response.data.documents.map(doc => doc._id);
        const relevantPreviouslyTracked = currentUpdatedDocs.filter(id => 
          documentsInCurrentView.includes(id)
        );
        
        // 3. Combine all sources of updated documents without duplicates
        const allUpdatedDocs = [...new Set([...needsChangesDocuments, ...relevantPreviouslyTracked, ...currentUpdatedDocs])];
        
        console.log('Updated documents tracking:', {
          fromBackend: needsChangesDocuments,
          previouslyTracked: currentUpdatedDocs,
          combined: allUpdatedDocs
        });
        
        // Set the complete list of updated documents
        setUpdatedDocuments(allUpdatedDocs);
      } else {
        toast.error(response.message || 'Failed to load verification queue');
      }
    } catch (error) {
      console.error('Error loading verification queue:', error);
      toast.error('Error loading verification queue');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentStatus = async (documentId, status) => {
    setProcessingDoc(documentId);
    try {
      // Add the document to updatedDocuments list immediately when requesting changes
      // This ensures the UI updates right away without waiting for backend response
      if (status === 'needs_changes') {
        setUpdatedDocuments(prev => {
          // Make sure we're not adding duplicates
          if (!prev.includes(documentId)) {
            console.log(`Adding document ${documentId} to updatedDocuments`);
            return [...prev, documentId];
          }
          return prev;
        });
      }
      
      const response = await DocumentService.updateDocumentStatus(documentId, status, feedback);
      
      if (response.success) {
        toast.success(response.message || `Document ${status} successfully`);
        
        // Refresh the queue - but don't reset our updated documents tracking
        const currentUpdatedDocs = [...updatedDocuments];
        await loadVerificationQueue();
        
        // Re-apply our tracked documents if they were lost during queue refresh
        if (status === 'needs_changes') {
          setUpdatedDocuments(prev => {
            const combined = [...new Set([...prev, ...currentUpdatedDocs, documentId])];
            console.log('Updated documents after operation:', combined);
            return combined;
          });
        }
        
        if (modalOpen) {
          closeModal();
        }
      } else {
        toast.error(response.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Error updating document status');
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await DocumentService.downloadDocument(documentId);
      
      if (response.success) {
        // Create a download link and simulate click
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(response.data.url);
      } else {
        toast.error(response.message || 'Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document');
    }
  };

  const openDocumentModal = (document) => {
    setSelectedDocument(document);
    
    // Pre-fill feedback if document already has updates requested
    if (document.status === 'Needs Correction' || updatedDocuments.includes(document._id)) {
      setFeedback(document.feedback || 'Update requested for this document.');
    } else {
      setFeedback('');
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDocument(null);
    setFeedback('');
    setModalOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      documentType: '',
      dateRange: ''
    });
    setCurrentPage(1);
  };

  const renderPagination = () => {
    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-l-md ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            Previous
          </button>
          <div className="px-4 py-2 bg-white text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-r-md ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout title="Document Verification">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Document Verification Queue</h1>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, priority: 'high' }))}
                  className={`px-3 py-1 rounded-md ${
                    filters.priority === 'high'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  <FiAlertTriangle className="inline mr-1" /> High Priority
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => document.getElementById('filterDropdown').classList.toggle('hidden')}
                    className="px-3 py-1 rounded-md bg-white text-gray-700 border border-gray-300"
                  >
                    <FiFilter className="inline mr-1" /> Filters
                  </button>
                  
                  <div id="filterDropdown" className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-4 z-10 hidden">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                      <select
                        name="documentType"
                        value={filters.documentType}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="">All Types</option>
                        <option value="id_verification">ID Verification</option>
                        <option value="income_proof">Income Proof</option>
                        <option value="address_proof">Address Proof</option>
                        <option value="bank_statement">Bank Statement</option>
                        <option value="tax_return">Tax Return</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        name="priority"
                        value={filters.priority}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <select
                        name="dateRange"
                        value={filters.dateRange}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : verificationQueue.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">No documents awaiting verification</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg divide-y divide-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verificationQueue.map((document) => (
                      <tr key={document._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiFileText className="mr-2 text-primary" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {document.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </div>
                              <div className="text-sm text-gray-500">
                                {document.description || 'No description provided'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {document.loanId ? `#${document.loanId.substring(0, 8)}...` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.loanAmount ? `$${document.loanAmount.toLocaleString()}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {document.submittedBy ? `${document.submittedBy.firstName} ${document.submittedBy.lastName}` : 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.submittedBy ? document.submittedBy.email : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {document.status === 'Approved' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : document.status === 'Rejected' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Rejected
                            </span>
                          ) : document.status === 'Needs Correction' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Needs Correction
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownload(document._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Download Document"
                            >
                              <FiDownload />
                            </button>
                            <button
                              onClick={() => handleDocumentStatus(document._id, 'approved')}
                              disabled={processingDoc === document._id}
                              className={`text-green-600 hover:text-green-900 ${processingDoc === document._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Approve"
                            >
                              <FiCheck />
                            </button>
                            <button
                              onClick={() => handleDocumentStatus(document._id, 'rejected')}
                              disabled={processingDoc === document._id}
                              className={`text-red-600 hover:text-red-900 ${processingDoc === document._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Reject"
                            >
                              <FiX />
                            </button>
                            {document.status === 'Needs Correction' || updatedDocuments.includes(document._id) ? (
                              <button
                                className="text-yellow-600 cursor-not-allowed opacity-70 flex items-center"
                                title="Update Requested"
                                disabled
                              >
                                <FiMessageSquare />
                                <span className="ml-1 text-xs">Update Requested</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openDocumentModal(document)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Provide Feedback"
                              >
                                <FiMessageSquare />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {verificationQueue.length > 0 && renderPagination()}
            
            {/* Feedback Modal */}
            {modalOpen && selectedDocument && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                  <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Document Feedback</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Provide feedback for the {selectedDocument.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} document:
                      </p>
                      
                      <textarea
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter your feedback or explanation here..."
                      ></textarea>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleDocumentStatus(selectedDocument._id, 'needs_changes')}
                        disabled={processingDoc === selectedDocument._id || !feedback.trim() || updatedDocuments.includes(selectedDocument._id) || selectedDocument.status === 'Needs Correction'}
                        className={`px-4 py-2 bg-yellow-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                          (processingDoc === selectedDocument._id || !feedback.trim() || updatedDocuments.includes(selectedDocument._id) || selectedDocument.status === 'Needs Correction') ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {(updatedDocuments.includes(selectedDocument._id) || selectedDocument.status === 'Needs Correction') ? 'Update Requested' : 'Request Changes'}
                      </button>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentStatus(selectedDocument._id, 'approved')}
                          disabled={processingDoc === selectedDocument._id}
                          className={`px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 ${
                            processingDoc === selectedDocument._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Approve
                        </button>
                        
                        <button
                          onClick={() => handleDocumentStatus(selectedDocument._id, 'rejected')}
                          disabled={processingDoc === selectedDocument._id || !feedback.trim()}
                          className={`px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 ${
                            (processingDoc === selectedDocument._id || !feedback.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={closeModal}
                      className="absolute top-0 right-0 mt-4 mr-5 text-gray-400 hover:text-gray-600"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default DocumentVerification;
