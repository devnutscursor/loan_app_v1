import React from 'react';
import CompanyLayout from '../../../../../components/layout/CompanyLayout';
import SkeletonLoader from '../../../../../components/company/borrowerLoans/SkeletonLoader';
import BorrowerHeader from '../../../../../components/company/borrowerLoans/BorrowerHeader';
import SearchAndFilterBar from '../../../../../components/company/borrowerLoans/SearchAndFilterBar';
import LoansTable from '../../../../../components/company/borrowerLoans/LoansTable';
import { useCompanyBorrowerLoans } from '../../../../../hooks/company/useCompanyBorrowerLoans';
import { FileText, Search, X } from 'lucide-react';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const CompanyBorrowerLoans = () => {
  const {
    user,
    borrowerId,
    lenderId,
    loans,
    loading,
    error,
    borrowerInfo,
    searchTerm,
    activeFilter,
    filteredLoans,
    handleBack,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    setSearchTerm,
    setActiveFilter,
    getStatusColor,
    getSortIcon,
  } = useCompanyBorrowerLoans();

  if (!user || user.role !== 'company') return null;

  return (
    <CompanyLayout title="Borrower Loans">
      <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <BorrowerHeader borrowerInfo={borrowerInfo} onBack={handleBack} />

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

            {loans.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No loans yet</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  This borrower doesn't have any loan applications yet.
                </p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  No loans match your search criteria. Try adjusting your search or filters.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveFilter('all');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="h-5 w-5 mr-2" aria-hidden="true" />
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <LoansTable
                loans={filteredLoans}
                borrowerId={borrowerId}
                lenderId={lenderId}
                onSortChange={handleSortChange}
                getSortIcon={getSortIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyBorrowerLoans;

