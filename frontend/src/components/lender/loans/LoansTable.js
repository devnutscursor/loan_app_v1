import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  DollarSign,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const LoansTable = ({
  loans,
  sortBy,
  sortDirection,
  onSortChange,
  getSortIcon
}) => {
  return (
    <div className="bg-gray-50 shadow overflow-hidden rounded-lg border border-gray-200 overflow-x-auto">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 min-w-[910px]">
        <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[910px]">
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('borrower')}>
            <div className="flex items-center">
              <span>Borrower</span>
              {getSortIcon('borrower')}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('loanNumber')}>
            <div className="flex items-center">
              <span>Loan #</span>
              {getSortIcon('loanNumber')}
            </div>
          </div>
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('amount')}>
            <div className="flex items-center">
              <span>Loan Amount</span>
              {getSortIcon('amount')}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('date')}>
            <div className="flex items-center">
              <span>Created</span>
              {getSortIcon('date')}
            </div>
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200">
        {loans.map((loan) => (
          <div
            key={loan._id}
            className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 items-center min-w-[910px]"
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
                <div className="text-sm text-gray-500">
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
  );
};

export default LoansTable;
