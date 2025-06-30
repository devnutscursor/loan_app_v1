import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { AuditLogService } from '../../services';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

// Event type options for filtering
const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'auth', label: 'Authentication' },
  { value: 'user', label: 'User Actions' },
  { value: 'loan', label: 'Loan Actions' },
  { value: 'message', label: 'Messaging' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'document', label: 'Documents' },
  { value: 'system', label: 'System Events' }
];

/**
 * AuditLogs Component
 * 
 * Admin interface for viewing and filtering audit logs across the system.
 * Provides security and compliance monitoring capabilities.
 */
const AuditLogs = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filters, setFilters] = useState({
    eventType: 'all',
    startDate: '',
    endDate: '',
    userId: '',
    search: ''
  });

  // Fetch audit logs based on current filters and pagination
  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!isAuthenticated || !hasRole('admin')) return;
      
      setLoading(true);
      try {
        // Build query parameters
        const queryParams = {
          page,
          limit,
          ...(filters.eventType !== 'all' && { eventType: filters.eventType }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.search && { search: filters.search })
        };
        
        const response = await AuditLogService.getAuditLogs(queryParams);
        
        if (response.success) {
          setLogs(response.data.logs);
          setTotalLogs(response.data.total);
        } else {
          toast.error('Failed to load audit logs');
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [isAuthenticated, hasRole, page, limit, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
    setPage(1); // Reset to first page when filters change
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // The search will happen automatically via the useEffect hook
  };

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get severity class for badge styling
  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'info':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <AdminLayout>
      <Head>
        <title>Audit Logs | Loan Management System</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          
          {/* Filters */}
          <div className="mt-4 bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Event Type Filter */}
                <div>
                  <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <select
                    id="eventType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  >
                    {EVENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Start Date Filter */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                
                {/* End Date Filter */}
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                
                {/* User ID Filter */}
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <input
                    type="text"
                    id="userId"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter user ID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                  />
                </div>
                
                {/* Search filter */}
                <div className="sm:col-span-2">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="search"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-gray-300 focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Search in description or details..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Audit Logs Table */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            No audit logs found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : 'System'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {log.user ? log.user.email : ''}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {log.eventType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(log.severity)}`}>
                                {log.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                              {log.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                className="text-primary hover:text-primary-dark"
                                onClick={() => {
                                  // Show log details in a modal or panel
                                  console.log("View details for:", log._id);
                                  // In a real implementation, you would show a modal with the detailed log info
                                  // including the metadata JSON
                                  alert(JSON.stringify(log.metadata, null, 2));
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalLogs)}</span> of{' '}
                          <span className="font-medium">{totalLogs}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            &larr; Previous
                          </button>
                          
                          {/* Page numbers - show a limited window around the current page */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Calculate which pages to show
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? 'z-10 bg-primary border-primary text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            Next &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* System Information Panel */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Audit System Information</h2>
            <div className="prose max-w-none">
              <p>
                The audit log system captures user and system actions across the platform to ensure 
                security, compliance, and traceability. Each log entry includes:
              </p>
              <ul>
                <li><strong>Timestamp:</strong> When the action occurred</li>
                <li><strong>User:</strong> Who performed the action (or System for automated processes)</li>
                <li><strong>Event Type:</strong> Category of action taken</li>
                <li><strong>Severity:</strong> Importance level (Critical, High, Medium, Low, Info)</li>
                <li><strong>Description:</strong> Brief explanation of the action</li>
                <li><strong>Metadata:</strong> Detailed contextual information about the action</li>
              </ul>
              <p>
                Audit logs are retained for compliance and security purposes according to the 
                system data retention policy. For more information on audit log practices, 
                please refer to the administrator documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
