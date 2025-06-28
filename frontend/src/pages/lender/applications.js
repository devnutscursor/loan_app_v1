import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { lenderService } from '../../services/api';

const LoanApplicationCard = ({ application, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const statusColors = {
    'pending': 'bg-yellow-50 text-yellow-800',
    'approved': 'bg-green-50 text-green-800',
    'rejected': 'bg-red-50 text-red-800',
    'under_review': 'bg-blue-50 text-blue-800',
    'funded': 'bg-purple-50 text-purple-800'
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleStatusChange = async (newStatus) => {
    if (application.status === newStatus) return;
    
    try {
      setUpdating(true);
      await onStatusChange(application._id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    console.log('Application:', application);
  }, [application]);
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between flex-wrap">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {application.borrowerDetails.firstName} {application.borrowerDetails.lastName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Application ID: {application._id.substring(0, 8)}...
            </p>
          </div>
          
          <div className="flex items-start">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[application.status]}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 text-gray-500 hover:text-gray-700"
              aria-expanded={isExpanded}
            >
              <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
              <svg
                className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-sm">
          <div className="flex space-x-4">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-1 font-medium">{formatCurrency(application.amount)}</span>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <span className="ml-1 font-medium">{application.term} months</span>
            </div>
            <div>
              <span className="text-gray-500">Purpose:</span>
              <span className="ml-1 font-medium">{application.purpose}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Applied:</span>
            <span className="ml-1 font-medium">{formatDate(application.createdAt)}</span>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Borrower Information</h4>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <dl className="divide-y divide-gray-100">
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{application.borrowerDetails.email}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{application.borrowerDetails.phone}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {application.borrowerDetails.currentAddress?.streetAddress}, {application.borrowerDetails.currentAddress?.city}, {application.borrowerDetails.currentAddress?.state} {application.borrowerDetails.currentAddress?.zipCode}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Financial Information</h4>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <dl className="divide-y divide-gray-100">
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{formatCurrency(application.annualIncome)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Employment</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {application.employmentStatus} {application.employer ? `at ${application.employer}` : ''}
                    </dd>
                  </div>
                  <div className="py-2 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Credit Score</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{application.creditScore || 'Not provided'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Loan Description</h4>
            <p className="mt-2 text-sm text-gray-900 whitespace-pre-line">
              {application.description}
            </p>
          </div>
          
          {application.documents?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Documents</h4>
              <ul className="mt-2 divide-y divide-gray-200">
                {application.documents.map((doc, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-900">{doc.fileName || `Document ${index + 1}`}</span>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Update Application Status</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusChange('under_review')}
                disabled={updating || application.status === 'under_review'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  application.status === 'under_review'
                    ? 'bg-blue-50 text-blue-800 cursor-default'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Under Review
              </button>
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={updating || application.status === 'approved'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  application.status === 'approved'
                    ? 'bg-green-50 text-green-800 cursor-default'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={updating || application.status === 'rejected'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  application.status === 'rejected'
                    ? 'bg-red-50 text-red-800 cursor-default'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Reject
              </button>
              <button
                onClick={() => handleStatusChange('funded')}
                disabled={updating || application.status === 'funded' || application.status === 'rejected'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  application.status === 'funded'
                    ? 'bg-purple-50 text-purple-800 cursor-default'
                    : application.status === 'rejected'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Mark as Funded
              </button>
              {updating && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ApplicationsPage = () => {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await lenderService.getApplications();
        setApplications(response.data.data.loans);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load loan applications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);
  
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await lenderService.updateApplicationStatus(applicationId, { status: newStatus });
      
      // Update application in state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      toast.success(`Application status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };
  
  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });
  
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'date_desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'amount_asc':
        return a.amount - b.amount;
      case 'amount_desc':
        return b.amount - a.amount;
      default:
        return 0;
    }
  });
  
  return (
    <ProtectedRoute roles={['lender']}>
      <MainLayout title="Loan Applications">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Loan Applications</h1>
            
            {/* Filters and Sort */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <label htmlFor="status-filter" className="sr-only">
                    Filter by Status
                  </label>
                  <div className="relative">
                    <select
                      id="status-filter"
                      name="status-filter"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Applications</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="funded">Funded</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="sort-by" className="sr-only">
                    Sort by
                  </label>
                  <div className="relative">
                    <select
                      id="sort-by"
                      name="sort-by"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="amount_desc">Amount: High to Low</option>
                      <option value="amount_asc">Amount: Low to High</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : sortedApplications.length > 0 ? (
              <div className="space-y-6">
                {sortedApplications.map(application => (
                  <LoanApplicationCard
                    key={application._id}
                    application={application}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusFilter === 'all'
                      ? 'There are no loan applications available at this time.'
                      : `There are no ${statusFilter.replace('_', ' ')} applications available.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ApplicationsPage;
