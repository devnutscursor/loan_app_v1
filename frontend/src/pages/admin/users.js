import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { adminService } from '../../services/api';
import {
  User,
  Calendar,
  Search,
  ChevronDown,
  X,
  Users,
  ExternalLink
} from 'lucide-react';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-6">
    <div className="flex justify-between animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-1/6"></div>
    </div>

    <div className="flex justify-between space-x-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
    </div>

    <div className="border rounded-lg overflow-hidden">
      <div className="h-12 bg-gray-100 animate-pulse"></div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="border-t border-gray-200 h-16 animate-pulse flex">
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 p-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers({ limit: 1000 }); // Get all users
        console.log('Admin users response:', response.data);
        const data = response.data.data || [];
        
        // Debug: Check if Asad Ali is in the users list
        const asadAli = data.find(user => 
          user.firstName?.toLowerCase() === 'asad' && 
          user.lastName?.toLowerCase() === 'ali'
        );
        console.log('Asad Ali found in users:', asadAli);
        console.log('All user IDs:', data.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}` })));
        
        setUsers(data);
      } catch (e) {
        console.error('Error fetching admin users:', e);
        toast.error('Failed to load users');
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
    );
  };

  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    let results = [...users];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(user =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        (user.role || '').toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (filters.role !== 'all') {
      results = results.filter(user => user.role === filters.role);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      results = results.filter(user => user.isActive === isActive);
    }
    
    // Create local variables for sorting
    let localSortBy = sortBy;
    let localSortDirection = sortDirection;

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (localSortBy) {
        case 'name':
          compareA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          compareB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          break;
        case 'role':
          compareA = a.role || '';
          compareB = b.role || '';
          break;
        case 'status':
          compareA = a.isActive ? 1 : 0;
          compareB = b.isActive ? 1 : 0;
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return localSortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [users, searchTerm, filters, sortBy, sortDirection]);

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'bg-purple-100 text-purple-800',
      lender: 'bg-blue-100 text-blue-800',
      borrower: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isActive ? 'active' : 'inactive'}
      </span>
    );
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, { isActive: newStatus });
      toast.success('User status updated successfully');
      
      // Update user in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout>
        <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">
                Manage all users in the system including borrowers, lenders, and admins
              </p>
            </div>
          </div>

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
              <div className="flex flex-col sm:flex-row justify-center sm:justify-between gap-4 items-center sm:items-end">
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md w-full">
                  <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by name or email..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>

                {/* Filter Dropdowns */}
                <div className="flex gap-4">
                  <div>
                    <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role-filter"
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">All Roles</option>
                      <option value="lender">Lender</option>
                      <option value="borrower">Borrower</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status-filter"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    There are no users in the system yet.
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    No users match your search criteria. Try adjusting your search or filters.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({ role: 'all', status: 'all' });
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <X className="h-5 w-5 mr-2" aria-hidden="true" />
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200 ">
                  {/* Table Header */}
                  <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
                    <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('name')}>
                        <div className="flex items-center">
                          <span>User</span>
                          {getSortIcon('name')}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('role')}>
                        <div className="flex items-center">
                          <span>Role</span>
                          {getSortIcon('role')}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('status')}>
                        <div className="flex items-center">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSortChange('date')}>
                        <div className="flex items-center">
                          <span>Created</span>
                          {getSortIcon('date')}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="divide-y divide-gray-200 min-w-[940px]">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 items-center"
                      >
                        <div className="col-span-3 flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <span className="text-lg font-medium">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 max-w-[160px] truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center">
                            {getRoleBadge(user.role)}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center">
                            {getStatusBadge(user.isActive)}
                          </div>
                        </div>

                        <div className="col-span-3 flex items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end items-center space-x-3">
                          <button
                            onClick={() => handleUserStatusChange(user._id, !user.isActive)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                              user.isActive
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;