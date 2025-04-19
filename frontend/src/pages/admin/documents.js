import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DocumentVerification from '../../components/admin/DocumentVerification';
import DocumentTemplateManager from '../../components/admin/DocumentTemplateManager';
import { adminService } from '../../services/api';

/**
 * Admin Document Management Page
 * Handles document verification and template management
 */
const AdminDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('verify');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsResponse, templatesResponse] = await Promise.all([
        adminService.getAllDocuments(),
        adminService.getDocumentTemplates()
      ]);
      setDocuments(docsResponse.data.documents || []);
      setTemplates(templatesResponse.data.templates || []);
    } catch (error) {
      console.error('Error fetching document data:', error);
      toast.error('Failed to load document data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyDocument = async (documentId, status, message = '') => {
    try {
      await adminService.verifyDocument(documentId, { status, message });
      
      // Update document in state
      setDocuments(documents.map(doc => {
        if (doc._id === documentId) {
          return { ...doc, verificationStatus: status, verificationMessage: message };
        }
        return doc;
      }));
      
      toast.success(`Document ${status === 'approved' ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to update document status');
    }
  };
  
  const handleCreateTemplate = async (formData) => {
    try {
      const response = await adminService.createDocumentTemplate(formData);
      
      // Add new template to state
      setTemplates([...templates, response.data.template]);
      
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };
  
  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await adminService.deleteDocumentTemplate(templateId);
        
        // Remove template from state
        setTemplates(templates.filter(t => t._id !== templateId));
        
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };
  
  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout title="Document Management">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Document Management</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => fetchData()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('verify')}
                  className={`${
                    activeTab === 'verify'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Document Verification
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`${
                    activeTab === 'templates'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Document Templates
                </button>
              </nav>
            </div>
            
            {/* Document Verification Tab */}
            {activeTab === 'verify' && (
              <DocumentVerification 
                documents={documents}
                onVerifyDocument={handleVerifyDocument}
                loading={loading}
              />
            )}
            
            {/* Document Templates Tab */}
            {activeTab === 'templates' && (
              <DocumentTemplateManager 
                templates={templates}
                onTemplateCreate={handleCreateTemplate}
                onTemplateDelete={handleDeleteTemplate}
                loading={loading}
              />
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminDocumentsPage;
