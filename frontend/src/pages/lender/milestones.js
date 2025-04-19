import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import MilestoneManager from '../../components/common/milestones/MilestoneManager';
import { lenderService } from '../../services/api';

/**
 * Lender Milestones Page
 * 
 * Comprehensive milestone management interface for lenders to:
 * - Monitor loan progress across all applications
 * - Update milestone statuses and requirements
 * - Manage the loan process workflow
 */
const LenderMilestones = () => {
  // State for applications
  const [applications, setApplications] = useState([]);
  
  // State for selected application
  const [selectedLoanId, setSelectedLoanId] = useState('');
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  
  // State for filters
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'dateDesc'
  });

  // Load lender's loan applications when component mounts
  useEffect(() => {
    fetchApplications();
  }, [filters]);

  // Fetch loan applications from API with filters
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call with filter parameters
      // const response = await lenderService.getApplications(filters);
      
      // For demonstration, use mock data
      const mockApplications = [
        {
          _id: '1',
          borrower: {
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567'
          },
          purpose: 'Home Purchase',
          propertyAddress: '123 Main St, Anytown, USA',
          amount: 350000,
          status: 'in progress',
          createdAt: '2023-03-15T14:00:00Z',
          currentMilestone: 'Document Collection',
          progress: 40
        },
        {
          _id: '2',
          borrower: {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            phone: '(555) 987-6543'
          },
          purpose: 'Refinance',
          propertyAddress: '456 Oak Ave, Somewhere, USA',
          amount: 280000,
          status: 'pending approval',
          createdAt: '2023-02-20T10:30:00Z',
          currentMilestone: 'Underwriting',
          progress: 65
        },
        {
          _id: '3',
          borrower: {
            name: 'Michael Chen',
            email: 'michael.chen@example.com',
            phone: '(555) 456-7890'
          },
          purpose: 'Home Purchase',
          propertyAddress: '789 Pine St, Othertown, USA',
          amount: 425000,
          status: 'approved',
          createdAt: '2023-03-05T09:15:00Z',
          currentMilestone: 'Closing',
          progress: 85
        }
      ];
      
      // Apply filters to mock data
      let filteredApplications = [...mockApplications];
      
      // Filter by status
      if (filters.status !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === filters.status);
      }
      
      // Filter by search text
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredApplications = filteredApplications.filter(app => 
          app.borrower.name.toLowerCase().includes(searchLower) ||
          app.propertyAddress.toLowerCase().includes(searchLower) ||
          app.purpose.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort applications
      switch (filters.sortBy) {
        case 'dateAsc':
          filteredApplications.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'dateDesc':
          filteredApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'amountAsc':
          filteredApplications.sort((a, b) => a.amount - b.amount);
          break;
        case 'amountDesc':
          filteredApplications.sort((a, b) => b.amount - a.amount);
          break;
        case 'progressAsc':
          filteredApplications.sort((a, b) => a.progress - b.progress);
          break;
        case 'progressDesc':
          filteredApplications.sort((a, b) => b.progress - a.progress);
          break;
      }
      
      setApplications(filteredApplications);
      
      // Select the first application by default if none is selected
      if (!selectedLoanId && filteredApplications.length > 0) {
        setSelectedLoanId(filteredApplications[0]._id);
      } else if (selectedLoanId && !filteredApplications.find(app => app._id === selectedLoanId)) {
        // If the selected loan is filtered out, select the first visible one
        setSelectedLoanId(filteredApplications.length > 0 ? filteredApplications[0]._id : '');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      sortBy: 'dateDesc'
    });
  };

  // Handle application selection
  const handleApplicationSelect = (loanId) => {
    setSelectedLoanId(loanId);
  };

  // Handle milestone update
  const handleMilestoneUpdate = (updatedMilestones) => {
    // In a real app, this would sync with the backend
    console.log('Milestones updated:', updatedMilestones);
    
    // Update the application's progress in the list
    const completedMilestones = updatedMilestones.filter(m => m.status === 'completed').length;
    const progress = Math.round((completedMilestones / updatedMilestones.length) * 100);
    const currentMilestone = updatedMilestones.find(m => m.status === 'current')?.title || 'Completed';
    
    setApplications(prev => 
      prev.map(app => 
        app._id === selectedLoanId 
          ? { ...app, progress, currentMilestone }
          : app
      )
    );
    
    toast.success('Loan progress updated successfully');
  };

  // Find the selected application object
  const selectedApplication = applications.find(app => app._id === selectedLoanId);

  return (
    <ProtectedRoute allowedRoles={['lender', 'admin']}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Loan Milestone Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and update loan progress across all borrower applications
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Filters */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
              <div className="md:flex md:items-center">
                <div className="md:flex-auto">
                  <h3 className="text-base font-medium text-gray-900">Filter Applications</h3>
                </div>
                <div className="mt-4 md:mt-0 md:ml-16 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="search" className="sr-only">Search</label>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search by name, address..."
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="sr-only">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      <option value="in progress">In Progress</option>
                      <option value="pending approval">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sortBy" className="sr-only">Sort By</label>
                    <select
                      id="sortBy"
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="dateDesc">Newest First</option>
                      <option value="dateAsc">Oldest First</option>
                      <option value="amountDesc">Highest Amount</option>
                      <option value="amountAsc">Lowest Amount</option>
                      <option value="progressDesc">Most Progress</option>
                      <option value="progressAsc">Least Progress</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="w-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.status !== 'all' || filters.search ? 
                    'Try adjusting your filters to see more applications.' : 
                    'There are no loan applications to display at this time.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
                {/* Application List */}
                <div className="lg:w-1/3">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Loan Applications
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                      {applications.map(application => (
                        <li 
                          key={application._id}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedLoanId === application._id ? 'bg-primary-50 border-l-4 border-primary' : ''}`}
                          onClick={() => handleApplicationSelect(application._id)}
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-800">
                                    {application.borrower.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {application.borrower.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {application.purpose} - ${application.amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {application.currentMilestone}
                                </div>
                                <div className="mt-2 w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${application.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Milestone Manager for Selected Application */}
                <div className="lg:w-2/3">
                  {selectedApplication ? (
                    <>
                      {/* Selected Application Overview */}
                      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Borrower</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedApplication.borrower.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedApplication.borrower.email} | {selectedApplication.borrower.phone}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Loan Details</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                              {selectedApplication.purpose} - ${selectedApplication.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Applied: {new Date(selectedApplication.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500">Property Address</h3>
                            <p className="mt-1 font-medium text-gray-900">
                              {selectedApplication.propertyAddress}
                            </p>
                          </div>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        <div className="mt-4 flex space-x-3">
                          <a
                            href={`/lender/applications/${selectedApplication._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            View Full Details
                          </a>
                          <a
                            href={`/lender/documents?loanId=${selectedApplication._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            View Documents
                          </a>
                          <a
                            href={`/lender/messages?borrowerId=${selectedApplication.borrower.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            Message Borrower
                          </a>
                        </div>
                      </div>
                      
                      {/* Milestone Manager Component */}
                      <MilestoneManager
                        loanId={selectedLoanId}
                        userRole="lender"
                        onMilestoneUpdate={handleMilestoneUpdate}
                      />
                    </>
                  ) : (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No application selected</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select a loan application from the list to view and manage its milestones.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderMilestones;
