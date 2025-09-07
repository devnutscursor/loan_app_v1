import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Building2, Plus, Users } from 'lucide-react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useLenders } from '../../hooks/useLenders';
import { getSortIcon, handleSort, handleSearch, handlePageChange } from '../../utils/lendersUtils';
import NewLenderModal from '../../components/company/NewLenderModal';
import LendersTable from '../../components/company/LendersTable';
import SearchAndFilters from '../../components/company/SearchAndFilters';
import Pagination from '../../components/company/Pagination';

const CompanyLenders = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [showNewLenderModal, setShowNewLenderModal] = useState(false);

  const {
    loading,
    lenders,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    totalPages,
    totalLenders,
    handleNewLenderSuccess
  } = useLenders(user);

  const handleViewStats = (lenderId) => {
    router.push(`/company/lender-stats?lenderId=${lenderId}`);
  };

  const handleViewBorrowers = (lenderId) => {
    router.push(`/company/lender-borrowers?lenderId=${lenderId}`);
  };

  const handleSortClick = (field) => {
    handleSort(field, sortBy, sortOrder, setSortBy, setSortOrder, setCurrentPage);
  };

  const handleSearchChange = (e) => {
    handleSearch(e, setSearchTerm, setCurrentPage);
  };

  const handlePageChangeClick = (page) => {
    handlePageChange(page, setCurrentPage);
  };

  const getSortIconForField = (field) => {
    return getSortIcon(field, sortBy, sortOrder);
  };

  if (loading && lenders.length === 0) {
    return (
      <CompanyLayout title="Company Lenders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Lenders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Lenders</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all lenders in your company ({totalLenders} total)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{user?.company?.name || 'Company'}</span>
            </div>
            <button
              onClick={() => setShowNewLenderModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lender
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSort={handleSortClick}
          getSortIcon={getSortIconForField}
        />

        {/* Lenders Table */}
        {lenders.length > 0 ? (
          <LendersTable
            lenders={lenders}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSortClick}
            onViewStats={handleViewStats}
            onViewBorrowers={handleViewBorrowers}
            getSortIcon={getSortIconForField}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lenders found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No lenders match your search criteria.' : 'No lenders have been added to your company yet.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={() => setShowNewLenderModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lender
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChangeClick}
        />
      </div>

      {/* New Lender Modal */}
      <NewLenderModal
        isOpen={showNewLenderModal}
        onClose={() => setShowNewLenderModal(false)}
        onSuccess={handleNewLenderSuccess}
        user={user}
      />
    </CompanyLayout>
  );
};

export default CompanyLenders;