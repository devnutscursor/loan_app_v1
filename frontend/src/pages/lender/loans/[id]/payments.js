import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { FiDollarSign, FiArrowLeft, FiPlus, FiCalendar, FiFileText } from 'react-icons/fi';
import MainLayout from '../../../../components/layout/MainLayout';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { LoanService, NotificationService } from '../../../../services';

const PaymentTracking = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    if (id) {
      loadLoanData();
      loadPayments();
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

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const response = await LoanService.getLoanPayments(id, filters);
      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error(response.message || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Error loading payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadPayments();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: ''
    });
    
    // Load payments with reset filters
    setTimeout(loadPayments, 0);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setNewPayment({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: ''
    });
  };

  const submitPayment = async () => {
    try {
      if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }
      
      const paymentData = {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        loanId: id
      };
      
      const response = await LoanService.recordPayment(id, paymentData);
      
      if (response.success) {
        toast.success('Payment recorded successfully');
        loadPayments();
        
        // Create notification for borrower
        await NotificationService.createNotification({
          recipient: loan.borrower._id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `A payment of ${formatCurrency(parseFloat(newPayment.amount))} has been recorded for your loan.`,
          relatedItem: {
            type: 'loan',
            id: id
          }
        });
        
        closePaymentModal();
      } else {
        toast.error(response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error recording payment');
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      check: 'Check',
      cash: 'Cash',
      direct_debit: 'Direct Debit',
      online_payment: 'Online Payment'
    };
    
    return methodMap[method] || method;
  };

  return (
    <ProtectedRoute allowedRoles={['lender']}>
      <MainLayout title={`Loan Payments`}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push(`/lender/loans/${id}`)}
                className="flex items-center text-primary hover:text-primary-dark"
              >
                <FiArrowLeft className="mr-1" /> Back to Loan Details
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : !loan ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">Loan not found</p>
              </div>
            ) : (
              <>
                {/* Loan Summary */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Loan Summary
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Loan ID: {loan._id}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <FiDollarSign className="mr-1" /> Loan Amount
                        </h4>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(loan.loanAmount)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <FiCalendar className="mr-1" /> Term
                        </h4>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {loan.term} {loan.term === 1 ? 'month' : 'months'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <FiFileText className="mr-1" /> Status
                        </h4>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment History */}
                <div className="bg-white shadow sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Payment History
                    </h3>
                    
                    {loan.status === 'funded' && (
                      <button
                        onClick={openPaymentModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                      >
                        <FiPlus className="mr-1" /> Record Payment
                      </button>
                    )}
                  </div>
                  
                  {/* Payment Filters */}
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={filters.startDate}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={filters.endDate}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-md p-2"
                        >
                          <option value="">All Statuses</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex space-x-2">
                          <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                          >
                            Apply
                          </button>
                          <button
                            onClick={resetFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment List */}
                  {loadingPayments ? (
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6 text-center">
                      <p className="text-gray-500">No payments found</p>
                    </div>
                  ) : (
                    <div className="border-t border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reference
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getPaymentMethodLabel(payment.method)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.reference || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(payment.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Payment Summary */}
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Payment Summary
                    </h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Total Loan Amount</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(loan.loanAmount)}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Total Paid</dt>
                            <dd className="mt-1 text-sm font-semibold text-green-600">
                              {formatCurrency(payments.reduce((sum, payment) => sum + (payment.status === 'completed' ? payment.amount : 0), 0))}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                            <dd className="mt-1 text-sm font-semibold text-red-600">
                              {formatCurrency(
                                loan.loanAmount - payments.reduce((sum, payment) => sum + (payment.status === 'completed' ? payment.amount : 0), 0)
                              )}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Payment Progress</dt>
                            <dd className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-primary h-3 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(
                                      100, 
                                      (payments.reduce((sum, payment) => sum + (payment.status === 'completed' ? payment.amount : 0), 0) / loan.loanAmount) * 100
                                    )}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-500 mt-1 block">
                                {Math.min(
                                  100, 
                                  Math.round((payments.reduce((sum, payment) => sum + (payment.status === 'completed' ? payment.amount : 0), 0) / loan.loanAmount) * 100)
                                )}% Complete
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Payment Activity</h4>
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900">{payments.length}</span>
                            <span className="text-xs text-gray-500">Total Payments</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-green-600">
                              {payments.filter(p => p.status === 'completed').length}
                            </span>
                            <span className="text-xs text-gray-500">Completed</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-yellow-600">
                              {payments.filter(p => p.status === 'pending').length}
                            </span>
                            <span className="text-xs text-gray-500">Pending</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-red-600">
                              {payments.filter(p => p.status === 'failed').length}
                            </span>
                            <span className="text-xs text-gray-500">Failed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Record Payment Modal */}
        {showPaymentModal && (
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
                        Record New Payment
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Amount*
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="amount"
                              value={newPayment.amount}
                              onChange={handlePaymentChange}
                              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date*
                          </label>
                          <input
                            type="date"
                            name="paymentDate"
                            value={newPayment.paymentDate}
                            onChange={handlePaymentChange}
                            className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method*
                          </label>
                          <select
                            name="method"
                            value={newPayment.method}
                            onChange={handlePaymentChange}
                            className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="check">Check</option>
                            <option value="cash">Cash</option>
                            <option value="direct_debit">Direct Debit</option>
                            <option value="online_payment">Online Payment</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference Number
                          </label>
                          <input
                            type="text"
                            name="reference"
                            value={newPayment.reference}
                            onChange={handlePaymentChange}
                            className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g. Transaction ID, Check Number"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={newPayment.notes}
                            onChange={handlePaymentChange}
                            rows={3}
                            className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Any additional payment details"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={submitPayment}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={closePaymentModal}
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

export default PaymentTracking;
