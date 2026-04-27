import React from 'react';
import Link from 'next/link';

const LoanCard = ({ loan, userRole = 'borrower' }) => {
  // Check if loan exists and has required properties
  if (!loan || !loan._id) {
    return null; // Don't render anything if loan is missing or invalid
  }
  
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      console.error('Invalid date:', dateString, e);
      return 'Invalid Date';
    }
  };
  
  const getStatusColorClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'application submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'clear to close':
      case 'conditional approval':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'funded':
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'underwriting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status for display
  const formatStatusForDisplay = (status) => {
    if (!status) return 'Unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'conditional approval') return 'Approved';
    if (statusLower === 'declined') return 'Denied';
    if (statusLower === 'underwriting') return 'Processing';
    
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getLinkPath = () => {
    switch (userRole) {
      case 'borrower':
        return `/borrower/loans/${loan._id}`;
      case 'lender':
        return `/lender/loans/${loan._id}`;
      case 'admin':
        return `/admin/loans/${loan._id}`;
      default:
        return '/';
    }
  };
  
  // Get loan purpose (fallback to loan type if purpose isn't available)
  const loanPurpose = loan.loanDetails?.loanPurpose || 'Loan Application';
  
  // Get loan amount from the correct location in the data structure
  const loanAmount = loan.loanDetails?.loanAmount || 0;
  
  // Get loan term from the data structure
  const loanTerm = loan.loanDetails?.loanTerm || 0;
  
  // Get interest rate from the data structure
  const interestRate = loan.loanDetails?.interestRate || 0;
  
  // Calculate progress based on completion percentage
  const progress = loan.completionPercentage || 0;
  
  // Get application date
  const applicationDate = loan.applicationDate || loan.createdAt;
  
  // Get status
  const status = loan.status || 'Processing';
  
  // Get alternative fields that are more likely to be available
  const loanNumber = loan.loanNumber || '';
  const loanType = loan.loanDetails?.loanType || 'Standard';
  const propertyAddress = loan.property?.address?.street || '';
  const propertyCity = loan.property?.address?.city || '';
  const propertyState = loan.property?.address?.state || '';
  const propertyInfo = propertyAddress ? 
    (propertyCity && propertyState ? 
      `${propertyAddress}, ${propertyCity}, ${propertyState}` : 
      propertyAddress) : 
    'Property details not available';
  
  // Get borrower name if available
  const borrowerName = loan.borrowerDetails?.fullName || 
                       loan.borrowerDetails?.firstName && loan.borrowerDetails?.lastName ? 
                       `${loan.borrowerDetails.firstName} ${loan.borrowerDetails.lastName}` : 
                       '';
  
  return (
    <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border border-gray-100">
      {/* Status ribbon */}
      <div className="relative">
        <div className={`absolute top-0 right-0 z-10 px-3 py-1.5 rounded-bl-lg font-medium text-xs ${getStatusColorClass(status)}`}>
          {formatStatusForDisplay(status)}
        </div>
      </div>

      {/* Card body with subtle gradient background */}
      <div className="p-5 bg-gradient-to-b from-white to-gray-50">
        {/* Loan info header */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            Loan# {loan.loanNumber}
          </h3>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(applicationDate)}</span>
          </div>
        </div>

        {/* Key loan details */}
        <div className="flex flex-wrap -mx-2">
          {/* Amount/Loan Number */}
          <div className="px-2 w-1/2 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 h-full">
              <dt className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                {loanAmount > 0 ? 'Amount' : 'Loan Number'}
              </dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">
                {loanAmount > 0 ? formatCurrency(loanAmount) : (loanNumber || "Not assigned")}
              </dd>
            </div>
          </div>

          {/* Term/Loan Type */}
          <div className="px-2 w-1/2 mb-4">
            <div className="p-3 rounded-lg bg-indigo-50 h-full">
              <dt className="text-xs font-medium text-indigo-700 uppercase tracking-wide">
                {loanTerm > 0 ? 'Term' : 'Loan Type'}
              </dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">
                {loanTerm > 0 ? `${loanTerm} years` : loanType}
              </dd>
            </div>
          </div>

          {/* Interest Rate/Borrower/Property */}
          <div className="px-2 w-1/2 mb-4">
            <div className="p-3 rounded-lg bg-purple-50 h-full">
              {interestRate > 0 ? (
                <>
                  <dt className="text-xs font-medium text-purple-700 uppercase tracking-wide">Interest Rate</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900">{interestRate}%</dd>
                </>
              ) : borrowerName ? (
                <>
                  <dt className="text-xs font-medium text-purple-700 uppercase tracking-wide">Borrower</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900 truncate">{borrowerName}</dd>
                </>
              ) : (
                <>
                  <dt className="text-xs font-medium text-purple-700 uppercase tracking-wide">Property</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 truncate">{propertyInfo}</dd>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="px-2 w-1/2 mb-4">
            <div className="p-3 rounded-lg bg-green-50 h-full">
              <dt className="text-xs font-medium text-green-700 uppercase tracking-wide flex justify-between items-center">
                <span>Progress</span>
                <span className="font-bold">{progress}%</span>
              </dt>
              <dd className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${progress > 66 ? 'bg-green-500' : progress > 33 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </dd>
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="mt-2 text-center">
          <Link 
            href={getLinkPath()}
            className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Loan Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;
