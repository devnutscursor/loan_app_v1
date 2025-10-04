import React from 'react';
import Link from 'next/link';
import { FileText, Calendar, DollarSign, ChevronDown, ExternalLink } from 'lucide-react';

const LoansTable = ({ loans, borrowerId, lenderId, onSortChange, getSortIcon, getStatusColor, formatDate }) => (
  <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
    <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
      <div className="grid grid-cols-12 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-3 flex items-center justify-center cursor-pointer" onClick={() => onSortChange('number')}>
          <div className="flex items-center">
            <span>Loan Number</span>
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-center cursor-pointer" onClick={() => onSortChange('status')}>
          <div className="flex items-center">
            <span className="mx-auto">Status</span>
          </div>
        </div>
        <div className="col-span-3 flex items-center justify-center cursor-pointer" onClick={() => onSortChange('amount')}>
          <div className="flex items-center">
            <span>Loan Amount</span>
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-center cursor-pointer" onClick={() => onSortChange('date')}>
          <div className="flex items-center justify-center">
            <span className='text-center'>Created Date</span>
          </div>
        </div>
        <div className="col-span-2 text-center">Actions</div>
      </div>
    </div>
    <div className="divide-y divide-gray-200 min-w-[940px]">
      {loans.map((loan) => (
        <div key={loan._id} className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
          <div className="col-span-3 flex items-center justify-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900">{loan.loanNumber || 'N/A'}</div>
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
              {loan.status || 'N/A'}
            </span>
          </div>
          <div className="col-span-3 flex items-center justify-center">
            <div className="flex items-center text-sm text-gray-500">
              <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 items-center justify-center" />
              <span>{loan.loanDetails?.loanAmount?.toLocaleString() || '0'}</span>
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>{formatDate(loan.createdAt)}</span>
            </div>
          </div>
          <div className="col-span-2 flex justify-center items-center space-x-3">
            <Link href={`/lender/loans/${loan._id}?backUrl=/company/lender-borrowers/${borrowerId}/loans${lenderId ? `?lenderId=${lenderId}` : ''}&isCompanyView=true`} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
              <ExternalLink className="h-4 w-4 mr-1" />
              <span>View Details</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoansTable;


