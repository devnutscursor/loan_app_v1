import React from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, DollarSign, Calendar, ExternalLink } from 'lucide-react';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getSortIcon = (column, sortBy, sortDirection) => {
  if (sortBy !== column) return null;

  return sortDirection === 'asc' ? (
    <ChevronDown className="w-4 h-4 ml-1" />
  ) : (
    <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
  );
};

const LoansTable = ({ 
  loans, 
  sortBy, 
  sortDirection, 
  onSortChange 
}) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
          <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('borrower')}>
              <div className="flex items-center">
                <span>Borrower</span>
                {getSortIcon('borrower', sortBy, sortDirection)}
              </div>
            </div>
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('loanNumber')}>
              <div className="flex items-center">
                <span>Loan #</span>
                {getSortIcon('loanNumber', sortBy, sortDirection)}
              </div>
            </div>
            <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('amount')}>
              <div className="flex items-center">
                <span>Loan Amount</span>
                {getSortIcon('amount', sortBy, sortDirection)}
              </div>
            </div>
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('date')}>
              <div className="flex items-center">
                <span>Created</span>
                {getSortIcon('date', sortBy, sortDirection)}
              </div>
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-200 min-w-[940px]">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 items-center"
            >
              <div className="col-span-3 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <span className="text-lg font-medium">
                    {loan.borrowerDetails?.firstName?.charAt(0)}{loan.borrowerDetails?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="font-medium text-gray-900">
                    {loan.borrowerDetails?.firstName} {loan.borrowerDetails?.lastName}
                  </div>
                  <div className="text-sm text-gray-500 max-w-[160px] truncate">
                    {loan.borrowerDetails?.email}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>{loan.loanNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="col-span-3">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>${loan.loanDetails?.loanAmount?.toLocaleString() || '0'}</span>
                </div>
              </div>

              <div className="col-span-2 flex items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>{formatDate(loan.createdAt)}</span>
                </div>
              </div>
              <div className="col-span-2 flex justify-end items-center space-x-3">
                <Link href={`/lender/loans/${loan._id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                {/* Card Header - Borrower Info */}
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <span className="text-lg font-medium">
                      {loan.borrowerDetails?.firstName?.charAt(0)}{loan.borrowerDetails?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {loan.borrowerDetails?.firstName} {loan.borrowerDetails?.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate" title={loan.borrowerDetails?.email}>
                      {loan.borrowerDetails?.email}
                    </div>
                  </div>
                </div>

                {/* Card Content - Loan Details */}
                <div className="space-y-2">
                  {/* Loan Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Loan #</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {loan.loanNumber || 'N/A'}
                    </div>
                  </div>

                  {/* Loan Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Amount</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      ${loan.loanDetails?.loanAmount?.toLocaleString() || '0'}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Created</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatDate(loan.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Card Footer - Action Button */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/lender/loans/${loan._id}`}
                    className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LoansTable;
