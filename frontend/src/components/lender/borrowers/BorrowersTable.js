import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, Calendar, FileText, ExternalLink, Link2 } from 'lucide-react';

const BorrowersTable = ({ 
  filteredBorrowers, 
  borrowerLoans, 
  formatDate, 
  getSortIcon, 
  onSortChange,
  onLinkToGhl
}) => {
  const [linkingBorrowerIds, setLinkingBorrowerIds] = useState(() => new Set());

  const linkToGhl = async (borrower) => {
    const borrowerId = borrower?._id;
    if (!borrowerId || !onLinkToGhl) return;
    setLinkingBorrowerIds((prev) => new Set(prev).add(String(borrowerId)));
    try {
      await onLinkToGhl(borrower);
    } finally {
      setLinkingBorrowerIds((prev) => {
        const next = new Set(prev);
        next.delete(String(borrowerId));
        return next;
      });
    }
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg border border-gray-200 overflow-x-auto">
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
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      borrower?.ghlContactId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                    title={borrower?.ghlContactId || 'Not Linked'}
                  >
                    {borrower?.ghlContactId ? 'GHL Linked' : 'GHL Not Linked'}
                  </span>
                  {borrower?.ghlContactId ? (
                    <span
                      className="text-[11px] text-gray-500 max-w-[160px] truncate"
                      title={borrower?.ghlContactId}
                    >
                      {borrower?.ghlContactId}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => linkToGhl(borrower)}
                      disabled={linkingBorrowerIds.has(String(borrower?._id))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Link this borrower contact to GHL"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{linkingBorrowerIds.has(String(borrower?._id)) ? 'Linking...' : 'Link'}</span>
                    </button>
                  )}
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

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBorrowers.map((borrower) => (
            <div
              key={borrower._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                {/* Card Header - Borrower Info */}
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <span className="text-lg font-medium">
                      {borrower.user?.firstName?.charAt(0)}{borrower.user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {borrower.user?.firstName} {borrower.user?.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate" title={borrower.user?.email}>
                      {borrower.user?.email || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Card Content - Borrower Details */}
                <div className="space-y-2">
                  {/* Phone Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Phone</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {borrower.user?.phone || 'N/A'}
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Joined</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatDate(borrower.createdAt)}
                    </div>
                  </div>

                  {/* Loan Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Loans</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      {borrowerLoans[borrower._id] || 0}
                    </div>
                  </div>

                  {/* GHL Contact */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        borrower?.ghlContactId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {borrower?.ghlContactId ? 'GHL Linked' : 'GHL Not Linked'}
                      </span>
                    </div>
                    {borrower?.ghlContactId ? (
                      <div className="text-[11px] text-gray-700 max-w-[180px] truncate" title={borrower?.ghlContactId}>
                        {borrower?.ghlContactId}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => linkToGhl(borrower)}
                        disabled={linkingBorrowerIds.has(String(borrower?._id))}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Link this borrower contact to GHL"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        <span>{linkingBorrowerIds.has(String(borrower?._id)) ? 'Linking...' : 'Link'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Footer - Action Button */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Link
                      href={`/lender/loans?borrowerId=${borrower._id}`}
                      className="flex-1 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span>View Loans</span>
                    </Link>
                    {!borrower?.ghlContactId && (
                      <button
                        type="button"
                        onClick={() => linkToGhl(borrower)}
                        disabled={linkingBorrowerIds.has(String(borrower?._id))}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-emerald-700 border border-emerald-200 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Link this borrower contact to GHL"
                      >
                        <Link2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {linkingBorrowerIds.has(String(borrower?._id)) ? 'Linking...' : 'Link'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BorrowersTable;
