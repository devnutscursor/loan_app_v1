import React from 'react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useCompanyLenderBorrowers } from '../../hooks/company/useCompanyLenderBorrowers';
import SkeletonLoader from '../../components/company/lenderBorrowers/SkeletonLoader';
import LenderInfoHeader from '../../components/company/lenderBorrowers/LenderInfoHeader';
import SearchAndFilterBar from '../../components/company/lenderBorrowers/SearchAndFilterBar';
import BorrowersTable from '../../components/company/lenderBorrowers/BorrowersTable';
import { NoBorrowers, NoResults } from '../../components/company/lenderBorrowers/EmptyStates';

const LenderBorrowers = () => {
  const {
    user,
    loading,
    error,
    lenderData,
    borrowers,
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    filteredBorrowers,
    handleBack,
    handleViewLoans,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    setSearchTerm,
    setActiveFilter,
    formatDate,
    getSortIcon,
  } = useCompanyLenderBorrowers();

  if (!user || user.role !== 'company') {
    return null;
  }

  return (
    <CompanyLayout title="Lender Borrowers">
      <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <LenderInfoHeader lenderData={lenderData} onBack={handleBack} />

        {loading ? (
          <SkeletonLoader />
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
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />

            {borrowers.length === 0 ? (
              <NoBorrowers />
            ) : filteredBorrowers.length === 0 ? (
              <NoResults onClear={() => { setSearchTerm(''); setActiveFilter('all'); }} />
            ) : (
              <BorrowersTable
                borrowers={filteredBorrowers}
                sortBy={sortBy}
                getSortIcon={getSortIcon}
                onSortChange={handleSortChange}
                onViewLoans={handleViewLoans}
                formatDate={formatDate}
              />
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default LenderBorrowers;