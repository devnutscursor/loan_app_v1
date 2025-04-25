import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { LoanService } from '../../../services';

const LoanDetails = () => {
  const router = useRouter();
  const { loanId } = router.query;
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't fetch until loanId is available
    if (!loanId) return;

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching loan details for ID:', loanId);

        const response = await LoanService.getLoan(loanId);
        console.log('Loan details response:', response);

        if (response.success) {
          // Extract loan data, handling different response structures
          const loanData = response.data?.loan || response.data.data;
          setLoan(loanData);
        } else {
          console.warn('Failed to fetch loan details:', response.message);
          setError(response.message || 'Failed to load loan details');
          toast.error(response.message || 'Failed to load loan details');
        }
      } catch (error) {
        console.error('Error fetching loan details:', error);
        setError('An error occurred while loading the loan details');
        toast.error('Failed to load loan details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [loanId]);

  const handleRemoveDocument = async (documentId) => {
    if (!documentId || !loanId) return;

    try {
      const confirmed = window.confirm('Are you sure you want to remove this document?');
      if (!confirmed) return;

      const response = await LoanService.removeDocument(loanId, documentId);
      
      if (response.success) {
        toast.success('Document removed successfully');
        // Update loan state to reflect the document removal
        setLoan(prevLoan => ({
          ...prevLoan,
          documents: prevLoan.documents.filter(doc => doc._id !== documentId)
        }));
      } else {
        toast.error(response.message || 'Failed to remove document');
      }
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document. Please try again.');
    }
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    status = status.toLowerCase();
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <ProtectedRoute roles={['borrower', 'admin']}>
      <MainLayout title={loan ? `Loan ${loan.loanNumber || ''}` : 'Loan Details'} noSidebarMargin={true}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                    Loan Details
                    {loan && loan.loanNumber && (
                      <span className="ml-2 text-sm font-medium text-gray-500">
                        ({loan.loanNumber})
                      </span>
                    )}
                  </h1>
                  <div className="mt-1 flex items-center">
                    <Link href="/borrower/loans" className="text-sm text-primary hover:text-primary-dark">
                      ← Back to loans
                    </Link>
                    {loan && loan.status && (
                      <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                {loan && (
                  <Link
                    href={`/borrower/apply?draft=${loan.loanNumber}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Edit Application
                  </Link>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading loan details</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : loan ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {/* Loan Summary Section */}
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Summary</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your loan application.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Loan Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan?.loanNumber || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan?.status || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Loan Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan?.loanDetails?.loanAmount) || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Loan Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan?.loanDetails?.loanType || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Property Value</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.property?.propertyValue)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.loanDetails?.purchasePrice) || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Down Payment</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.loanDetails?.downPayment) || 'N/A'}</dd>
                    </div>
                    {loan.loanDetails?.refinanceType && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Refinance Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{loan.loanDetails.refinanceType}</dd>
                      </div>
                    )}
                    {loan.loanDetails?.constructionType && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Construction Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{loan.loanDetails.constructionType}</dd>
                      </div>
                    )}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(loan.applicationDate || loan.createdAt)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Processing Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.processingStatus || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Completion Percentage</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.completionPercentage ? `${loan.completionPercentage}%` : 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Approval Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.approvalType || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Borrower Information Section */}
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Borrower Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and contact details for the primary borrower.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    {/* Borrower Details - Using the borrowerDetails field directly */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {loan?.borrowerDetails ? 
                          `${loan.borrowerDetails.firstName || ''} ${loan.borrowerDetails.middleName || ''} ${loan.borrowerDetails.lastName || ''}`.trim() : 
                          'N/A'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan?.borrowerDetails?.email || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan?.borrowerDetails?.phone || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {loan?.borrowerDetails?.currentAddress ? 
                          `${loan.borrowerDetails.currentAddress.streetAddress || ''}, ${loan.borrowerDetails.currentAddress.city || ''}, ${loan.borrowerDetails.currentAddress.state || ''} ${loan.borrowerDetails.currentAddress.zipCode || ''}`.trim() : 
                          'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Property Details Section */}
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Property Details</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about the property being financed.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Property Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {loan.property?.zipCode ? 
                          `${loan.property.address?.streetAddress || ''} ${loan.property.address?.aptSteNum || ''}, ${loan.property.address?.city || ''}, ${loan.property.address?.state || ''} ${loan.property.zipCode || ''}`.trim() : 
                          'N/A'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.propertyType || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Occupancy Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.occupancyType || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Number of Units</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.numberOfUnits || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Year Built</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.yearBuilt || 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Has Accepted Offer</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.hasAcceptedOffer ? 'Yes' : 'No'}</dd>
                    </div>
                    {loan.property?.hasAcceptedOffer && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Contract Purchase Price</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.property?.contractPurchasePrice)}</dd>
                      </div>
                    )}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Mixed Use Property</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.isMixedUse || 'No'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Manufactured Home</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.property?.isManufactured || 'No'}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Financial Details Section */}
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Financial Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Income, assets, and debt information.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Base Monthly Income</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.income?.baseIncome || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Overtime</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.income?.overtime || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Commissions</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.income?.commissions || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Bonuses</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.income?.bonuses || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Military Entitlements</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.income?.militaryEntitlements || 0)}</dd>
                    </div>
                    {Array.isArray(loan.income?.otherIncome) && loan.income?.otherIncome.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Other Income Sources</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <ul className="list-disc pl-5 space-y-1">
                            {loan.income.otherIncome.map((item, index) => (
                              <li key={index}>
                                {item.description}: {formatCurrency(item.amount || 0)}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Total Monthly Income</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.financialCalculations?.totalIncome || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Total Monthly Debt</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.financialCalculations?.totalDebts || 0)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Debt-to-Income Ratio</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.financialCalculations?.dti ? `${loan.financialCalculations.dti}%` : 'N/A'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Housing Ratio</dt>
                      <dd className="mt-1 text-sm text-gray-900">{loan.financialCalculations?.housingRatio ? `${loan.financialCalculations.housingRatio}%` : 'N/A'}</dd>
                    </div>
                    
                    {/* Additional expenses section */}
                    {Array.isArray(loan.expenses) && loan.expenses.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Monthly Expenses</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <ul className="list-disc pl-5 space-y-1">
                            {loan.expenses.map((expense, index) => (
                              <li key={index}>
                                {expense.expenseType}: {formatCurrency(expense.amount || 0)}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                {/* Properties Owned Section */}
                {loan.propertiesOwned && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Properties Owned</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about properties owned by the borrower.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Owns Property</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.propertiesOwned.ownsProperty ? 'Yes' : 'No'}</dd>
                        </div>
                        
                        {loan.propertiesOwned.ownsProperty && Array.isArray(loan.propertiesOwned.properties) && loan.propertiesOwned.properties.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Property Details</dt>
                            <dd className="mt-2">
                              {loan.propertiesOwned.properties.map((property, index) => (
                                <div key={index} className="mb-6 bg-gray-50 p-4 rounded-md">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Property {index + 1}</h4>
                                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Address: </span>
                                      <span className="text-sm text-gray-900">
                                        {property.propertyAddress ? 
                                          `${property.propertyAddress.streetAddress || ''} ${property.propertyAddress.apt || ''}, ${property.propertyAddress.city || ''}, ${property.propertyAddress.state || ''} ${property.propertyAddress.zipCode || ''}`.trim() : 
                                          'N/A'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Property Type: </span>
                                      <span className="text-sm text-gray-900">{property.propertyType || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Market Value: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.presentMarketValue || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Unpaid Balance: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.unpaidBalance || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Monthly Payment: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.monthlyPayment || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Monthly Costs: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.monthlyCosts || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Rental Income: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.grossRentalIncome || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">Net Income: </span>
                                      <span className="text-sm text-gray-900">{formatCurrency(property.netRentalIncome || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </dd>
                          </div>
                        )}
                        
                        {/* Current Housing Expenses */}
                        {loan.propertiesOwned.firstMortgage > 0 && (
                          <>
                            <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
                              <dt className="text-sm font-medium text-gray-600">Current Housing Expenses</dt>
                            </div>
                            {loan.propertiesOwned.firstMortgage > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">First Mortgage</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.firstMortgage)}</dd>
                              </div>
                            )}
                            {loan.propertiesOwned.rent > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">Rent</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.rent)}</dd>
                              </div>
                            )}
                            {loan.propertiesOwned.hazardInsurance > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">Hazard Insurance</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.hazardInsurance)}</dd>
                              </div>
                            )}
                            {loan.propertiesOwned.realEstateTaxes > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">Real Estate Taxes</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.realEstateTaxes)}</dd>
                              </div>
                            )}
                            {loan.propertiesOwned.mortgageInsurance > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">Mortgage Insurance</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.mortgageInsurance)}</dd>
                              </div>
                            )}
                            {loan.propertiesOwned.hoaDues > 0 && (
                              <div className="sm:col-span-1">
                                <dt className="text-xs font-medium text-gray-500">HOA Dues</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.propertiesOwned.hoaDues)}</dd>
                              </div>
                            )}
                          </>
                        )}
                      </dl>
                    </div>
                  </>
                )}
                
                {/* Military Service Section */}
                {loan.militaryService && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Military Service</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about military service history.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Military Service</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.militaryService.isMilitary ? 'Yes' : 'No'}</dd>
                        </div>
                        {loan.militaryService.isMilitary && (
                          <>
                            {loan.militaryService.serviceStatus && (
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Service Status</dt>
                                <dd className="mt-1 text-sm text-gray-900">{loan.militaryService.serviceStatus}</dd>
                              </div>
                            )}
                            {loan.militaryService.dateOfService && (
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Date of Service</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(loan.militaryService.dateOfService)}</dd>
                              </div>
                            )}
                          </>
                        )}
                      </dl>
                    </div>
                  </>
                )}
                
                {/* Declarations Section */}
                {loan.declarations && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Declarations</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Required declarations for the loan application.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Occupy as Primary Residence</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.occupyAsPrimary ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Previous Ownership Interest</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.hadOwnershipInterest ? 'Yes' : 'No'}</dd>
                        </div>
                        {loan.declarations.hadOwnershipInterest && (
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Property Type Owned</dt>
                            <dd className="mt-1 text-sm text-gray-900">{loan.declarations.ownedPropertyType || 'N/A'}</dd>
                          </div>
                        )}
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Title Holding Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.titleHoldingType || 'N/A'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">First-Time Homebuyer</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.firstTimeBuyer ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Borrowing Additional Money</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.borrowingMoney ? 'Yes' : 'No'}</dd>
                        </div>
                        {loan.declarations.borrowingMoney && loan.declarations.borrowingMoneyAmount > 0 && (
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Additional Amount</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(loan.declarations.borrowingMoneyAmount)}</dd>
                          </div>
                        )}
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Co-Signer on Other Loans</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.coSigner ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Outstanding Judgements</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.outstandingJudgements ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Declared Bankruptcy</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.declaredBankruptcy ? 'Yes' : 'No'}</dd>
                        </div>
                        {loan.declarations.declaredBankruptcy && loan.declarations.bankruptcyType && (
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Bankruptcy Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">{loan.declarations.bankruptcyType}</dd>
                          </div>
                        )}
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Property Foreclosed</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.propertyForeclosed ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Party to Lawsuit</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.declarations.partyToLawsuit ? 'Yes' : 'No'}</dd>
                        </div>
                      </dl>
                    </div>
                  </>
                )}
                
                {/* Demographics Section */}
                {loan.demographics && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Demographics</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Demographic information (optional).</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Ethnicity</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.demographics.ethnicity || 'Not Provided'}</dd>
                        </div>
                        {loan.demographics.origin && (
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Origin</dt>
                            <dd className="mt-1 text-sm text-gray-900">{loan.demographics.origin}</dd>
                          </div>
                        )}
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Race</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.demographics.race || 'Not Provided'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Gender</dt>
                          <dd className="mt-1 text-sm text-gray-900">{loan.demographics.gender || 'Not Provided'}</dd>
                        </div>
                      </dl>
                    </div>
                  </>
                )}

                {/* Documents Section */}
                {loan.documents && loan.documents.length > 0 && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Documents</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Documents submitted with your application.</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <ul role="list" className="divide-y divide-gray-200">
                        {loan.documents.map((doc) => (
                          <li key={doc._id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.originalname || doc.name || 'Document'}</p>
                                <p className="text-xs text-gray-500">{doc.documentType || 'Uploaded document'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {doc.url && (
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                  View
                                </a>
                              )}
                              <button
                                onClick={() => handleRemoveDocument(doc._id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Loan Officer Notes (if assigned) */}
                {loan.lenderNotes && loan.lenderNotes.length > 0 && (
                  <>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Officer Notes</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Feedback from your loan officer.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <div className="flow-root">
                        <ul role="list" className="-mb-8">
                          {loan.lenderNotes.map((note, idx) => (
                            <li key={idx}>
                              <div className="relative pb-8">
                                {idx !== loan.lenderNotes.length - 1 ? (
                                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex items-start space-x-3">
                                  <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                                      <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div>
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-900">Loan Officer</span>
                                      </div>
                                      <p className="mt-0.5 text-sm text-gray-500">
                                        {formatDate(note.date || note.createdAt)}
                                      </p>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700">
                                      <p>{note.text || note.content}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loan found</h3>
                <p className="mt-1 text-sm text-gray-500">This loan doesn't exist or you don't have permission to view it.</p>
                <div className="mt-6">
                  <Link
                    href="/borrower/loans"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Return to Loans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
