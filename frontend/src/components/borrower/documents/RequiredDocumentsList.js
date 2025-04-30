import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentService } from '../../../services';

/**
 * RequiredDocumentsList Component
 * 
 * Displays a checklist of required documents for a loan application
 * with status indicators and upload buttons.
 */
const RequiredDocumentsList = ({ loanId, onDocumentUploaded, selectedRequest }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Define the standard required documents for loan approval
  const standardRequirements = [
    {
      id: 'identification',
      title: 'Identification',
      description: 'State issued ID, Driver\'s License or Passport',
      category: 'Identity',
      documentType: 'Driver License',
      required: true
    },
    {
      id: 'income',
      title: 'Self Employed K1\'s',
      description: 'Business tax returns (K-1s) and K-1s - Most recently filed 2 years',
      category: 'Income',
      documentType: 'Tax Return',
      required: true
    },
    {
      id: 'business',
      title: 'Schedule C or Corp/S-Corp/Partnership',
      description: 'YTD profit and loss, and balance sheet, signed and dated',
      category: 'Income',
      documentType: 'Other',
      required: true
    },
    {
      id: 'bank',
      title: 'Bank Statements',
      description: 'Most recent consecutive two months (all pages). Note: Very important that you submit ALL pages of each statement... even the last page that is blank.',
      category: 'Assets',
      documentType: 'Bank Statement',
      required: true
    },
    {
      id: 'retirement',
      title: 'Retirement account',
      description: 'If applicable - please submit the following: a) Most recent quarterly statement b) Terms & Conditions for hardship withdrawals and loans',
      category: 'Assets',
      documentType: 'Retirement Account Statement',
      required: false
    },
    {
      id: 'mortgage',
      title: 'Mortgage Statement',
      description: 'Please upload a copy of your most recent monthly mortgage statement for all real estate owned',
      category: 'Property',
      documentType: 'Other',
      required: false
    },
    {
      id: 'taxes',
      title: 'Property Taxes (most recent full year)',
      description: 'Please upload the most recent full year property tax bills for all real estate owned',
      category: 'Property',
      documentType: 'Other',
      required: false
    },
    {
      id: 'insurance',
      title: 'Homeowner\'s Insurance',
      description: 'Please upload a copy of your homeowner\'s insurance policy for all real estate owned',
      category: 'Insurance',
      documentType: 'Insurance Declaration',
      required: false
    }
  ];
  
  // Fetch required documents and their statuses from the API
  // Effect to handle the selected document request
  useEffect(() => {
    if (selectedRequest && requirements.length > 0) {
      let foundMatchingRequirement = false;
      
      // Find the requirement that matches the selected document request
      const updatedReqs = requirements.map(req => {
        if (req.category === selectedRequest.category && 
            req.documentType === selectedRequest.documentType) {
          foundMatchingRequirement = true;
          // If document was previously submitted, move it back to required state
          return {
            ...req,
            isHighlighted: true,
            isSubmitted: false, // Reset submission status for re-upload
            status: 'Requested', // Mark as requested
            // Update title and description if provided in the request
            title: selectedRequest.title || req.title,
            description: selectedRequest.description || req.description
          };
        }
        return {
          ...req,
          isHighlighted: false
        };
      });
      
      // If no matching requirement was found, add it as a new requirement
      if (!foundMatchingRequirement) {
        updatedReqs.push({
          id: `request-${selectedRequest.category}-${selectedRequest.documentType}`,
          title: selectedRequest.title,
          description: selectedRequest.description,
          category: selectedRequest.category,
          documentType: selectedRequest.documentType,
          isHighlighted: true,
          isSubmitted: false,
          status: 'Requested',
          required: true
        });
      }
      
      setRequirements(updatedReqs);
    }
  }, [selectedRequest]);

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true);
      try {
        // Try to get actual requirements from the API if available
        if (loanId) {
          const response = await DocumentService.getDocumentRequirements(loanId);
          
          if (response.success && response.data) {
            // Process real requirements from API
            console.log('Got document requirements from API:', response.data);
            
            // TODO: Process actual requirements from API when implemented
            // For now, just use our standard list
            const updatedReqs = mapRequirementsWithStatus(standardRequirements, []);
            setRequirements(updatedReqs);
          } else {
            // Fall back to standard requirements
            const updatedReqs = mapRequirementsWithStatus(standardRequirements, []);
            setRequirements(updatedReqs);
          }
        } else {
          // No loan selected, show standard requirements
          setRequirements(standardRequirements);
        }
      } catch (error) {
        console.error('Error fetching document requirements:', error);
        toast.error('Failed to load document requirements');
        
        // Fall back to standard requirements
        setRequirements(standardRequirements);
      } finally {
        setLoading(false);
      }
    };
    
    // Also fetch any existing documents for this loan to check status
    const fetchExistingDocuments = async () => {
      try {
        if (loanId) {
          // Use the getLoanDocuments method to get documents for this loan
          const response = await DocumentService.getLoanDocuments(loanId);
          
          console.log('Existing documents response:', response);
          
          let documents = [];
          
          // Check if we have valid data and extract the documents array
          if (response.success) {
            if (response.data && response.data.data) {
              // If the API returns a nested data structure
              documents = response.data.data;
            } else if (Array.isArray(response.data)) {
              // If the API returns an array directly
              documents = response.data;
            }
            
            console.log('Processed documents array:', documents);
            
            // If we have a selected request, check if it corresponds to a document that needs to be removed
            if (selectedRequest) {
              // Filter out documents that match the selected request - they should be re-uploaded
              const filteredDocuments = documents.filter(doc => 
                !(doc.category === selectedRequest.category && 
                  doc.documentType === selectedRequest.documentType));
                
              console.log('Filtered out requested document for re-upload', 
                documents.length - filteredDocuments.length, 'documents removed');
              
              const updatedReqs = mapRequirementsWithStatus(standardRequirements, filteredDocuments);
              setRequirements(updatedReqs);
            } else {
              // Use the standard requirements as the base and update with document statuses
              const updatedReqs = mapRequirementsWithStatus(standardRequirements, documents);
              setRequirements(updatedReqs);
            }
          } else {
            console.warn('API returned unsuccessful response:', response);
            // Just use standard requirements if API call failed
            setRequirements(mapRequirementsWithStatus(standardRequirements, []));
          }
        }
      } catch (error) {
        console.error('Error fetching existing documents:', error);
        // Just use standard requirements without status updates
        setRequirements(mapRequirementsWithStatus(standardRequirements, []));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequirements();
    fetchExistingDocuments();
  }, [loanId]);
  
  // Map requirements with status based on existing documents
  const mapRequirementsWithStatus = (requirements, existingDocs) => {
    console.log('Mapping requirements with existing docs:', { requirements, existingDocs });
    
    return requirements.map(req => {
      let matchingDoc = null;
      
      // Ensure existingDocs is an array before processing
      if (Array.isArray(existingDocs) && existingDocs.length > 0) {
        // First try document type + category (most specific match)
        matchingDoc = existingDocs.find(doc => 
          doc.documentType === req.documentType && 
          doc.category === req.category
        );
        
        if (matchingDoc) {
          console.log(`Found matching document for ${req.category}/${req.documentType} by type and category:`, matchingDoc);
        }
        
        // If no match, try title match
        if (!matchingDoc) {
          matchingDoc = existingDocs.find(doc => 
            doc.name && req.title && doc.name.toLowerCase().includes(req.title.toLowerCase())
          );
          
          if (matchingDoc) {
            console.log(`Found matching document for ${req.title} by name:`, matchingDoc);
          }
        }
        
        // Last resort - just check the document type
        if (!matchingDoc && req.documentType !== 'Other') {
          matchingDoc = existingDocs.find(doc => doc.documentType === req.documentType);
          
          if (matchingDoc) {
            console.log(`Found matching document for ${req.documentType} by type only:`, matchingDoc);
          }
        }
      }
      
      // Create the updated requirement with status information
      const updatedReq = {
        ...req,
        status: matchingDoc ? matchingDoc.status : 'Not Submitted',
        documentId: matchingDoc ? matchingDoc._id : null,
        isSubmitted: !!matchingDoc,
        uploadedDate: matchingDoc ? new Date(matchingDoc.createdAt || Date.now()).toLocaleDateString() : null
      };
      
      return updatedReq;
    });
  };
  
  // Handle file selection and upload
  const handleFileUpload = async (event, requirement) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadingDocId(requirement.id);
    try {
      // Create document data
      const documentData = {
        name: requirement.title || file.name, // Use the requirement title for better matching
        documentType: requirement.documentType,
        category: requirement.category,
        description: requirement.description
      };
      
      console.log('Uploading document with data:', documentData);
      
      // Upload the document
      const response = await DocumentService.uploadDocument(documentData, loanId, file);
      
      if (response.success) {
        toast.success(`${requirement.title} document uploaded successfully`);
        
        // Update the requirement status locally
        setRequirements(prevReqs => 
          prevReqs.map(req => 
            req.id === requirement.id 
              ? { 
                  ...req, 
                  status: 'Pending Review', 
                  isSubmitted: true, 
                  documentId: response.data._id,
                  uploadedDate: new Date().toLocaleDateString()
                } 
              : req
          )
        );
        
        // Refresh the documents list to get updated status from server
        setTimeout(() => {
          fetchExistingDocuments();
        }, 1000);
        
        // Notify parent component
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
      } else {
        toast.error(response.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocId(null);
    }
  };
  
  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // No loan selected message
  if (!loanId) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Required Documents</h3>
        <p className="text-sm text-gray-600">
          Please select a loan from the dropdown above to view required documents.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
        <p className="mt-1 text-sm text-gray-600">
          Please upload all documents to complete your loan application
        </p>
      </div>
      
      {/* Pending Tasks */}
      <div className="p-5">
        {requirements.filter(req => !req.isSubmitted).length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="ml-3 text-md font-medium text-gray-900">Documents to Upload</h4>
            </div>
            
            <div className="mt-2 border rounded-lg overflow-hidden">
              <ul role="list" className="divide-y divide-gray-200">
                {/* If there's a selected request, show it first and filter the rest */}
                {requirements.filter(req => !req.isSubmitted)
                  .sort((a, b) => {
                    // Sort highlighted items to the top
                    if (a.isHighlighted && !b.isHighlighted) return -1;
                    if (!a.isHighlighted && b.isHighlighted) return 1;
                    return 0;
                  })
                  .map((req) => (
                  <li key={req.id} className={`py-3 ${req.isHighlighted ? 'bg-yellow-50 -mx-4 px-4 rounded-md border-l-4 border-yellow-400' : ''} hover:bg-gray-50 transition-colors duration-150`}>
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex flex-wrap items-center justify-between">
                            <h5 className="text-base font-medium text-gray-900 mr-3">{req.title}</h5>
                            <span className="mt-1 px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full inline-flex items-center">
                              Required
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{req.description}</p>
                          <div className="mt-3">
                            <label 
                              htmlFor={`file-upload-${req.id}`}
                              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${uploadingDocId === req.id ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150`}
                            >
                              <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {uploadingDocId === req.id ? 'Uploading...' : 'Upload Document'}
                            </label>
                            <input
                              id={`file-upload-${req.id}`}
                              name={`file-upload-${req.id}`}
                              type="file"
                              className="sr-only"
                              onChange={(e) => handleFileUpload(e, req)}
                              disabled={uploadingDocId !== null}
                            />
                            {/* Hidden file input specifically for document requests by category/type */}
                            <input
                              id={`fileInput-${req.category}-${req.documentType}`}
                              type="file"
                              className="sr-only"
                              onChange={(e) => handleFileUpload(e, req)}
                              disabled={uploadingDocId !== null}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Great job! You've uploaded all the required documents.
            </p>
          </div>
        )}
      </div>
      
      {/* Completed Tasks */}
      {requirements.some(req => req.isSubmitted) && (
        <div className="px-5 py-4 bg-gray-50 border-t">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="ml-2 text-md font-medium text-gray-900">Completed</h4>
          </div>
          
          <div className="space-y-2">
            {requirements.filter(req => req.isSubmitted).map((req) => (
              <div key={req.id} className="flex items-start p-2 rounded-md bg-white border border-gray-100">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium text-gray-900">{req.title}</div>
                    <div className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full 
                      ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {req.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {requirements.length === 0 && (
        <div className="px-5 py-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No document requirements found</h3>
          <p className="mt-1 text-sm text-gray-500">Select a loan to view document requirements.</p>
        </div>
      )}
    </div>
  );
};

export default RequiredDocumentsList;
