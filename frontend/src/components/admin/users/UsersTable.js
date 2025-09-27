import React from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getRoleBadge = (role) => {
  const roleClasses = {
    admin: 'bg-purple-100 text-purple-800',
    lender: 'bg-blue-100 text-blue-800',
    borrower: 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
};

const getStatusBadge = (isActive) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {isActive ? 'active' : 'inactive'}
    </span>
  );
};

const getSortIcon = (column, sortBy, sortDirection) => {
  if (sortBy !== column) return null;

  return sortDirection === 'asc' ? (
    <ChevronDown className="w-4 h-4 ml-1" />
  ) : (
    <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
  );
};

const UsersTable = ({ 
  users, 
  sortBy, 
  sortDirection, 
  onSortChange, 
  onUserStatusChange 
}) => {
  return (
    <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 min-w-[940px]">
        <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('name')}>
            <div className="flex items-center">
              <span>User</span>
              {getSortIcon('name', sortBy, sortDirection)}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('role')}>
            <div className="flex items-center">
              <span>Role</span>
              {getSortIcon('role', sortBy, sortDirection)}
            </div>
          </div>
          <div className="col-span-2 flex items-center cursor-pointer" onClick={() => onSortChange('status')}>
            <div className="flex items-center">
              <span>Status</span>
              {getSortIcon('status', sortBy, sortDirection)}
            </div>
          </div>
          <div className="col-span-3 flex items-center cursor-pointer" onClick={() => onSortChange('date')}>
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
        {users.map((user) => (
          <div
            key={user._id}
            className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 items-center"
          >
            <div className="col-span-3 flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <span className="text-lg font-medium">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500 max-w-[160px] truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                {getRoleBadge(user.role)}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                {getStatusBadge(user.isActive)}
              </div>
            </div>

            <div className="col-span-3 flex items-center">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="col-span-2 flex justify-end items-center space-x-3">
              <button
                onClick={() => onUserStatusChange(user._id, !user.isActive)}
                className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                  user.isActive
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                }`}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersTable;
