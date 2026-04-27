import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { FiClock, FiExternalLink, FiFileText, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { LoanService, DocumentService } from '../../services';

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: ''
  });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedLoanDocuments, setSelectedLoanDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    try {
      // Apply filters
      const apiFilters = { ...filters };
      if (search) {
        apiFilters.search = search;
      }
      
      const response = await LoanService.getLoans(apiFilters);
      console.log('Loans response with filters:', apiFilters, response);
      
      if (response.success) {
        // The API returns data in the format { data: { loans: [...] } }
        const loansData = response.data.data?.loans || [];
        
        // Fetch milestone data for each loan to calculate accurate progress
        const enhancedLoansPromises = loansData.map(async (loan) => {
          try {
            // Fetch milestones for this loan
            const milestonesResponse = await LoanService.getLoanMilestones(loan._id);
            
            // Calculate milestone progress if milestones are available
            if (milestonesResponse.success && milestonesResponse.data?.milestones?.length > 0) {
              const milestones = milestonesResponse.data.milestones;
              
              // Count completed and in-progress milestones
              const completedCount = milestones.filter(m => m.status === 'completed' || m.isCompleted).length;
              const inProgressCount = milestones.filter(m => m.status === 'in_progress').length;
              
              // Calculate progress percentage (completed = 100%, in_progress = 50%)
              const progressValue = (completedCount + (inProgressCount * 0.5)) / milestones.length;
              const milestoneProgress = Math.round(progressValue * 100);
              
              // Return enhanced loan object with milestone progress
              return {
                ...loan,
                milestoneProgress,
                milestones
              };
            }
            
            // Return original loan if no milestone data was found
            return loan;
          } catch (error) {
            console.error(`Error fetching milestones for loan ${loan._id}:`, error);
            return loan; // Return original loan object if there's an error
          }
        });
        
        // Wait for all milestone data to be fetched
        const enhancedLoans = await Promise.all(enhancedLoansPromises);
        setLoans(enhancedLoans);
        
        // If there's a selected loan, refresh its data
        if (selectedLoan) {
          const updatedLoan = enhancedLoans.find(loan => loan._id === selectedLoan._id);
          if (updatedLoan) {
            setSelectedLoan(updatedLoan);
          }
        }
      } else {
        toast.error(response.message || 'Failed to load your loans');
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      toast.error('Error loading your loan applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoan = async (loan) => {
    setSelectedLoan(loan);
    
    // Load documents for the selected loan
    if (loan) {
      await loadLoanDocuments(loan._id);
    }
  };

  const loadLoanDocuments = async (loanId) => {
    setLoadingDocuments(true);
    try {
      const response = await DocumentService.getDocumentsByLoan(loanId);
      
      if (response.success) {
        setSelectedLoanDocuments(response.data);
      } else {
        setSelectedLoanDocuments([]);
        console.error('Failed to load documents:', response.message);
      }
    } catch (error) {
      console.error('Error loading loan documents:', error);
      setSelectedLoanDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      // Apply filters immediately after setting them
      setTimeout(() => loadLoans(), 0);
      return newFilters;
    });
  };

  const applyFilters = () => {
    loadLoans();
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      dateRange: ''
    });
    setSearch('');
    setTimeout(loadLoans, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      funded: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusStep = (status) => {
    // Map status to a step number for the progress bar
    const statusSteps = {
      draft: 0,
      pending: 1,
      reviewing: 2,
      approved: 3,
      rejected: 3, // Same step as approved but with different visual
      funded: 4,
      closed: 5
    };
    
    return statusSteps[status] || 0;
  };

  const handleContinueApplication = (loanId) => {
    router.push(`/borrower/loan-application?draft=${loanId}`);
  };

  const handleNewApplication = () => {
    router.push('/borrower/loan-application');
  };

  const handleViewDocument = (documentId) => {
    window.open(`/borrower/documents/view/${documentId}`, '_blank');
  };

  const handleUploadRequiredDocuments = (loanId) => {
    router.push(`/borrower/documents/upload?loanId=${loanId}`);
  };

  const handleViewPayments = (loanId) => {
    router.push(`/borrower/loans/${loanId}/payments`);
  };

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="My Loans">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">My Loan Applications</h1>
              
              <button
                onClick={handleNewApplication}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none"
              >
                Apply for a New Loan
              </button>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex flex-wrap justify-between items-center">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Loan Applications
                </h2>
                
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search loans..."
                      className="w-48 sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      onClick={applyFilters}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      <FiSearch className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Loans</option>
                    <option value="Application Started">Application Started</option>
                    <option value="Application Submitted">Application Submitted</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Approved">Approved</option>
                    <option value="Conditional Approval">Approved (Conditional)</option>
                    <option value="Clear to Close">Clear to Close</option>
                    <option value="Funded">Funded</option>
                    <option value="Closed">Closed</option>
                    <option value="Declined">Denied</option>
                  </select>
                  
                  <select
                    name="dateRange"
                    value={filters.dateRange}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Time</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                  
                  <button
                    onClick={applyFilters}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Apply
                  </button>
                  
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : loans.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center border-t border-gray-200">
                  <p className="text-gray-500 my-4">You don't have any loan applications yet.</p>
                  <button
                    onClick={handleNewApplication}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none"
                  >
                    Apply for Your First Loan
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(loans) && loans.map((loan) => (
                        <tr 
                          key={loan._id} 
                          className={`hover:bg-gray-50 ${selectedLoan?._id === loan._id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {loan._id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(loan.loanAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.purpose.charAt(0).toUpperCase() + loan.purpose.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(loan.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(loan.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewLoan(loan)}
                              className="text-primary hover:text-primary-dark mr-3"
                            >
                              View Details
                            </button>
                            
                            {loan.status === 'draft' && (
                              <button
                                onClick={() => handleContinueApplication(loan._id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Continue
                              </button>
                            )}
                            
                            {loan.status === 'funded' && (
                              <button
                                onClick={() => handleViewPayments(loan._id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Payments
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Loan Details */}
            {selectedLoan && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Loan Application Details
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Application ID: {selectedLoan._id}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(selectedLoan.status)}
                  </div>
                </div>
                
                {/* Status Timeline */}
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Application Progress</h4>
                  <div className="relative">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 mb-4">
                      <div 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          selectedLoan.status === 'rejected' ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${(getStatusStep(selectedLoan.status) / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className={`w-6 h-6 mb-1 rounded-full mx-auto flex items-center justify-center ${
                          getStatusStep(selectedLoan.status) >= 1 ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}>
                          1
                        </div>
                        <div className="text-xs">Submitted</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-6 h-6 mb-1 rounded-full mx-auto flex items-center justify-center ${
                          getStatusStep(selectedLoan.status) >= 2 ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}>
                          2
                        </div>
                        <div className="text-xs">Reviewing</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-6 h-6 mb-1 rounded-full mx-auto flex items-center justify-center ${
                          getStatusStep(selectedLoan.status) >= 3 
                            ? selectedLoan.status === 'rejected' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-primary text-white' 
                            : 'bg-gray-200'
                        }`}>
                          3
                        </div>
                        <div className="text-xs">Decision</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-6 h-6 mb-1 rounded-full mx-auto flex items-center justify-center ${
                          getStatusStep(selectedLoan.status) >= 4 ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}>
                          4
                        </div>
                        <div className="text-xs">Funded</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-6 h-6 mb-1 rounded-full mx-auto flex items-center justify-center ${
                          getStatusStep(selectedLoan.status) >= 5 ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}>
                          5
                        </div>
                        <div className="text-xs">Closed</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-0">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <FiClock className="mr-2" /> Application Timeline
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="divide-y divide-gray-200">
                          <li className="py-2">
                            <span className="font-medium">Submitted:</span> {formatDate(selectedLoan.createdAt)}
                          </li>
                          {selectedLoan.updatedAt && selectedLoan.updatedAt !== selectedLoan.createdAt && (
                            <li className="py-2">
                              <span className="font-medium">Last Updated:</span> {formatDate(selectedLoan.updatedAt)}
                            </li>
                          )}
                          {selectedLoan.reviewStartedAt && (
                            <li className="py-2">
                              <span className="font-medium">Review Started:</span> {formatDate(selectedLoan.reviewStartedAt)}
                            </li>
                          )}
                          {selectedLoan.approvedAt && (
                            <li className="py-2">
                              <span className="font-medium">Approved:</span> {formatDate(selectedLoan.approvedAt)}
                            </li>
                          )}
                          {selectedLoan.rejectedAt && (
                            <li className="py-2">
                              <span className="font-medium">Denied:</span> {formatDate(selectedLoan.rejectedAt)}
                            </li>
                          )}
                          {selectedLoan.fundedAt && (
                            <li className="py-2">
                              <span className="font-medium">Funded:</span> {formatDate(selectedLoan.fundedAt)}
                            </li>
                          )}
                          {selectedLoan.closedAt && (
                            <li className="py-2">
                              <span className="font-medium">Closed:</span> {formatDate(selectedLoan.closedAt)}
                            </li>
                          )}
                        </ul>
                      </dd>
                    </div>
                    
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <FiFileText className="mr-2" /> Loan Details
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="divide-y divide-gray-200">
                          <li className="py-2">
                            <span className="font-medium">Loan Amount:</span> {formatCurrency(selectedLoan.loanAmount)}
                          </li>
                          <li className="py-2">
                            <span className="font-medium">Loan Type:</span> {selectedLoan.loanType?.charAt(0).toUpperCase() + selectedLoan.loanType?.slice(1)}
                          </li>
                          <li className="py-2">
                            <span className="font-medium">Purpose:</span> {selectedLoan.purpose?.charAt(0).toUpperCase() + selectedLoan.purpose?.slice(1)}
                          </li>
                          <li className="py-2">
                            <span className="font-medium">Term:</span> {selectedLoan.term} {selectedLoan.term === 1 ? 'month' : 'months'}
                          </li>
                          {selectedLoan.interestRate && (
                            <li className="py-2">
                              <span className="font-medium">Interest Rate:</span> {selectedLoan.interestRate}%
                            </li>
                          )}
                        </ul>
                      </dd>
                    </div>
                    
                    {/* Status-specific information */}
                    {selectedLoan.status === 'rejected' && selectedLoan.rejectionReason && (
                      <div className="bg-red-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-red-500 flex items-center">
                          <FiX className="mr-2" /> Rejection Reason
                        </dt>
                        <dd className="mt-1 text-sm text-red-700 sm:mt-0 sm:col-span-2">
                          {selectedLoan.rejectionReason}
                        </dd>
                      </div>
                    )}
                    
                    {selectedLoan.status === 'approved' && selectedLoan.approvalTerms && (
                      <div className="bg-green-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-green-500 flex items-center">
                          <FiCheck className="mr-2" /> Approval Terms
                        </dt>
                        <dd className="mt-1 text-sm text-green-700 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                          {selectedLoan.approvalTerms}
                        </dd>
                      </div>
                    )}
                    
                    {/* Documents Section */}
                    <div className="bg-gray-50 px-4 py-5 sm:px-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                        {(selectedLoan.status === 'pending' || selectedLoan.status === 'reviewing') && (
                          <button
                            onClick={() => handleUploadRequiredDocuments(selectedLoan._id)}
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                          >
                            Upload Required Documents
                          </button>
                        )}
                      </div>
                      
                      {loadingDocuments ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : selectedLoanDocuments.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2">No documents uploaded yet.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {selectedLoanDocuments.map(doc => (
                            <li key={doc._id} className="py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <FiFileText className="mr-2 text-gray-400" />
                                <span className="text-sm text-gray-900">{doc.name}</span>
                                {doc.status === 'pending' && (
                                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pending Review
                                  </span>
                                )}
                                {doc.status === 'approved' && (
                                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Approved
                                  </span>
                                )}
                                {doc.status === 'rejected' && (
                                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Rejected
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleViewDocument(doc._id)}
                                className="text-primary hover:text-primary-dark text-sm flex items-center"
                              >
                                View <FiExternalLink className="ml-1" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {selectedLoan.additionalNotes && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                          {selectedLoan.additionalNotes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                {/* Action Buttons */}
                <div className="bg-gray-50 px-4 py-5 sm:px-6">
                  <div className="flex justify-end space-x-3">
                    {selectedLoan.status === 'funded' && (
                      <button
                        onClick={() => handleViewPayments(selectedLoan._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                      >
                        View Payments
                      </button>
                    )}
                    
                    {(selectedLoan.status === 'pending' || selectedLoan.status === 'reviewing') && (
                      <button
                        onClick={() => handleUploadRequiredDocuments(selectedLoan._id)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Upload Documents
                      </button>
                    )}
                    
                    {selectedLoan.status === 'draft' && (
                      <button
                        onClick={() => handleContinueApplication(selectedLoan._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                      >
                        Continue Application
                      </button>
                    )}
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

export default MyLoans;
