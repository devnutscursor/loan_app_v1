import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MainLayout from '../../../components/layout/MainLayout';
import LoanCard from '../../../components/common/LoanCard';
import { LoanService } from '../../../services';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        // console.log('Fetching loans with filter:', filter);
        const response = await LoanService.getLoans({ status: filter !== 'all' ? filter : undefined });
        // console.log('Loan response:', response);
        
        if (response.success) {
          // Carefully extract loans array from the response with proper validation
          let loansArray = [];
          
          // Check all possible response formats based on the logs
          if (Array.isArray(response.data.data)) {
            loansArray = response.data.data;
          } else if (response.data && Array.isArray(response.data.data.loans)) {
            loansArray = response.data.data.loans;
          } else if (response.data && response.data.data && Array.isArray(response.data.data.loans)) {
            loansArray = response.data.data.loans;
          } else {
            console.warn('Unexpected response structure:', response);
            // Still use an empty array as fallback
          }
          
          // console.log('Extracted loans array:', loansArray);
          setLoans(loansArray);
        } else {
          console.warn('Unsuccessful loan fetch:', response.message);
          toast.error(response.message || 'Failed to load your loans');
          setLoans([]);
          setError('Failed to load loans');
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error('Failed to load your loans. Please try again later.');
        setLoans([]);
        setError('Error loading loans');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoans();
  }, [filter]);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  // Ensure loans is always an array before filtering
  const loansList = Array.isArray(loans) ? loans : [];
  // console.log('Loans for filtering:', loansList);
  
  // Log each loan's status to debug
  loansList.forEach((loan, index) => {
    // console.log(`Loan ${index + 1} status:`, loan.status, loan);
  });
  
  // Group loans by status for better organization - use lowercase comparison for safety
  const statusGroups = {
    pending: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return status === 'pending' || status === 'application submitted' || status === 'application started';
    }),
    approved: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return status === 'approved' || status === 'conditional approval' || status === 'clear to close';
    }),
    processing: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return status === 'processing' || status === 'underwriting';
    }),
    rejected: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return status === 'rejected' || status === 'declined' || status === 'withdrawn';
    }),
    closed: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return status === 'closed' || status === 'funded';
    }),
    // Other status
    other: loansList.filter(loan => {
      const status = (loan.status || '').toLowerCase();
      return !['pending', 'application submitted', 'application started', 
               'approved', 'conditional approval', 'clear to close',
               'processing', 'underwriting',
               'rejected', 'declined', 'withdrawn',
               'closed', 'funded'].includes(status);
    })
  };
  
  // Log the grouped loans
  // console.log('Loans grouped by status:', {
  //   pending: statusGroups.pending.length,
  //   approved: statusGroups.approved.length,
  //   processing: statusGroups.processing.length,
  //   rejected: statusGroups.rejected.length,
  //   closed: statusGroups.closed.length,
  //   other: statusGroups.other.length
  // });
  
  return (
    <ProtectedRoute roles={['borrower', 'admin']}>
      <MainLayout title="My Loans">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Loans</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage all your loan applications
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center">
                <select
                  id="filter"
                  name="filter"
                  value={filter}
                  onChange={handleFilterChange}
                  className="mr-4 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Loans</option>
                  <option value="application submitted">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
                
                <Link
                  href="/borrower/apply"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Apply for Loan
                </Link>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : loansList.length > 0 ? (
              <div className="space-y-8">
                {filter === 'all' ? (
                  <>
                    {/* Debug info */}
                    <div className="bg-blue-50 p-4 mb-6 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Loan Status Summary</h3>
                      <p className="text-xs text-blue-600">
                        Total: {loansList.length} | 
                        Pending: {statusGroups.pending.length} | 
                        Processing: {statusGroups.processing.length} |
                        Approved: {statusGroups.approved.length} | 
                        Rejected: {statusGroups.rejected.length} | 
                        Closed: {statusGroups.closed.length} | 
                        Other: {statusGroups.other.length}
                      </p>
                    </div>
                    
                    {/* Pending Applications */}
                    {statusGroups.pending.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Applications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.pending.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Processing Applications */}
                    {statusGroups.processing.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Processing Applications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.processing.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Approved Loans */}
                    {statusGroups.approved.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Approved Loans</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.approved.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Rejected Applications */}
                    {statusGroups.rejected.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Rejected Applications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.rejected.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Closed Loans */}
                    {statusGroups.closed.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Closed Loans</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.closed.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Other/Unknown Status */}
                    {statusGroups.other.length > 0 && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Other Applications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {statusGroups.other.map(loan => (
                            <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loans.map(loan => (
                      <LoanCard key={loan._id} loan={loan} userRole="borrower" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loans found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by applying for a loan.</p>
                <div className="mt-6">
                  <Link
                    href="/borrower/apply"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Apply for Loan
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

export default Loans;
