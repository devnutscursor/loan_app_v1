import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useLenders } from '../../hooks/lender/useLenders';
import NewLenderModal from '../../components/company/NewLenderModal';
import LendersTable from '../../components/company/LendersTable';
import SearchAndFilters from '../../components/company/SearchAndFilters';
import Pagination from '../../components/company/Pagination';

const CompanyLenders = () => {
  const { user } = useAuth();
  const [showNewLenderModal, setShowNewLenderModal] = useState(false);

  const {
    loading,
    lenders,
    searchTerm,
    setSearchTerm,
    totalLenders,
    currentPage,
    totalPages,
    handleNewLenderSuccess,
    filteredLenders,
    sortBy,
    sortOrder,
    setFilteredLenders,
    handleViewStats,
    handleViewBorrowers,
    handleSortClick,
    handleSortByChange,
    handleSortOrderChange,
    handleSearchChange,   
    handlePageChangeClick
  } = useLenders(user);


  if (loading && lenders.length === 0) {
    return (
      <CompanyLayout title="Company Loan Officers">
        <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-12">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Skeleton */}
              <div className="flex-1">
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              {/* Sort Options Skeleton */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Desktop Lenders Table Skeleton */}
          <div className="hidden lg:block bg-white shadow overflow-x-auto rounded-lg border border-gray-100">
            {/* Table Header Skeleton */}
            <div className="bg-gray-50 border-b border-gray-100 min-w-[940px]">
              <div className="grid grid-cols-12 px-6 py-3">
                <div className="col-span-3 h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="col-span-3 h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="col-span-2 h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="col-span-2 h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="col-span-2 h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="divide-y divide-gray-200 min-w-[940px]">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="grid grid-cols-12 px-6 py-4">
                  {/* Avatar and Name */}
                  <div className="col-span-3 flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="ml-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="col-span-3">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Borrowers */}
                  <div className="col-span-2">
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Loan Volume */}
                  <div className="col-span-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-2 flex justify-end items-center space-x-3">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile/Tablet Card Skeleton */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
                  <div className="p-4">
                    {/* Card Header - Lender Info Skeleton */}
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="ml-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>

                    {/* Card Content - Lender Details Skeleton */}
                    <div className="space-y-2">
                      {/* Phone Number Skeleton */}
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>

                      {/* Borrowers Count Skeleton */}
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>

                      {/* Loan Volume Skeleton */}
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>

                    {/* Card Footer - Action Buttons Skeleton */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center space-x-2">
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex space-x-1">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Loan Officers">
      <div className="space-y-6 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Loan Officers</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all loan officers in your company ({totalLenders} total)
            </p>
          </div>
          <div className="flex items-center space-x-4 ">
            <button
              onClick={() => setShowNewLenderModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Loan Officer
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={handleSortByChange}
          onSortOrderChange={handleSortOrderChange}
        />

        {/* Lenders Table */}
        {filteredLenders.length > 0 ? (
          <LendersTable
            lenders={filteredLenders}
            onViewStats={handleViewStats}
            onViewBorrowers={handleViewBorrowers}
            onSort={handleSortClick}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lenders found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No lenders match your search criteria.' : 'No lenders have been added to your company yet.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilteredLenders(lenders);
                }}
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