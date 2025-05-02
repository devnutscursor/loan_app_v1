import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { lenderService } from '../../../services/api';

// Form components for editing
import PersonalDetails from '../../../components/forms/borrower/PersonalDetails';
import ResidenceHistory from '../../../components/forms/borrower/ResidenceHistory';
import PropertyInformation from '../../../components/forms/property/PropertyInformation';
import LoanDetailsForm from '../../../components/forms/property/LoanDetails';
import EmploymentHistory from '../../../components/forms/borrower/EmploymentHistory';
import Income from '../../../components/forms/financial/Income';
import Debts from '../../../components/forms/financial/Debts';
import Assets from '../../../components/forms/financial/Assets';
import PropertyOwned from '../../../components/forms/additional/PropertyOwned';
import MilitaryService from '../../../components/forms/additional/MilitaryService';
import Declarations from '../../../components/forms/declarations/Declarations';
import Demographics from '../../../components/forms/declarations/Demographics';

// Import document components
import DocumentsCard from '../../../components/borrower/loan/DocumentsCard';
import LenderDocumentRequirements from '../../../components/lender/documents/LenderDocumentRequirements';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const LoanDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('borrower'); // Default active tab
  
  // Helper function to normalize loan data structure
  const normalizeData = (loanData) => {
    return {
      borrowerDetails: loanData.borrowerDetails || {},
      loanDetails: loanData.loanDetails || {},
      property: loanData.property || {},
      income: loanData.income || {},
      assets: loanData.assets || [],
      debts: loanData.debts || [],
      propertiesOwned: loanData.propertiesOwned || [],
      declarations: loanData.declarations || {},
      demographics: loanData.demographics || {},
      militaryService: loanData.militaryService || {},
      ...loanData
    };
  }
  
  // Define tabs structure
  const tabs = [
    { id: 'borrower', label: 'Borrower Information', icon: '👤' },
    { id: 'loan', label: 'Loan Details', icon: '📄' },
    { id: 'property', label: 'Property Information', icon: '🏠' },
    { id: 'financial', label: 'Financial Information', icon: '💰' },
    { id: 'additional', label: 'Additional Information', icon: '📋' },
    { id: 'documents', label: 'Documents', icon: '📎' },
  ];

  useEffect(() => {
    // Don't fetch until id is available
    if (!id) return;

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching loan details for ID:', id);

        const response = await lenderService.getLoan(id);
        console.log('Loan details response:', response);

        if (response && (response.data || response.data?.data)) {
          // Extract loan data, handling different response structures
          // Based on the API structure in memory, data is nested under response.data.data
          const loanData = response.data?.data?.loan || response.data?.data || response.data;
          console.log('Loan details:', loanData);

          // Ensure all required properties exist with defaults
          const normalizedData = {
            borrowerDetails: loanData.borrowerDetails || {},
            loanDetails: loanData.loanDetails || {},
            property: loanData.property || {},
            income: loanData.income || {},
            assets: loanData.assets || [],
            debts: loanData.debts || [],
            propertiesOwned: loanData.propertiesOwned || [],
            declarations: loanData.declarations || {},
            demographics: loanData.demographics || {},
            militaryService: loanData.militaryService || {},
            ...loanData
          };
          
          // Add console logs to inspect data
          console.log('Normalized data structure:', normalizedData);
          console.log('Borrower details:', normalizedData.borrowerDetails);
          console.log('Loan details:', normalizedData.loanDetails);

          setLoan(normalizedData);
          
          // Fetch documents separately since they are stored in a different collection
          try {
            const docsResponse = await lenderService.getLoanDocuments(id);
            console.log('Documents response:', docsResponse);
            
            if (docsResponse && docsResponse.data) {
              // Extract documents, handling nested structure
              const docsData = docsResponse.data?.data || docsResponse.data;
              setDocuments(Array.isArray(docsData) ? docsData : []);
            }
          } catch (docError) {
            console.error('Error fetching loan documents:', docError);
            // Don't fail the whole page load just because documents failed
          }
        } else {
          console.warn('Failed to fetch loan details');
          setError('Failed to load loan details');
          toast.error('Failed to load loan details');
        }
      } catch (error) {
        console.error('Error fetching loan details:', error);
        setError('An error occurred while loading the loan details');
        toast.error('Failed to load loan details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [id]);

  const handleRemoveDocument = async (documentId) => {
    // Document removal is only for borrowers, but we can show a message here
    toast.info('Only borrowers can remove documents');
  };
  
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    status = status.toLowerCase();
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form field changes with better null checks
  const handleFieldChange = (section, field, value) => {
    console.log(`Updating ${section}.${field} with:`, value);
    
    setLoan(prev => {
      // Make sure the section exists
      const sectionData = prev[section] || {};
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value
        }
      };
    });
  };

  // Handle nested field changes
  const handleNestedFieldChange = (section, nestedSection, field, value) => {
    console.log(`Updating ${section}.${nestedSection}.${field} with:`, value);
    
    setLoan(prev => {
      // Make sure the section and nested section exist
      const sectionData = prev[section] || {};
      const nestedSectionData = sectionData[nestedSection] || {};
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [nestedSection]: {
            ...nestedSectionData,
            [field]: value
          }
        }
      };
    });
  };

  // Save all changes to the loan
  const saveLoan = async () => {
    try {
      setSaving(true);
      await lenderService.updateLoan(id, loan);
      toast.success('Loan details saved successfully');
    } catch (error) {
      console.error('Error saving loan:', error);
      toast.error('Failed to save loan details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-4">
              <Link 
                href="/lender/loans"
                className="text-primary hover:text-primary-dark flex items-center mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Loans
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Loan Application Details</h1>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
              <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary rounded-md p-2">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10H21M7 15H8M12 15H13M6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Loan {loan?.loanNumber || ''}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {loan?.loanDetails?.loanType || 'Loan'}
                    </p>
                  </div>
                </div>
                {loan?.status && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(loan.status)}`}>
                    {loan.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading loan details</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : loan ? (
              <div className="space-y-6">
                {/* Tabs Navigation */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === tab.id
                              ? 'border-primary text-primary'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                        >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); saveLoan(); }}>                
                  {/* Loan Details Tab */}
                  {activeTab === 'loan' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Details</h3>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                        <LoanDetailsForm 
                          loanInfo={loan.loanDetails || {}} 
                          onChange={(field, value) => {
                            if (typeof field === 'object' && field.target) {
                              // Extract the actual field name by removing 'loanInfo.' prefix if present
                              const fieldName = field.target.name.replace('loanInfo.', '');
                              handleFieldChange('loanDetails', fieldName, field.target.value);
                            } else {
                              handleFieldChange('loanDetails', field, value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Borrower Information Tab */}
                  {activeTab === 'borrower' && (
                    <>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Details</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <PersonalDetails 
                            borrower={loan.borrowerDetails || {}} 
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                handleFieldChange('borrowerDetails', field.target.name, field.target.value);
                              } else {
                                handleFieldChange('borrowerDetails', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Employment History</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <EmploymentHistory 
                            borrower={loan.borrowerDetails} 
                            onChange={(field, value) => {
                              if (field === 'employers') {
                                handleFieldChange('borrowerDetails', 'employers', value);
                              } else if (typeof field === 'object' && field.target) {
                                handleFieldChange('borrowerDetails', field.target.name, field.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Residence History</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <ResidenceHistory
                            borrower={loan.borrowerDetails || {}}
                            onChange={(field, value) => {
                              if (field === 'addresses') {
                                handleFieldChange('borrowerDetails', 'addresses', value);
                              } else if (typeof field === 'object' && field.target) {
                                handleFieldChange('borrowerDetails', field.target.name, field.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Property Information Tab */}
                  {activeTab === 'property' && (
                    <>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Property Information</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <PropertyInformation 
                            propertyInfo={loan.property || {}} 
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                // Extract the actual field name by removing 'propertyInfo.' prefix if present
                                const fieldName = field.target.name.replace('propertyInfo.', '');
                                handleFieldChange('property', fieldName, field.target.value);
                              } else {
                                handleFieldChange('property', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Properties Owned</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <PropertyOwned
                            propertyOwned={loan.propertiesOwned || []}
                            onChange={(properties) => {
                              setLoan(prev => ({
                                ...prev,
                                propertiesOwned: properties
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Financial Information Tab */}
                  {activeTab === 'financial' && (
                    <>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Income Information</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <Income 
                            income={{...loan.income || {}, otherIncome: Array.isArray(loan.income?.otherIncome) ? loan.income.otherIncome : []}} 
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                // Extract field name by removing any prefix
                                const fieldName = field.target.name.replace('income.', '');
                                handleFieldChange('income', fieldName, field.target.value);
                              } else if (typeof field === 'object') {
                                // Handle case where entire object is passed
                                setLoan(prev => ({
                                  ...prev,
                                  income: field
                                }));
                              } else {
                                handleFieldChange('income', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Assets</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <Assets 
                            assets={loan.assets || []} 
                            onChange={(assets) => {
                              setLoan(prev => ({
                                ...prev,
                                assets: assets
                              }));
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Debts & Liabilities</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <Debts 
                            debts={Array.isArray(loan.debts) ? loan.debts : []}
                            expenses={Array.isArray(loan.expenses) ? loan.expenses : []}
                            onChange={(field, value) => {
                              if (field === 'debts') {
                                setLoan(prev => ({
                                  ...prev,
                                  debts: Array.isArray(value) ? value : []
                                }));
                              } else if (field === 'expenses') {
                                setLoan(prev => ({
                                  ...prev,
                                  expenses: Array.isArray(value) ? value : []
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Additional Information Tab */}
                  {activeTab === 'additional' && (
                    <>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Military Service</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <MilitaryService
                            militaryService={loan.militaryService || {}}
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                // Extract field name, removing any 'militaryService.' prefix
                                const fieldName = field.target.name.replace('militaryService.', '');
                                handleFieldChange('militaryService', fieldName, field.target.value);
                              } else if (typeof field === 'object') {
                                // Handle case where entire object is passed
                                setLoan(prev => ({
                                  ...prev,
                                  militaryService: field
                                }));
                              } else {
                                handleFieldChange('militaryService', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Declarations</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <Declarations
                            declarations={loan.declarations || {}}
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                // Extract field name, removing any 'declarations.' prefix
                                const fieldName = field.target.name.replace('declarations.', '');
                                handleFieldChange('declarations', fieldName, field.target.value);
                              } else if (typeof field === 'object') {
                                // Handle case where entire object is passed
                                setLoan(prev => ({
                                  ...prev,
                                  declarations: field
                                }));
                              } else {
                                handleFieldChange('declarations', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Demographics</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <Demographics
                            demographics={loan.demographics || {}}
                            borrower={loan.borrowerDetails || {}}
                            onChange={(field, value) => {
                              if (typeof field === 'object' && field.target) {
                                // Extract field name, removing any 'demographics.' prefix
                                const fieldName = field.target.name.replace('demographics.', '');
                                handleFieldChange('demographics', fieldName, field.target.value);
                              } else if (typeof field === 'object') {
                                // Handle case where entire object is passed
                                setLoan(prev => ({
                                  ...prev,
                                  demographics: field
                                }));
                              } else {
                                handleFieldChange('demographics', field, value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <>
                      {/* Document Requirements Section */}
                      <LenderDocumentRequirements
                        loanId={id}
                        documents={documents}
                        refreshDocuments={() => {
                          // Refresh the loan details to update documents
                          console.log('=== REFRESHING LOAN DOCUMENTS ===');
                          console.log('📡 Current loan ID:', id);
                          console.log('📋 Current documents count:', documents?.length || 0);
                          
                          // Wrap in try-catch to prevent errors
                          try {
                            // Use the current id from props/state to fetch again
                            if (id) {
                              console.log('⏳ Starting data refresh operation...');
                              setLoading(true);
                              setError(null);
                              
                              // Fetch loan details and documents again
                              console.log('🔎 Fetching loan details and documents using Promise.all');
                              Promise.all([
                                lenderService.getLoan(id),
                                lenderService.getLoanDocuments(id)
                              ])
                              .then(([loanResponse, documentsResponse]) => {
                                console.log('✅ Got loan details response:', loanResponse ? 'Success' : 'Failed');
                                console.log('✅ Got documents response:', documentsResponse ? 'Success' : 'Failed');
                                
                                if (loanResponse && (loanResponse.data || loanResponse.data?.data)) {
                                  // Process loan data
                                  const loanData = loanResponse.data?.data || loanResponse.data;
                                  console.log('📝 Processing loan data with ID:', loanData._id);
                                  console.log('💾 Normalizing loan data...');
                                  setLoan(normalizeData(loanData));
                                } else {
                                  console.warn('⚠️ No loan data found in response');
                                }
                                
                                if (documentsResponse && documentsResponse.success) {
                                  const newDocs = documentsResponse.data || [];
                                  console.log('💾 Setting', newDocs.length, 'documents to state');
                                  console.log('📎 Document IDs:', newDocs.map(d => d._id));
                                  setDocuments(newDocs);
                                } else {
                                  console.warn('⚠️ No documents found in response');
                                }
                                
                                console.log('✅ Data refresh complete');
                              })
                              .catch(error => {
                                console.error('❌ Error refreshing loan details:', error);
                                console.error('❌ Error details:', {
                                  message: error.message,
                                  stack: error.stack?.slice(0, 200) // Only log first part of stack
                                });
                                toast.error('Failed to refresh loan details');
                              })
                              .finally(() => {
                                console.log('🔄 Setting loading state to false');
                                setLoading(false);
                                console.log('=== END OF REFRESH OPERATION ===\n');
                              });
                            } else {
                              console.error('❌ Cannot refresh - no loan ID available');
                            }
                          } catch (error) {
                            console.error('❌ Unexpected error during refresh operation:', error);
                            console.error('❌ Error details:', {
                              message: error.message,
                              stack: error.stack?.slice(0, 200) // Only log first part of stack
                            });
                            setLoading(false);
                          }
                        }}
                      />
                    </>
                  )}
                  
                  {/* Save Button - Always visible */}
                  <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
                    >
                      {saving ? 'Saving Changes...' : 'Save All Changes'}
                    </button>
                  </div>
                </form>

                {/* Lender Actions Section */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Lender Actions</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Actions you can take on this loan application</p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => toast.info('Request document feature will be implemented soon')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Request Additional Documents
                      </button>
                      <button
                        onClick={() => toast.info('Update status feature will be implemented soon')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loan found</h3>
                <p className="mt-1 text-sm text-gray-500">This loan doesn't exist or you don't have permission to view it.</p>
                <div className="mt-6">
                  <Link
                    href="/lender/loans"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Return to Loans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
