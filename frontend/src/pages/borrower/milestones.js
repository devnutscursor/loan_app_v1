import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoanMilestones from '../../components/borrower/loan/LoanMilestones';
import MilestonesLoadingSkeleton from '../../components/borrower/milestones/MilestonesLoadingSkeleton';
import NoLoansState from '../../components/borrower/milestones/NoLoansState';
import LoanSelector from '../../components/borrower/milestones/LoanSelector';
import QuickActions from '../../components/borrower/milestones/QuickActions';
import { useMilestones } from '../../hooks/useMilestones';

/**
 * Milestones Page for Borrowers
 * 
 * Provides a dedicated interface for borrowers to track their loan application
 * progress through a visual milestone timeline and detailed milestone information.
 */
const Milestones = () => {
  const {
    loans,
    selectedLoanId,
    selectedLoan,
    isLoading,
    handleLoanChange,
    hasLoans
  } = useMilestones();

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
          
          <div className="max-w-7xl mx-0 md:mx-auto px-0 sm:px-6 md:px-8 mt-6">
            {isLoading ? (
              <MilestonesLoadingSkeleton />
            ) : !hasLoans ? (
              <NoLoansState />
            ) : (
              <>
                {/* Loan Selection */}
                <LoanSelector 
                  loans={loans}
                  selectedLoanId={selectedLoanId}
                  onLoanChange={handleLoanChange}
                />
                
                {/* Loan Milestones Component */}
                <LoanMilestones 
                  loanId={selectedLoanId} 
                />
                
                {/* Quick Actions */}
                <QuickActions selectedLoanId={selectedLoanId} />
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Milestones;