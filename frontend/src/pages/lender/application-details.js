import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoanMilestones from '../../components/common/LoanMilestones';
import ConditionManager from '../../components/lender/ConditionManager';
import lenderService from '../../services/api/lender.service';

/**
 * Loan Application Details Page
 * Displays comprehensive loan application information for lenders
 * with integrated document management and condition management
 */
const LoanApplicationDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDenialModal, setShowDenialModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [denialReasons, setDenialReasons] = useState([]);
  const [denialOtherText, setDenialOtherText] = useState('');
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (id) {
      fetchLoanDetails();
    }
  }, [id]);
  
  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await lenderService.getLoanApplication(id);
      setLoan(response.data.data);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      toast.error('Failed to load loan application details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (newStatus) => {
    // If moving to Declined, open denial reasons modal first
    if (newStatus === 'Declined') {
      setPendingStatus(newStatus);
      setShowDenialModal(true);
      return;
    }

    await submitStatusChange(newStatus);
  };

  const submitStatusChange = async (newStatus, extraPayload = {}) => {
    try {
      const payload = { status: newStatus, ...extraPayload };
      const res = await lenderService.updateLoanStatus(id, payload);

      const updatedLoan = res?.data?.data || { ...loan, status: newStatus };
      setLoan(updatedLoan);

      toast.success(`Loan status updated to ${newStatus}`);
      setShowDenialModal(false);
      setPendingStatus(null);
      setDenialReasons([]);
      setDenialOtherText('');
    } catch (error) {
      console.error('Error updating loan status:', error);

      // Try to surface backend missingFields (MCR gate failures)
      const details = error.response?.data?.details || error.response?.data || {};
      const mf = details.missingFields || [];
      if (Array.isArray(mf) && mf.length > 0) {
        setMissingFields(mf);
        setShowMissingFieldsModal(true);
        toast.error('Cannot update status until required MCR fields are completed.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update loan status');
      }
    }
  };
  
  const handleMilestoneUpdate = async (milestoneId, newStatus) => {
    try {
      await lenderService.updateLoanMilestone(id, milestoneId, { status: newStatus });
      
      // Update loan milestones in state
      setLoan({
        ...loan,
        milestones: loan.milestones.map(milestone => 
          milestone.id === milestoneId 
            ? { ...milestone, status: newStatus } 
            : milestone
        )
      });
      
      toast.success('Milestone updated');
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };
  
  const getLoanStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-50 text-yellow-800',
      'approved': 'bg-green-50 text-green-800',
      'denied': 'bg-red-50 text-red-800',
      'in_review': 'bg-blue-50 text-blue-800',
      'funded': 'bg-purple-50 text-purple-800',
      'closed': 'bg-gray-50 text-gray-800'
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
  
  if (loading) {
    return (
      <ProtectedRoute roles={['lender', 'admin']}>
        <MainLayout title="Loan Application Details">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }
  
  if (!loan) {
    return (
      <ProtectedRoute roles={['lender', 'admin']}>
        <MainLayout title="Loan Application Details">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-center text-gray-500">Loan application not found</p>
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute roles={['lender', 'admin']}>
      <MainLayout title={`Loan Application - ${loan.loanNumber || loan._id.substring(0, 8)}`}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Denial Reasons Modal */}
            {showDenialModal && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Denial Reasons</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Federal law requires you to specify why this application is being denied.
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    {['Credit Score too low','Debt-to-income too high','Collateral insufficient','Income not sufficient','Other'].map((label) => {
                      const value = label === 'Other' ? 'Other' : label;
                      const checked = denialReasons.includes(value);
                      return (
                        <label key={value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            checked={checked}
                            onChange={(e) => {
                              setDenialReasons((prev) =>
                                e.target.checked
                                  ? [...prev, value]
                                  : prev.filter((r) => r !== value)
                              );
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {denialReasons.includes('Other') && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Additional explanation for “Other”
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={denialOtherText}
                        onChange={(e) => setDenialOtherText(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDenialModal(false);
                        setPendingStatus(null);
                      }}
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!denialReasons.length) {
                          toast.error('Please select at least one denial reason.');
                          return;
                        }
                        if (denialReasons.includes('Other') && !denialOtherText.trim()) {
                          toast.error('Please provide an explanation for “Other”.');
                          return;
                        }
                        await submitStatusChange(pendingStatus || 'Declined', {
                          denialReasons,
                          denialReasonOtherText: denialOtherText
                        });
                      }}
                      className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      Confirm Denial
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Missing MCR Fields Modal */}
            {showMissingFieldsModal && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete Required MCR Fields
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    This loan cannot be marked as Funded or Closed until the following fields are completed.
                  </p>
                  <ul className="text-sm text-gray-800 list-disc pl-5 mb-4 max-h-56 overflow-y-auto">
                    {missingFields.map((f, idx) => (
                      <li key={idx}>
                        {f.label || f.field || 'Missing field'}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mb-4">
                    Use the Loan Details, Property, and Funding / Revenue tabs to fill in these items, then try the status change again.
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMissingFieldsModal(false)}
                      className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Loan #{loan.loanNumber || loan._id.substring(0, 8)}
                    </h1>
                    <div className="ml-4">
                      {getLoanStatusBadge(loan.status)}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Submitted on {formatDate(loan.createdAt)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <select
                    value={loan.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary focus:border-primary sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Application Started">Application Started</option>
                    <option value="Application Submitted">Application Submitted</option>
                    <option value="Processing">Processing</option>
                    <option value="Underwriting">Underwriting</option>
                    <option value="Conditional Approval">Conditional Approval</option>
                    <option value="Approved-Not-Accepted">Approved but not Accepted</option>
                    <option value="Clear to Close">Clear to Close</option>
                    <option value="Closed">Closed</option>
                    <option value="Funded">Funded</option>
                    <option value="Declined">Declined</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Closed-Incomplete">Closed for Incompleteness</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-500">Borrower</h3>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {loan.borrower?.firstName} {loan.borrower?.lastName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {loan.borrower?.email}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {loan.borrower?.phone}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-500">Loan Amount</h3>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {formatCurrency(loan.amount)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Term: {loan.term || 'N/A'} {loan.term ? 'months' : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Rate: {loan.interestRate || 'N/A'} {loan.interestRate ? '%' : ''}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-500">Loan Type</h3>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {loan.loanType?.charAt(0).toUpperCase() + loan.loanType?.slice(1).replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Purpose: {loan.purpose?.charAt(0).toUpperCase() + loan.purpose?.slice(1).replace('_', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    className={`${
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`${
                      activeTab === 'borrower'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('borrower')}
                  >
                    Borrower Info
                  </button>
                  <button
                    className={`${
                      activeTab === 'conditions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('conditions')}
                  >
                    Conditions
                  </button>
                  <button
                    className={`${
                      activeTab === 'documents'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white shadow rounded-lg p-6">
              {activeTab === 'overview' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Loan Progress</h3>
                    <div className="mt-4">
                      {loan.milestones && loan.milestones.length > 0 ? (
                        <LoanMilestones
                          milestones={loan.milestones}
                          interactive={true}
                          onMilestoneUpdate={(milestoneId, status) => 
                            handleMilestoneUpdate(milestoneId, status)
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-500">No milestones set for this loan.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{loan._id}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Loan Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{loan.loanNumber || 'Not assigned yet'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(loan.createdAt)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(loan.updatedAt)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Loan Amount</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.amount)}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Down Payment</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {loan.downPayment ? formatCurrency(loan.downPayment) : 'N/A'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {loan.interestRate ? `${loan.interestRate}%` : 'Not set'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Loan Term</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {loan.term ? `${loan.term} months` : 'Not set'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Estimated Closing Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {loan.estimatedClosingDate ? formatDate(loan.estimatedClosingDate) : 'Not set'}
                        </dd>
                      </div>
                    </div>
                  </div>
                  
                  {loan.property && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900">Property Information</h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Property Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.property.streetAddress}
                            <br />
                            {loan.property.city}, {loan.property.state} {loan.property.zipCode}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.property.propertyType?.charAt(0).toUpperCase() + loan.property.propertyType?.slice(1).replace('_', ' ') || 'N/A'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Occupancy Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.property.occupancyType?.charAt(0).toUpperCase() + loan.property.occupancyType?.slice(1).replace('_', ' ') || 'N/A'}
                          </dd>
                        </div>
                        
                        {loan.property.estimatedValue && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatCurrency(loan.property.estimatedValue)}
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'borrower' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Borrower Information</h3>
                    
                    {loan.borrower && (
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.firstName} {loan.borrower.middleName ? loan.borrower.middleName + ' ' : ''}{loan.borrower.lastName}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.email}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.phone || 'Not provided'}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.dateOfBirth ? formatDate(loan.borrower.dateOfBirth) : 'Not provided'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Social Security Number</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.ssn ? `XXX-XX-${loan.borrower.ssn.substring(loan.borrower.ssn.length - 4)}` : 'Not provided'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.maritalStatus?.charAt(0).toUpperCase() + loan.borrower.maritalStatus?.slice(1) || 'Not provided'}
                          </dd>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {loan.borrower?.address && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900">Current Address</h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.address.streetAddress}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">City</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.address.city}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">State</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.address.state}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ZIP Code</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.address.zipCode}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Housing Status</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.address.housingStatus?.charAt(0).toUpperCase() + 
                              loan.borrower.address.housingStatus?.slice(1).replace('_', ' ') || 'Not provided'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Monthly Payment</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.address.monthlyPayment ? formatCurrency(loan.borrower.address.monthlyPayment) : 'Not provided'}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {loan.borrower?.employment && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900">Employment Information</h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Employer</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.employment.employerName}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Position</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.borrower.employment.position}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(loan.borrower.employment.startDate)}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatCurrency(loan.borrower.employment.annualIncome)}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.borrower.employment.employmentType?.charAt(0).toUpperCase() + 
                              loan.borrower.employment.employmentType?.slice(1).replace('_', ' ') || 'Not provided'}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {loan.coBorrower && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900">Co-Borrower Information</h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.coBorrower.firstName} {loan.coBorrower.middleName ? loan.coBorrower.middleName + ' ' : ''}{loan.coBorrower.lastName}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.coBorrower.email}</dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Relationship to Borrower</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {loan.coBorrower.relationship?.charAt(0).toUpperCase() + 
                              loan.coBorrower.relationship?.slice(1) || 'Not provided'}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'conditions' && (
                <ConditionManager 
                  loanId={loan._id}
                  loanData={loan}
                />
              )}
              
              {activeTab === 'documents' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                  <p className="mt-2 text-sm text-gray-500">View and manage documents for this loan application.</p>
                  
                  {/* Document management integration would go here */}
                  <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-gray-500">Document management component will be integrated here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanApplicationDetailsPage;
