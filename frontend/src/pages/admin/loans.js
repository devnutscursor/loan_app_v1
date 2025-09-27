import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAdminLoans } from '../../hooks/admin/useAdminLoans';
import SkeletonLoader from '../../components/admin/loans/SkeletonLoader';
import PageHeader from '../../components/admin/loans/PageHeader';
import SearchAndFilters from '../../components/admin/loans/SearchAndFilters';
import LoansTable from '../../components/admin/loans/LoansTable';
import { NoLoans, NoResults } from '../../components/admin/loans/EmptyStates';
import ErrorState from '../../components/admin/loans/ErrorState';

const AdminLoansPage = () => {
  const {
    loans,
    borrowers,
    loading,
    error,
    searchTerm,
    activeFilter,
    selectedBorrower,
    sortBy,
    sortDirection,
    filteredLoans,
    filterLoading,
    handleSearchChange,
    handleFilterChange,
    handleBorrowerChange,
    handleSortChange,
    clearFilters
  } = useAdminLoans();

  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout>
        <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <PageHeader />

          {loading || filterLoading ? (
            <SkeletonLoader />
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            <div className="space-y-6">
              <SearchAndFilters
                searchTerm={searchTerm}
                activeFilter={activeFilter}
                selectedBorrower={selectedBorrower}
                borrowers={borrowers}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                onBorrowerChange={handleBorrowerChange}
              />

              {loans.length === 0 ? (
                <NoLoans />
              ) : filteredLoans.length === 0 ? (
                <NoResults onClearFilters={clearFilters} />
              ) : (
                <LoansTable
                  loans={filteredLoans}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                />
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminLoansPage;