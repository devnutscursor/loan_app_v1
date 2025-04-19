import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { FiFileText, FiUser, FiDollarSign, FiClock, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { LoanService, DocumentService, NotificationService } from '../../../services';

const LoanDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [statusAction, setStatusAction] = useState('');
  const [actionData, setActionData] = useState({
    reason: '',
    terms: '',
    message: '',
    requestedItems: [],
    amount: '',
    fundingDate: '',
    closingStatus: 'completed'
  });
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadLoanData();
      loadDocuments();
    }
  }, [id]);

  const loadLoanData = async () => {
    setLoading(true);
    try {
      const response = await LoanService.getLenderLoanDetails(id);
      if (response.success) {
        setLoan(response.data);
      } else {
        toast.error(response.message || 'Failed to load loan details');
      }
    } catch (error) {
      console.error('Error loading loan details:', error);
      toast.error('Error loading loan details');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await DocumentService.getDocumentsByLoan(id);
      if (response.success) {
        setDocuments(response.data);
      } else {
        toast.error(response.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error loading documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleActionChange = (e) => {
    const { name, value } = e.target;
    setActionData(prev => ({ ...prev, [name]: value }));
  };

  const openActionModal = (action) => {
    setStatusAction(action);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setStatusAction('');
    setActionData({
      reason: '',
      terms: '',
      message: '',
      requestedItems: [],
      amount: '',
      fundingDate: '',
      closingStatus: 'completed'
    });
  };

  const submitAction = async () => {
    try {
      let response;
      
      switch (statusAction) {
        case 'approve':
          response = await LoanService.approveLoan(id, {
            terms: actionData.terms
          });
          break;
        case 'reject':
          response = await LoanService.rejectLoan(id, actionData.reason);
          break;
        case 'request_info':
          response = await LoanService.requestAdditionalInfo(
            id, 
            actionData.requestedItems.split(',').map(item => item.trim()),
            actionData.message
          );
          break;
        case 'fund':
          response = await LoanService.fundLoan(id, {
            amount: parseFloat(actionData.amount),
            fundingDate: actionData.fundingDate || new Date().toISOString()
          });
          break;
        case 'close':
          response = await LoanService.closeLoan(id, {
            status: actionData.closingStatus
          });
          break;
        default:
          toast.error('Invalid action');
          return;
      }
      
      if (response.success) {
        toast.success(response.message || 'Action completed successfully');
        loadLoanData(); // Refresh loan data
        
        // Create notification for borrower
        await NotificationService.createNotification({
          recipient: loan.borrower._id,
          type: 'loan_update',
          title: `Loan ${statusAction.replace('_', ' ')}`,
          message: getNotificationMessage(statusAction),
          relatedItem: {
            type: 'loan',
            id: id
          }
        });
      } else {
        toast.error(response.message || 'Failed to complete action');
      }
      
      closeActionModal();
    } catch (error) {
      console.error(`Error processing ${statusAction}:`, error);
      toast.error(`Failed to ${statusAction.replace('_', ' ')} loan`);
    }
  };
  
  const getNotificationMessage = (action) => {
    switch (action) {
      case 'approve':
        return 'Your loan application has been approved!';
      case 'reject':
        return `Your loan application has been rejected. Reason: ${actionData.reason}`;
      case 'request_info':
        return 'Additional information is required for your loan application.';
      case 'fund':
        return `Your loan has been funded with $${parseFloat(actionData.amount).toLocaleString()}`;
      case 'close':
        return `Your loan has been closed with status: ${actionData.closingStatus}`;
      default:
        return 'There has been an update to your loan application.';
    }
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      funded: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewDocument = (documentId) => {
    router.push(`/lender/document-verification?documentId=${documentId}&returnTo=/lender/loans/${id}`);
  };

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout title={`Loan Application ${id?.substring(0, 8) || ''}`}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push('/lender/loan-management')}
                className="flex items-center text-primary hover:text-primary-dark"
              >
                <FiArrowLeft className="mr-1" /> Back to Loan Applications
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : !loan ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">Loan application not found</p>
              </div>
            ) : (
              <>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Loan Application Details
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Application ID: {loan._id}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(loan.status)}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiUser className="mr-2" /> Borrower Information
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="mb-2">
                            <strong>Name:</strong> {loan.borrower.firstName} {loan.borrower.lastName}
                          </div>
                          <div className="mb-2">
                            <strong>Email:</strong> {loan.borrower.email}
                          </div>
                          <div>
                            <strong>Phone:</strong> {loan.borrower.phone || 'Not provided'}
                          </div>
                        </dd>
                      </div>
                      
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiDollarSign className="mr-2" /> Loan Details
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="mb-2">
                            <strong>Amount Requested:</strong> {formatCurrency(loan.loanAmount)}
                          </div>
                          <div className="mb-2">
                            <strong>Loan Type:</strong> {loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)}
                          </div>
                          <div className="mb-2">
                            <strong>Purpose:</strong> {loan.purpose.charAt(0).toUpperCase() + loan.purpose.slice(1)}
                          </div>
                          <div>
                            <strong>Term:</strong> {loan.term} {loan.term === 1 ? 'month' : 'months'}
                          </div>
                        </dd>
                      </div>
                      
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiClock className="mr-2" /> Timeline
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="mb-2">
                            <strong>Submitted:</strong> {formatDate(loan.createdAt)}
                          </div>
                          {loan.approvedAt && (
                            <div className="mb-2">
                              <strong>Approved:</strong> {formatDate(loan.approvedAt)}
                            </div>
                          )}
                          {loan.fundedAt && (
                            <div className="mb-2">
                              <strong>Funded:</strong> {formatDate(loan.fundedAt)}
                            </div>
                          )}
                          {loan.closedAt && (
                            <div>
                              <strong>Closed:</strong> {formatDate(loan.closedAt)}
                            </div>
                          )}
                        </dd>
                      </div>
                      
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <FiFileText className="mr-2" /> Documents
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {loadingDocuments ? (
                            <div className="text-center py-4">
                              <div className="animate-spin inline-block h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                            </div>
                          ) : documents.length === 0 ? (
                            <p className="text-gray-500">No documents submitted</p>
                          ) : (
                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                              {documents.map((doc) => (
                                <li 
                                  key={doc._id}
                                  className="pl-3 pr-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleViewDocument(doc._id)}
                                >
                                  <div className="w-0 flex-1 flex items-center">
                                    <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                    <span className="ml-2 flex-1 w-0 truncate">
                                      {doc.name}
                                    </span>
                                  </div>
                                  <div className="ml-4 flex-shrink-0 flex items-center">
                                    {doc.status === 'pending' && (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Needs Review
                                      </span>
                                    )}
                                    {doc.status === 'approved' && (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Approved
                                      </span>
                                    )}
                                    {doc.status === 'rejected' && (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Rejected
                                      </span>
                                    )}
                                    <FiChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                      
                      {loan.additionalNotes && (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {loan.additionalNotes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="bg-white shadow sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Take Action
                    </h3>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {loan.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openActionModal('approve')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal('reject')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => openActionModal('request_info')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            Request Information
                          </button>
                        </>
                      )}
                      
                      {loan.status === 'approved' && (
                        <button
                          onClick={() => openActionModal('fund')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                        >
                          Fund Loan
                        </button>
                      )}
                      
                      {loan.status === 'funded' && (
                        <button
                          onClick={() => openActionModal('close')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
                        >
                          Close Loan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {statusAction === 'approve' && 'Approve Loan'}
                        {statusAction === 'reject' && 'Reject Loan'}
                        {statusAction === 'request_info' && 'Request Additional Information'}
                        {statusAction === 'fund' && 'Fund Loan'}
                        {statusAction === 'close' && 'Close Loan'}
                      </h3>
                      <div className="mt-4">
                        {statusAction === 'approve' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Terms and Conditions
                            </label>
                            <textarea
                              name="terms"
                              value={actionData.terms}
                              onChange={handleActionChange}
                              rows={4}
                              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                              placeholder="Enter loan terms and any additional conditions..."
                            />
                          </div>
                        )}
                        
                        {statusAction === 'reject' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason for Rejection
                            </label>
                            <textarea
                              name="reason"
                              value={actionData.reason}
                              onChange={handleActionChange}
                              rows={4}
                              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                              placeholder="Explain why this loan application is being rejected..."
                            />
                          </div>
                        )}
                        
                        {statusAction === 'request_info' && (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Requested Items
                              </label>
                              <input
                                type="text"
                                name="requestedItems"
                                value={actionData.requestedItems}
                                onChange={handleActionChange}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g. bank statements, income verification (comma separated)"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message to Borrower
                              </label>
                              <textarea
                                name="message"
                                value={actionData.message}
                                onChange={handleActionChange}
                                rows={4}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Explain what additional information is needed and why..."
                              />
                            </div>
                          </>
                        )}
                        
                        {statusAction === 'fund' && (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Funding Amount
                              </label>
                              <input
                                type="number"
                                name="amount"
                                value={actionData.amount}
                                onChange={handleActionChange}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Funding Date
                              </label>
                              <input
                                type="date"
                                name="fundingDate"
                                value={actionData.fundingDate}
                                onChange={handleActionChange}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                              />
                            </div>
                          </>
                        )}
                        
                        {statusAction === 'close' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Closing Status
                            </label>
                            <select
                              name="closingStatus"
                              value={actionData.closingStatus}
                              onChange={handleActionChange}
                              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                              <option value="completed">Completed Successfully</option>
                              <option value="default">Defaulted</option>
                              <option value="pre_payment">Pre-payment</option>
                              <option value="refinanced">Refinanced</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={submitAction}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetail;
