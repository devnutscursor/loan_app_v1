import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { LoanService } from '../../../services';

// Import our new components
import LoanSummaryCard from '../../../components/borrower/loan/LoanSummaryCard';
import BorrowerInfoCard from '../../../components/borrower/loan/BorrowerInfoCard';
import PropertyCard from '../../../components/borrower/loan/PropertyCard';

const LoanDetailsPage = () => {
  const router = useRouter();
  const { loanId } = router.query;
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't fetch until loanId is available
    if (!loanId) return;

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching loan details for ID:', loanId);

        const response = await LoanService.getLoan(loanId);
        console.log('Loan details response:', response);

        if (response.success) {
          // Extract loan data, handling different response structures
          const loanData = response.data?.loan || response.data.data;
          
          if (!loanData || Object.keys(loanData).length === 0) {
            console.warn('Loan not found or deleted');
            setError('This loan no longer exists or has been deleted');
            toast.error('This loan no longer exists or has been deleted');
            // Redirect back to loans list after a short delay
            setTimeout(() => {
              router.push('/borrower/loans');
            }, 3000);
          } else {
            setLoan(loanData);
          }
        } else {
          console.warn('Failed to fetch loan details:', response.message);
          setError(response.message || 'Failed to load loan details');
          toast.error(response.message || 'Failed to load loan details');
          // Redirect back to loans list after a short delay
          setTimeout(() => {
            router.push('/borrower/loans');
          }, 3000);
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
  }, [loanId]);

  const handleRemoveDocument = async (documentId) => {
    if (!documentId || !loanId) return;

    try {
      const confirmed = window.confirm('Are you sure you want to remove this document?');
      if (!confirmed) return;

      const response = await LoanService.removeDocument(loanId, documentId);
      
      if (response.success) {
        toast.success('Document removed successfully');
        // Update loan state to reflect the document removal
        setLoan(prevLoan => ({
          ...prevLoan,
          documents: prevLoan.documents.filter(doc => doc._id !== documentId)
        }));
      } else {
        toast.error(response.message || 'Failed to remove document');
      }
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document. Please try again.');
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <ProtectedRoute roles={['borrower', 'admin']}>
      <MainLayout title={loan ? `Loan ${loan.loanNumber || ''}` : 'Loan Details'} noSidebarMargin={true}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Link href="/borrower/loans" 
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      Loan Application
                      {loan && loan.loanNumber && (
                        <div className="ml-3 px-2.5 py-1 bg-blue-50 rounded-md">
                          <span className="text-sm font-semibold text-blue-800">
                            {loan.loanNumber}
                          </span>
                        </div>
                      )}
                    </h1>
                  </div>
                  <div className="mt-2 flex items-center">
                    {loan && loan.status && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(loan.status)}`}>
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-current"></span>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    )}
                    {loan && loan.applicationDate && (
                      <span className="ml-4 text-sm text-gray-500 flex items-center">
                        <svg className="mr-1 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Submitted {formatDate(loan?.applicationDate || loan?.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                {loan && (
                  <div className="flex space-x-3">
                    <Link href={`/borrower/documents?loanId=${loan._id}`}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Manage Documents
                    </Link>
                    <Link href={`/borrower/apply?draft=${loan.loanNumber}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Application
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-6 rounded-xl shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Error loading loan details</h3>
                    <div className="mt-2 text-md text-red-700">
                      <p>{error}</p>
                      <p className="mt-2">Please try again or contact support if the problem persists.</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => router.reload()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : loan ? (
              <div className="space-y-6">
                {/* Use our new components */}
                <LoanSummaryCard loan={loan} formatCurrency={formatCurrency} />
                <BorrowerInfoCard borrowerDetails={loan.borrowerDetails} />
                <PropertyCard property={loan.property} formatCurrency={formatCurrency} />
                
                {/* Documents Section */}
                {loan.documents && loan.documents.length > 0 && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100 my-6">
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="ml-2 text-lg font-semibold text-gray-900">Documents</h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Documents submitted with your application</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <ul role="list" className="divide-y divide-gray-100">
                        {loan.documents.map((doc) => (
                          <li key={doc._id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex items-center">
                              <div className="p-2 bg-indigo-50 rounded-md mr-4">
                                <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{doc.originalname || doc.name || 'Document'}</p>
                                <p className="text-xs text-gray-500 mt-1">{doc.documentType || 'Uploaded document'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {doc.url && (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </a>
                              )}
                              <button
                                onClick={() => handleRemoveDocument(doc._id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <svg className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
                    href="/borrower/loans"
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

export default LoanDetailsPage;
