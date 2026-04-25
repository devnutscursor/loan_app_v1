import React, { useState } from 'react';
import { 
  Users, 
  Eye,
  User,
  DollarSign,
  Phone,
  Mail,
  Link2
} from 'lucide-react';

const LendersTable = ({ 
  lenders, 
  onSort, 
  onViewStats, 
  onViewBorrowers,
  onLinkToGhl
}) => {
  const [linkingUserIds, setLinkingUserIds] = useState(() => new Set());

  const linkToGhl = async (lender) => {
    const userId = lender?.user?.id;
    if (!userId || !onLinkToGhl) return;
    setLinkingUserIds((prev) => new Set(prev).add(String(userId)));
    try {
      await onLinkToGhl(lender);
    } finally {
      setLinkingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    }
  };

  if (lenders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No lenders found</h3>
        <p className="text-gray-600 mb-4">
          No lenders have been added to your company yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 min-w-[1000px]">
          <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSort('name')}>
              <div className="flex items-center">
                <span>Loan Officer Name</span>
              </div>
            </div>
            <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSort('email')}>
              <div className="flex items-center">
                <span>Contact Info</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSort('borrowerCount')}>
              <div className="flex items-center">
                <span>Borrowers</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSort('totalLoanAmount')}>
              <div className="flex items-center">
                <span>Loan Volume</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-center">Actions</div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-200 min-w-[1000px]">
          {lenders.map((lender) => (
            <div
              key={lender?.user?.id}
              className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="col-span-3 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <div className="font-medium text-gray-900">
                    {lender?.user?.name || `${lender?.user?.firstName} ${lender?.user?.lastName}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lender?.user?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {lender?.user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-3">
                <div className="flex items-center text-sm text-gray-500 mb-1 max-w-[160px] truncate" title={`${lender?.user?.email}`}>
                  <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 " />
                  <span>{lender?.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>{lender?.user?.phone || 'N/A'}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      lender?.user?.ghlUserId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                    title={lender?.user?.ghlUserId || 'Not Linked'}
                  >
                    {lender?.user?.ghlUserId ? 'GHL Linked' : 'GHL Not Linked'}
                  </span>
                  {lender?.user?.ghlUserId ? (
                    <span
                      className="text-[11px] text-gray-500 max-w-[160px] truncate"
                      title={lender?.user?.ghlUserId}
                    >
                      {lender?.user?.ghlUserId}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => linkToGhl(lender)}
                      disabled={linkingUserIds.has(String(lender?.user?.id))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Link this loan officer to GHL"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{linkingUserIds.has(String(lender?.user?.id)) ? 'Linking...' : 'Link'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-center">
                <div className="flex items-center">
                  <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {lender?.metrics?.borrowerCount || 0} borrowers
                  </span>
                </div>
              </div>

              <div className="col-span-2 flex items-center">
                <div className="flex items-center">
                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {lender?.metrics?.totalLoanAmount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>

              <div className="col-span-2 flex justify-end items-center gap-4 whitespace-nowrap">
                <button
                  onClick={() => onViewStats(lender?.id)}
                  className="text-sm text-primary hover:text-primary-dark font-medium flex items-center"
                  title="View Stats"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  <span>Stats</span>
                </button>
                <button
                  onClick={() => onViewBorrowers(lender?.id)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center"
                  title="View Borrowers"
                >
                  <Users className="h-4 w-4 mr-1" />
                  <span>Borrowers</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lenders.map((lender) => (
            <div
              key={lender?.user?.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                {/* Card Header - Lender Info */}
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {lender?.user?.name || `${lender?.user?.firstName} ${lender?.user?.lastName}`}
                    </div>
                    <div className="text-sm text-gray-500 truncate" title={lender?.user?.email}>
                      {lender?.user?.email || 'N/A'}
                    </div>
                  </div>
                  <div className="ml-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lender?.user?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {lender?.user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Card Content - Lender Details */}
                <div className="space-y-2">
                  {/* Phone Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Phone</span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {lender?.user?.phone || 'N/A'}
                    </div>
                  </div>

                  {/* Borrowers Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Borrowers</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      {lender?.metrics?.borrowerCount || 0}
                    </div>
                  </div>

                  {/* Loan Volume */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>Loan Volume</span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      ${lender?.metrics?.totalLoanAmount?.toLocaleString() || '0'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span>GHL ID</span>
                    </div>
                    <div className="flex items-center gap-2 max-w-[220px]">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          lender?.user?.ghlUserId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                        title={lender?.user?.ghlUserId || 'Not Linked'}
                      >
                        {lender?.user?.ghlUserId ? 'Linked' : 'Not Linked'}
                      </span>
                      <span
                        className="text-xs text-gray-900 font-medium truncate"
                        title={lender?.user?.ghlUserId || 'Not Linked'}
                      >
                        {lender?.user?.ghlUserId || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {!lender?.user?.ghlUserId ? (
                    <button
                      onClick={() => linkToGhl(lender)}
                      disabled={linkingUserIds.has(String(lender?.user?.id))}
                      className="w-full mb-2 flex items-center justify-center text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 font-medium text-sm rounded-lg py-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-200"
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      <span>{linkingUserIds.has(String(lender?.user?.id)) ? 'Linking...' : 'Link to GHL'}</span>
                    </button>
                  ) : null}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewStats(lender?.id)}
                      className="flex-1 flex items-center justify-center text-primary hover:text-primary-dark hover:bg-primary/10 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Stats</span>
                    </button>
                    <button
                      onClick={() => onViewBorrowers(lender?.id)}
                      className="flex-1 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium text-sm rounded-lg py-2 transition-all duration-200"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span>Borrowers</span>
                    </button>
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

export default LendersTable;
