import React from 'react';
import Link from 'next/link';

const LoanCard = ({ loan, userRole = 'borrower' }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {loanPurpose}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
            {status}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          {loanAmount > 0 ? (
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(loanAmount)}</dd>
            </div>
          ) : (
            <div>
              <dt className="text-sm font-medium text-gray-500">Loan Number</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{loanNumber || "Not assigned"}</dd>
            </div>
          )}
          
          {loanTerm > 0 ? (
            <div>
              <dt className="text-sm font-medium text-gray-500">Term</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{loanTerm} years</dd>
            </div>
          ) : (
            <div>
              <dt className="text-sm font-medium text-gray-500">Loan Type</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{loanType}</dd>
            </div>
          )}
          
          {interestRate > 0 ? (
            <div>
              <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{interestRate}%</dd>
            </div>
          ) : borrowerName ? (
            <div>
              <dt className="text-sm font-medium text-gray-500">Borrower</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 truncate">{borrowerName}</dd>
            </div>
          ) : (
            <div>
              <dt className="text-sm font-medium text-gray-500">Property</dt>
              <dd className="mt-1 text-sm text-gray-900 truncate">{propertyInfo}</dd>
            </div>
          )}
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Application Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(applicationDate)}</dd>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
            <span>Application Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mt-5">
          <Link 
            href={getLinkPath()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;
