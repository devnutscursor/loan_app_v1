import React from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import XMLLoanUpload from '../../../components/lender/loans/XMLLoanUpload_new';
import NewLoanModal from '../../../components/lender/loans/NewLoanModal';
import LoansSkeletonLoader from '../../../components/lender/loans/LoansSkeletonLoader';
import SearchAndFilters from '../../../components/lender/loans/SearchAndFilters';
import LoansTable from '../../../components/lender/loans/LoansTable';
import LoansEmptyState from '../../../components/lender/loans/LoansEmptyState';
import LoansPageHeader from '../../../components/lender/loans/LoansPageHeader';
import useLenderLoans from '../../../hooks/lender/useLenderLoans';

const LenderLoans = () => {
  const {
    // Data
    loans,
    filteredLoans,
    loading,
    error,
    borrowerId,
    user,
    
    // Search and filter state
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    
    // Modal state
    isXMLUploadOpen,
    isNewLoanModalOpen,
    
    // Event handlers
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    getSortIcon,
    handleXMLUploadSuccess,
    handleXMLUploadOption,
    handleManualCreateOption,
    handleClearFilters,
    
    // Modal controls
    setIsXMLUploadOpen,
    setIsNewLoanModalOpen
  } = useLenderLoans();

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <LoansPageHeader
            borrowerId={borrowerId}
            user={user}
            onNewLoan={() => setIsNewLoanModalOpen(true)}
          />

          {loading ? (
            <LoansSkeletonLoader />
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />

              {loans.length === 0 ? (
                <LoansEmptyState
                  type="no-loans"
                  borrowerId={borrowerId}
                  onNewLoan={() => setIsNewLoanModalOpen(true)}
                />
              ) : filteredLoans.length === 0 ? (
                <LoansEmptyState
                  type="no-results"
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <LoansTable
                  loans={filteredLoans}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  getSortIcon={getSortIcon}
                />
              )}
            </div>
          )}
        </div>

        {/* New Loan Modal */}
        <NewLoanModal
          isOpen={isNewLoanModalOpen}
          onClose={() => setIsNewLoanModalOpen(false)}
          onXMLUpload={handleXMLUploadOption}
          onManualCreate={handleManualCreateOption}
        />

        {/* XML Upload Modal */}
        <XMLLoanUpload
          isOpen={isXMLUploadOpen}
          onClose={() => setIsXMLUploadOpen(false)}
          onSuccess={handleXMLUploadSuccess}
        />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderLoans;