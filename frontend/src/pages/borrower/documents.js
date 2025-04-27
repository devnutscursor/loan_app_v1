import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DocumentManager from '../../components/borrower/documents/DocumentManager';
import RequiredDocumentsList from '../../components/borrower/documents/RequiredDocumentsList';
import { LoanService } from '../../services';

/**
 * Documents Component
 * 
 * Main documents page for borrowers to upload and manage loan documents.
 */
const Documents = () => {
  // State for selected loan to associate documents with
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user's loans on component mount
  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoadingLoans(true);
      try {
        // Apply any filters (empty for now)
        const apiFilters = {};
        
        // Fetch loans using the LoanService
        const response = await LoanService.getLoans(apiFilters);
        
        if (response.success) {
          // Extract loans from the nested structure in the API response
          const loansData = response.data?.data?.loans || [];
          console.log('Loaded loans:', loansData.length);
          setLoans(loansData);
        } else {
          console.log('Setting empty loans array - API call unsuccessful');
          setLoans([]);
          toast.error(response.message || 'Failed to load loans');
        }
      } catch (error) {
        console.error('Error loading loans:', error);
        toast.error('Error loading your loan applications. Using sample data instead.');
        
        // Use sample data for development/testing when API fails
        const sampleLoans = [
          { _id: 'sample-loan-1', purpose: 'Purchase', status: 'In Progress', loanNumber: 'LN1001' },
          { _id: 'sample-loan-2', purpose: 'Refinance', status: 'Approved', loanNumber: 'LN1002' }
        ];
        setLoans(sampleLoans);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);



  // We no longer need this handler as we're using onClick directly
  // Keep the function to avoid breaking any other code references
  const handleLoanChange = (e) => {
    // This is now handled by the onClick handlers in the loan items
  };



  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Document Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload, manage, and track documents for your loan applications
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Enhanced Loan Selector */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">Select Loan Application</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the loan application you want to upload documents for
                </p>
              </div>
              
              <div className="px-6 py-4">
                {isLoadingLoans ? (
                  <div className="space-y-3">
                    <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
                    <div className="animate-pulse h-14 bg-gray-100 rounded-md"></div>
                  </div>
                ) : loans.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto px-1 py-1 space-y-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {loans.map(loan => {
                      // Determine status color
                      let statusColor = 'bg-gray-100 text-gray-800';
                      if (loan.status) {
                        const status = loan.status.toLowerCase();
                        if (status.includes('approved')) statusColor = 'bg-green-100 text-green-800';
                        else if (status.includes('review')) statusColor = 'bg-yellow-100 text-yellow-800';
                        else if (status.includes('submit')) statusColor = 'bg-blue-100 text-blue-800';
                        else if (status.includes('reject')) statusColor = 'bg-red-100 text-red-800';
                      }
                      
                      // If no loan is selected, select the first one by default
                      if (!selectedLoanId && loans.length > 0 && !isLoadingLoans) {
                        setSelectedLoanId(loans[0]._id);
                      }
                      
                      return (
                        <div 
                          key={loan._id || `loan-${Math.random()}`}
                          onClick={() => setSelectedLoanId(loan._id)}
                          className={`cursor-pointer p-3 rounded-md hover:bg-blue-50 transition-colors duration-150 ${selectedLoanId === loan._id ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-1' : 'bg-white border border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${selectedLoanId === loan._id ? 'bg-blue-500' : 'border-2 border-gray-300'}`}></div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {loan.loanNumber || loan._id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {loan.loanDetails?.loanType || 'Loan'} {loan.loanDetails?.loanPurpose ? `- ${loan.loanDetails.loanPurpose}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                              {loan.status || 'Processing'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No loan applications found</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by creating a new loan application.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Required Documents Checklist */}
            <div className="mb-6">
              <RequiredDocumentsList 
                loanId={selectedLoanId} 
                onDocumentUploaded={() => setRefreshTrigger(prev => prev + 1)} 
              />
            </div>
            
            
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Documents;
