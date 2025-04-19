import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DocumentManager from '../../components/borrower/documents/DocumentManager';
import { borrowerService } from '../../services/api';

/**
 * Documents Page
 * 
 * Enhanced document management page for borrowers to upload, view, and manage
 * loan-related documents with advanced filtering, preview, and status tracking.
 */
const Documents = () => {
  // State for selected loan to associate documents with
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);

  // Fetch user's loans on component mount
  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoadingLoans(true);
      try {
        // In a real app, this would be an API call
        const loansData = await borrowerService.getLoans();
        setLoans(loansData || []);
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error('Failed to load loans. Please try again later.');
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  // Handle loan selection change
  const handleLoanChange = (e) => {
    setSelectedLoanId(e.target.value);
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
            {/* Loan selection dropdown */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h3 className="text-base font-medium text-gray-900">Associated Loan</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a loan to associate uploaded documents with
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none w-full sm:w-1/3">
                  {isLoadingLoans ? (
                    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                  ) : (
                    <select
                      id="loanId"
                      name="loanId"
                      value={selectedLoanId}
                      onChange={handleLoanChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="">All Documents</option>
                      {loans.map(loan => (
                        <option key={loan._id} value={loan._id}>
                          {loan.purpose || 'Loan'} - {loan.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            
            {/* Document Manager Component */}
            <DocumentManager loanId={selectedLoanId} userRole="borrower" />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Documents;
