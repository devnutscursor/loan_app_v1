import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoanMilestones from '../../components/common/LoanMilestones';
import { adminService } from '../../services/api';

/**
 * Admin Loan Management Page
 * Allows admins to view, filter, and manage loan applications
 * including milestone tracking and status updates
 */
const AdminLoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  
  useEffect(() => {
    fetchLoans();
  }, []);
  
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllLoans(filters);
      setLoans(response.data.loans || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    fetchLoans();
  };
  
  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: ''
    });
  };
  
  const handleStatusChange = async (loanId, newStatus) => {
    try {
      await adminService.updateLoan(loanId, { status: newStatus });
      
      // Update loan in state
      setLoans(
        loans.map(loan => 
          loan._id === loanId ? { ...loan, status: newStatus } : loan
        )
      );
      
      toast.success(`Loan status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating loan status:', error);
      toast.error('Failed to update loan status');
    }
  };
  
  const handleMilestoneUpdate = async (loanId, milestoneId, newStatus) => {
    try {
      await adminService.updateLoanMilestone(loanId, milestoneId, { status: newStatus });
      
      // Update loan milestones in state
      setLoans(
        loans.map(loan => {
          if (loan._id === loanId) {
            return {
              ...loan,
              milestones: loan.milestones.map(milestone => 
                milestone.id === milestoneId 
                  ? { ...milestone, status: newStatus } 
                  : milestone
              )
            };
          }
          return loan;
        })
      );
      
      // If selected loan is open, update it too
      if (selectedLoan && selectedLoan._id === loanId) {
        setSelectedLoan({
          ...selectedLoan,
          milestones: selectedLoan.milestones.map(milestone => 
            milestone.id === milestoneId 
              ? { ...milestone, status: newStatus, date: milestone.status !== newStatus ? new Date() : milestone.date } 
              : milestone
          )
        });
      }
      
      toast.success('Milestone updated');
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };
  
  const openLoanDetails = (loan) => {
    setSelectedLoan(loan);
  };
  
  const closeLoanDetails = () => {
    setSelectedLoan(null);
  };
  
  const getLoanStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'denied': 'bg-red-100 text-red-800',
      'in_review': 'bg-blue-100 text-blue-800',
      'funded': 'bg-purple-100 text-purple-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </span>
    );
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };
  
  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout title="Loan Management">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Loan Management</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => fetchLoans()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="mt-4 bg-white shadow rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Loans</h2>
              <form onSubmit={applyFilters}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status-filter"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                      <option value="funded">Funded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <input
                      type="text"
                      id="search-filter"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by ID, borrower, or amount"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end-date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>
            
            {/* Loans List */}
            <div className="mt-4 flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loan ID / Borrower
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount / Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4">
                              <div className="flex justify-center">
                                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            </td>
                          </tr>
                        ) : loans.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                              No loans found matching the current filters
                            </td>
                          </tr>
                        ) : (
                          loans.map((loan) => (
                            <tr key={loan._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {loan.loanNumber || loan._id.substring(0, 8)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {loan.borrower?.firstName} {loan.borrower?.lastName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(loan.amount)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {loan.loanType?.charAt(0).toUpperCase() + loan.loanType?.slice(1).replace('_', ' ')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getLoanStatusBadge(loan.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(loan.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {loan.milestones && loan.milestones.length > 0 ? (
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                      <div
                                        style={{
                                          width: `${(loan.milestones.filter(m => m.status === 'completed').length / loan.milestones.length) * 100}%`
                                        }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                                      ></div>
                                    </div>
                                  </div>
                                ) : (
                                  'No milestones'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openLoanDetails(loan)}
                                  className="text-primary hover:text-primary-dark"
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
                </div>
              </div>
            </div>
            
            {/* Loan Details Modal */}
            {selectedLoan && (
              <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="loan-details-modal" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        onClick={closeLoanDetails}
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Loan Details
                        </h3>
                        
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Loan ID
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {selectedLoan.loanNumber || selectedLoan._id}
                              </dd>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Borrower
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {selectedLoan.borrower?.firstName} {selectedLoan.borrower?.lastName}
                              </dd>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Amount
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {formatCurrency(selectedLoan.amount)}
                              </dd>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Status
                              </dt>
                              <dd className="mt-1">
                                <select
                                  value={selectedLoan.status}
                                  onChange={(e) => handleStatusChange(selectedLoan._id, e.target.value)}
                                  className="max-w-lg block w-full shadow-sm focus:ring-primary focus:border-primary sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_review">In Review</option>
                                  <option value="approved">Approved</option>
                                  <option value="denied">Denied</option>
                                  <option value="funded">Funded</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </dd>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Loan Type
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {selectedLoan.loanType?.charAt(0).toUpperCase() + selectedLoan.loanType?.slice(1).replace('_', ' ')}
                              </dd>
                            </div>
                            
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Created
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {formatDate(selectedLoan.createdAt)}
                              </dd>
                            </div>
                          </div>
                        </div>
                        
                        {/* Loan Milestones */}
                        <div className="mt-6">
                          <h4 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Loan Milestones
                          </h4>
                          
                          {selectedLoan.milestones && selectedLoan.milestones.length > 0 ? (
                            <LoanMilestones
                              milestones={selectedLoan.milestones}
                              interactive={true}
                              onMilestoneUpdate={(milestoneId, status) => 
                                handleMilestoneUpdate(selectedLoan._id, milestoneId, status)
                              }
                            />
                          ) : (
                            <p className="text-sm text-gray-500">No milestones have been set for this loan.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminLoansPage;
