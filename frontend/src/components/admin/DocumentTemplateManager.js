import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

/**
 * Component for managing document templates in the admin interface
 * Allows viewing, creating, and deleting document templates
 */
const DocumentTemplateManager = ({ templates = [], onTemplateCreate, onTemplateDelete, loading = false }) => {
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    documentType: 'id_proof',
    file: null
  });
  
  const documentTypes = [
    { value: 'id_proof', label: 'ID Proof' },
    { value: 'income_proof', label: 'Income Proof' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'tax_return', label: 'Tax Return' },
    { value: 'employment_verification', label: 'Employment Verification' },
    { value: 'loan_document', label: 'Loan Document' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateForm({
      ...templateForm,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setTemplateForm({
        ...templateForm,
        file: e.target.files[0]
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!templateForm.name || !templateForm.documentType || !templateForm.file) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', templateForm.name);
    formData.append('description', templateForm.description);
    formData.append('documentType', templateForm.documentType);
    formData.append('template', templateForm.file);
    
    onTemplateCreate(formData);
    
    // Reset form
    setTemplateForm({
      name: '',
      description: '',
      documentType: 'id_proof',
      file: null
    });
    
    // Reset file input
    document.getElementById('template-file').value = '';
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const getDocumentTypeLabel = (type) => {
    const found = documentTypes.find(t => t.value === type);
    return found ? found.label : type;
  };
  
  const getFileIcon = (fileName) => {
    if (!fileName) return null;
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.99 6H17L14.5 14h2.51l1.99-5H21v7h-2v-5zm-7 5h-2V9h2v5zm-4 0H5l1.5-2.5L5 9h2l1.5 2.5L7 14z"/>
        </svg>
      );
    } else {
      return (
        <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      );
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Template List */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Document Templates</h3>
            <p className="mt-1 text-sm text-gray-500">
              Templates that borrowers can download and use for their loan applications
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : templates.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {templates.map((template) => (
                <li key={template._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getFileIcon(template.fileName)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <div className="flex space-x-2">
                          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {getDocumentTypeLabel(template.documentType)}
                          </span>
                          <p className="text-sm text-gray-500">
                            Added {formatDate(template.createdAt)}
                          </p>
                        </div>
                        {template.description && (
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={template.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary hover:bg-primary hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => onTemplateDelete(template._id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 px-4 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No document templates available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Template Form */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Add Template</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Upload new document templates for borrowers to use in their applications</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
                  Template Name*
                </label>
                <input
                  type="text"
                  name="name"
                  id="template-name"
                  value={templateForm.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Income Verification Form"
                />
              </div>
              
              <div>
                <label htmlFor="template-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="template-description"
                  name="description"
                  value={templateForm.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Template description..."
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="template-type" className="block text-sm font-medium text-gray-700">
                  Document Type*
                </label>
                <select
                  id="template-type"
                  name="documentType"
                  value={templateForm.documentType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="template-file" className="block text-sm font-medium text-gray-700">
                  File*
                </label>
                <input
                  type="file"
                  id="template-file"
                  onChange={handleFileChange}
                  required
                  className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm py-2 px-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark focus:outline-none"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Accepted file types: PDF, DOC, DOCX, XLS, XLSX, TXT
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Template
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentTemplateManager.propTypes = {
  templates: PropTypes.array,
  onTemplateCreate: PropTypes.func.isRequired,
  onTemplateDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default DocumentTemplateManager;
