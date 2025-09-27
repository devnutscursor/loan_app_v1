import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import SkeletonLoader from '../../components/admin/users/SkeletonLoader';
import PageHeader from '../../components/admin/users/PageHeader';
import SearchAndFilters from '../../components/admin/users/SearchAndFilters';
import UsersTable from '../../components/admin/users/UsersTable';
import { NoUsers, NoResults } from '../../components/admin/users/EmptyStates';
import ErrorState from '../../components/admin/users/ErrorState';

const AdminUsersPage = () => {
  const {
    users,
    loading,
    error,
    searchTerm,
    filters,
    sortBy,
    sortDirection,
    filteredUsers,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    handleUserStatusChange,
    clearFilters
  } = useAdminUsers();

  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout>
        <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <PageHeader />

          {loading ? (
            <SkeletonLoader />
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            <div className="space-y-6">
              <SearchAndFilters
                searchTerm={searchTerm}
                filters={filters}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
              />

              {users.length === 0 ? (
                <NoUsers />
              ) : filteredUsers.length === 0 ? (
                <NoResults onClearFilters={clearFilters} />
              ) : (
                <UsersTable
                  users={filteredUsers}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  onUserStatusChange={handleUserStatusChange}
                />
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;