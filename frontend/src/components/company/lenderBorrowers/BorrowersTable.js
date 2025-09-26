import React from 'react';
import { Mail, Phone, Calendar, FileText, ChevronDown, ExternalLink } from 'lucide-react';

const BorrowersTable = ({ borrowers, sortBy, getSortIcon, onSortChange, onViewLoans, formatDate }) => (
  <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
    {/* Table Header */}
    <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
      <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('name')}>
          <div className="flex items-center">
            <span>Borrower Name</span>
            {getSortIcon('name') === 'asc' ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : getSortIcon('name') === 'desc' ? (
              <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
            ) : null}
          </div>
        </div>
        <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('email')}>
          <div className="flex items-center">
            <span>Contact Info</span>
            {getSortIcon('email') === 'asc' ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : getSortIcon('email') === 'desc' ? (
              <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
            ) : null}
          </div>
        </div>
        <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('date')}>
          <div className="flex items-center">
            <span>Joined Date</span>
            {getSortIcon('date') === 'asc' ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : getSortIcon('date') === 'desc' ? (
              <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
            ) : null}
          </div>
        </div>
        <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('loans')}>
          <div className="flex items-center">
            <span>Loans</span>
            {getSortIcon('loans') === 'asc' ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : getSortIcon('loans') === 'desc' ? (
              <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
            ) : null}
          </div>
        </div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
    </div>

    {/* Table Content */}
    <div className="divide-y divide-gray-200 min-w-[940px]">
      {borrowers.map((borrower) => (
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
            <div className="flex items-center text-sm text-gray-500 mb-1 max-w-[200px] truncate" title={`${borrower.user?.email}`}>
              <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>{borrower.user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>{borrower.user?.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="col-span-2 flex items-center">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>{formatDate(borrower.user?.createdAt)}</span>
            </div>
          </div>

          <div className="col-span-2 flex items-center">
            <div className="flex items-center">
              <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {borrower.loanCount || 0} loans
              </span>
            </div>
          </div>

          <div className="col-span-2 flex justify-end items-center space-x-3">
            <button
              onClick={() => onViewLoans(borrower._id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span>View Loans</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BorrowersTable;


