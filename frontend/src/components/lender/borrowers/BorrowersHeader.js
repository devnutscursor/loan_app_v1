import React from 'react';
import { UserPlus } from 'lucide-react';

const BorrowersHeader = ({ onAddNew }) => {
  return (
    <div className="mb-8 flex justify-between items-start sm:items-center flex-col sm:flex-row">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Borrowers</h1>
        <p className="mt-2 text-gray-600">Manage your borrowers and their loan applications</p>
      </div>
      
      <button
        onClick={onAddNew}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3 sm:mt-0"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add New
      </button>
    </div>
  );
};

export default BorrowersHeader;
