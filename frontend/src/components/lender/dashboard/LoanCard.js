import React from 'react';
import { ChevronRight } from 'lucide-react';

const LoanCard = ({ loan, onView }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Status styling
  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'application submitted':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
      case 'clear to close':
      case 'conditional approval':
        return "bg-green-100 text-green-800";
      case 'rejected':
      case 'declined':
        return "bg-red-100 text-red-800";
      case 'funded':
      case 'closed':
        return "bg-blue-100 text-blue-800";
      case 'processing':
      case 'underwriting':
        return "bg-purple-100 text-purple-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
              {loan.borrowerDetails?.firstName?.charAt(0) || "B"}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{loan.borrowerDetails?.firstName} {loan.borrowerDetails?.lastName}</h4>
              <p className="text-xs text-gray-500">Loan# {loan.loanNumber || "Loan"}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(loan.status)}`}>
            {loan.status?.toLowerCase() === 'conditional approval'
              ? 'Approved'
              : loan.status?.toLowerCase() === 'declined'
                ? 'Denied'
                : loan.status?.toLowerCase() === 'underwriting'
                  ? 'Processing'
                  : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || 'Status'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">
              {(() => {
                const ld = loan.loanDetails || {};
                const lp = loan.loanParameters || {};
                // For Purchase loans, always derive from purchasePrice − downPayment
                if (ld.loanType === 'Purchase' && ld.purchasePrice) {
                  const pp = parseFloat(ld.purchasePrice) || 0;
                  const dp = parseFloat(ld.downPayment) || 0;
                  return formatCurrency(pp - dp);
                }
                // For Refinance, use requestedLoanAmount
                if ((ld.loanType === 'Refinance' || ld.loanType === 'Cash-Out Refinance') && ld.requestedLoanAmount) {
                  return formatCurrency(ld.requestedLoanAmount);
                }
                // Fallback to stored loanAmount fields
                return formatCurrency(
                  ld.loanAmount || ld.requestedLoanAmount || lp.loanAmount
                );
              })()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Program</p>
            <p className="font-semibold text-gray-900">{loan.loanDetails?.programType || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Applied</p>
            <p className="font-semibold text-gray-900">{formatDate(loan.createdAt)}</p>
          </div>
        </div>
        
        <button
          onClick={() => onView(loan._id)}
          className="w-full mt-2 flex items-center justify-center py-1.5 px-3 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          View Details
          <ChevronRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default LoanCard;
