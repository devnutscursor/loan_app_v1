import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import lenderService from '../../services/api/lender.service';

/**
 * Conditions Dashboard Page
 * Centralized page for viewing and managing all conditions across loans
 */
const ConditionsDashboardPage = () => {
  const router = useRouter();
  const { status: initialStatus } = router.query;
  
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: initialStatus || '',
    priority: '',
    category: '',
    search: '',
    tag: '',
    dueDate: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });
  
  const [allTags, setAllTags] = useState([]);
  
  useEffect(() => {
    // When the URL query param changes, update the filter
    if (initialStatus) {
      setFilters(prev => ({ ...prev, status: initialStatus }));
    }
  }, [initialStatus]);
  
  useEffect(() => {
    fetchConditions();
    fetchTags();
  }, [page, perPage, filters.sortBy, filters.sortOrder]);
  
  const fetchConditions = async () => {
    try {
      setLoading(true);
      
      // Prepare filter params
      const params = {
        page,
        limit: perPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      
      // Add optional filters if they have values
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.tag) params.tag = filters.tag;
      if (filters.dueDate) params.dueDate = filters.dueDate;
      
      const response = await lenderService.getAllConditions(params);
      
      setConditions(response.data.data);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast.error('Failed to load conditions');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTags = async () => {
    try {
      const response = await lenderService.getConditionTags();
      setAllTags(response.data.data || []);
    } catch (error) {
      console.error('Error fetching condition tags:', error);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchConditions();
  };
  
  const handleResetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
      tag: '',
      dueDate: '',
      sortBy: 'dueDate',
      sortOrder: 'asc'
    });
    
    // Reset the URL query params
    router.push('/lender/conditions', undefined, { shallow: true });
    
    // Fetch with reset filters
    fetchConditions();
  };
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset to first page when filters change
    if (page !== 1) {
      setPage(1);
    }
  };
  
  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleStatusChange = async (conditionId, newStatus) => {
    try {
      await lenderService.updateConditionStatus(conditionId, { status: newStatus });
      
      // Update condition in local state
      setConditions(prevConditions => 
        prevConditions.map(condition => 
          condition._id === conditionId 
            ? { ...condition, status: newStatus } 
            : condition
        )
      );
      
      toast.success(`Condition status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating condition status:', error);
      toast.error('Failed to update condition status');
    }
  };
  
  const handleDeleteCondition = async (conditionId) => {
    if (!confirm('Are you sure you want to delete this condition? This action cannot be undone.')) {
      return;
    }
    
    try {
      await lenderService.deleteCondition(conditionId);
      
      // Remove condition from local state
      setConditions(prevConditions => 
        prevConditions.filter(condition => condition._id !== conditionId)
      );
      
      toast.success('Condition deleted successfully');
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };
  
  const navigateToLoanDetails = (loanId, conditionId) => {
    router.push({
      pathname: `/lender/application-details`,
      query: { id: loanId, tab: 'conditions', highlight: conditionId }
    });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get status badge with color
  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-indigo-100 text-indigo-800',
      'cleared': 'bg-green-100 text-green-800',
      'waived': 'bg-purple-100 text-purple-800',
      'expired': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs leading-5 font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </span>
    );
  };
  
  // Get priority badge with color
  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-yellow-100 text-yellow-800',
      'critical': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs leading-5 font-medium rounded-full ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };
  
  // Calculate pagination information
  const totalPages = Math.ceil(totalCount / perPage);
  const showingFrom = (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, totalCount);
  
  return (
    <ProtectedRoute roles={['lender', 'admin']}>
      <MainLayout title="Conditions Dashboard">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Conditions Dashboard
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage all conditions across your loan portfolio
                </p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md p-4">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="search"
                        id="search"
                        className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search conditions..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="cleared">Cleared</option>
                      <option value="waived">Waived</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="income">Income</option>
                      <option value="assets">Assets</option>
                      <option value="credit">Credit</option>
                      <option value="property">Property</option>
                      <option value="legal">Legal</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {allTags.length > 0 && (
                    <div>
                      <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
                        Tag
                      </label>
                      <select
                        id="tag"
                        name="tag"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={filters.tag}
                        onChange={(e) => handleFilterChange('tag', e.target.value)}
                      >
                        <option value="">All Tags</option>
                        {allTags.map((tag, index) => (
                          <option key={index} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <select
                      id="dueDate"
                      name="dueDate"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.dueDate}
                      onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                    >
                      <option value="">All Due Dates</option>
                      <option value="overdue">Overdue</option>
                      <option value="today">Due Today</option>
                      <option value="this_week">Due This Week</option>
                      <option value="next_week">Due Next Week</option>
                      <option value="this_month">Due This Month</option>
                      <option value="future">Future</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                      Sort By
                    </label>
                    <select
                      id="sortBy"
                      name="sortBy"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="createdAt">Created Date</option>
                      <option value="updatedAt">Last Updated</option>
                      <option value="priority">Priority</option>
                      <option value="status">Status</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
                      Sort Order
                    </label>
                    <select
                      id="sortOrder"
                      name="sortOrder"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                  
                  <div className="sm:flex sm:items-end">
                    <div className="mt-1 sm:mt-0 sm:flex-1 flex space-x-2">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-full justify-center"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        Apply Filters
                      </button>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-full justify-center"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Conditions list */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
              {loading ? (
                <div className="px-4 py-5 sm:p-6 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : conditions.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conditions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or create new conditions for your loans.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center">
                            <span>Title</span>
                            {filters.sortBy === 'title' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('loanNumber')}
                        >
                          <div className="flex items-center">
                            <span>Loan</span>
                            {filters.sortBy === 'loanNumber' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            <span>Status</span>
                            {filters.sortBy === 'status' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('priority')}
                        >
                          <div className="flex items-center">
                            <span>Priority</span>
                            {filters.sortBy === 'priority' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('category')}
                        >
                          <div className="flex items-center">
                            <span>Category</span>
                            {filters.sortBy === 'category' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('dueDate')}
                        >
                          <div className="flex items-center">
                            <span>Due Date</span>
                            {filters.sortBy === 'dueDate' && (
                              <span className="ml-1">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {conditions.map((condition) => (
                        <tr 
                          key={condition._id} 
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-primary cursor-pointer hover:text-primary-dark"
                                 onClick={() => navigateToLoanDetails(condition.loanId, condition._id)}>
                              {condition.title}
                            </div>
                            {condition.description && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {condition.description}
                              </div>
                            )}
                            {condition.tags && condition.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {condition.tags.map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Loan #{condition.loanNumber || condition.loanId.substring(0, 8)}
                            </div>
                            {condition.borrowerName && (
                              <div className="text-xs text-gray-500">
                                {condition.borrowerName}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusBadge(condition.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPriorityBadge(condition.priority)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                              {condition.category.charAt(0).toUpperCase() + condition.category.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${new Date(condition.dueDate) < new Date() && condition.status !== 'cleared' && condition.status !== 'waived' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {formatDate(condition.dueDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <div className="relative inline-block text-left">
                                <select
                                  className="block pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                                  value={condition.status}
                                  onChange={(e) => handleStatusChange(condition._id, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="submitted">Submitted</option>
                                  <option value="cleared">Cleared</option>
                                  <option value="waived">Waived</option>
                                  <option value="expired">Expired</option>
                                </select>
                              </div>
                              <button
                                onClick={() => navigateToLoanDetails(condition.loanId, condition._id)}
                                className="text-primary hover:text-primary-dark"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteCondition(condition._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {!loading && conditions.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === totalPages ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of{' '}
                        <span className="font-medium">{totalCount}</span> conditions
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">First</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Page Numbers */}
                        {[...Array(totalPages).keys()].map(number => {
                          const pageNumber = number + 1;
                          // Show pages: current, current±1, first and last
                          const showPageNumber = pageNumber === 1 || pageNumber === totalPages || 
                            Math.abs(pageNumber - page) <= 1;
                          
                          // Dots for skipped pages
                          if (!showPageNumber) {
                            // Only show dots after first page and before last page when there's a gap
                            if ((pageNumber === 2 && page > 3) || (pageNumber === totalPages - 1 && page < totalPages - 2)) {
                              return (
                                <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNumber === page ? 'z-10 bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Last</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Per page controls */}
            {!loading && conditions.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-2">Show</span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">per page</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ConditionsDashboardPage;
