import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Calendar, FileText, ExternalLink } from 'lucide-react';

const BorrowersTable = ({ 
  filteredBorrowers, 
  borrowerLoans, 
  formatDate, 
  getSortIcon, 
  onSortChange 
}) => {
  return (
    <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200 overflow-x-auto">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 min-w-[850px]">
        <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('name')}>
            <div className="flex items-center">
              <span>Borrower Name</span>
              {getSortIcon('name')}
            </div>
          </div>
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('email')}>
            <div className="flex items-center">
              <span>Contact Info</span>
              {getSortIcon('email')}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('date')}>
            <div className="flex items-center">
              <span>Joined Date</span>
              {getSortIcon('date')}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('loans')}>
            <div className="flex items-center">
              <span>Loans</span>
              {getSortIcon('loans')}
            </div>
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200 min-w-[850px]">
        {filteredBorrowers.map((borrower) => (
          <div
            key={borrower._id}
            className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="col-span-3 flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <span className="text-lg font-medium">
                  {borrower.user?.firstName?.charAt(0)}{borrower.user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">
                  {borrower.user?.firstName} {borrower.user?.lastName}
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span title={borrower.user?.email} className="max-w-40 truncate">{borrower.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{borrower.user?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="col-span-2 flex items-center">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{formatDate(borrower.createdAt)}</span>
              </div>
            </div>

            <div className="col-span-2 flex items-center">
              <div className="flex items-center">
                <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {borrowerLoans[borrower._id] || 0} loans
                </span>
              </div>
            </div>

            <div className="col-span-2 flex justify-end items-center space-x-3">
              <Link href={`/lender/loans?borrowerId=${borrower._id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                <span>View Loans</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BorrowersTable;
