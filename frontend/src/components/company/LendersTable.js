import React from 'react';
import { 
  Users, 
  Eye,
  User,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';

const LendersTable = ({ 
  lenders, 
  onSort, 
  onViewStats, 
  onViewBorrowers,
}) => {
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
    <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
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

            <div className="col-span-2 flex justify-end items-center space-x-3">
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
  );
};

export default LendersTable;
