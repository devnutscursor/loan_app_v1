import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoanMilestones from '../../components/borrower/loan/LoanMilestones';
import { LoanService } from '../../services';

/**
 * Milestones Page for Borrowers
 * 
 * Provides a dedicated interface for borrowers to track their loan application
 * progress through a visual milestone timeline and detailed milestone information.
 */
const Milestones = () => {
  // State for loans
  const [loans, setLoans] = useState([]);
  
  // State for selected loan
  const [selectedLoanId, setSelectedLoanId] = useState('');
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);

  // Load borrower's loans when component mounts
  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching loans...');
        const response = await LoanService.getLoans();
        console.log('Loans response:', response);
        
        if (response.success) {
          // Extract loans from the nested structure in the API response
          const userLoans = response.data?.data?.loans || [];
          console.log(`Retrieved ${userLoans.length} loans`);
          
          setLoans(userLoans);
          
          // Select the first loan by default
          if (userLoans.length > 0) {
            setSelectedLoanId(userLoans[0]._id);
          }
        } else {
          console.error('Failed to fetch loans:', response?.message || 'Unknown error');
          toast.error(response?.message || 'Failed to load your loans');
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error('Failed to load your loans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // Handle loan selection change
  const handleLoanChange = (e) => {
    setSelectedLoanId(e.target.value);
  };

  // Find the selected loan object
  const selectedLoan = loans.find(loan => loan._id === selectedLoanId);

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Loan Progress Tracker</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track the progress of your loan application through each milestone
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {isLoading ? (
              <div className="w-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loans.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loans found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any active loan applications yet.
                </p>
                <div className="mt-6">
                  <a
                    href="/borrower/apply"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Start New Application
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Loan Selection */}
                {loans.length > 1 && (
                  <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                    <div className="sm:flex sm:items-center">
                      <div className="sm:flex-auto">
                        <h3 className="text-base font-medium text-gray-900">Select Loan</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Choose a loan to view its progress
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none w-full sm:w-1/3">
                        <select
                          id="loanId"
                          name="loanId"
                          value={selectedLoanId}
                          onChange={handleLoanChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                          {loans.map(loan => (
                            <option key={loan._id} value={loan._id}>
                              {loan.loanDetails?.loanType} - {loan.loanNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                
                
                {/* Loan Milestones Component */}
                <LoanMilestones 
                  loanId={selectedLoanId} 
                />
                
                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="/borrower/documents" 
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Manage Documents
                  </a>
                  <a 
                    href="/borrower/messages" 
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    Contact Loan Officer
                  </a>
                  <a 
                    href="/borrower/application-details" 
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    View Application Details
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Milestones;
