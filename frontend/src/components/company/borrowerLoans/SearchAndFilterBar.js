import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilterBar = ({ searchTerm, onSearchChange, activeFilter, onFilterChange }) => (
  <div className="flex flex-col sm:flex-row justify-between gap-4">
    <div className="relative flex-grow max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search by loan number, status or amount..."
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        value={searchTerm}
        onChange={onSearchChange}
      />
    </div>
    <div className="flex gap-2">
      <div className="inline-flex rounded-md shadow-sm">
        <button type="button" onClick={() => onFilterChange('all')} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white shadow-md text-sm font-medium ${activeFilter === 'all' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          All
        </button>
        <button type="button" onClick={() => onFilterChange('pending')} className={`relative inline-flex items-center px-4 py-2 border-t border border-gray-300 bg-white  shadow-md text-sm font-medium ${activeFilter === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          Pending
        </button>
        <button type="button" onClick={() => onFilterChange('approved')} className={`relative inline-flex items-center px-4 py-2 border-t border border-gray-300 bg-white shadow-md text-sm font-medium ${activeFilter === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          Approved
        </button>
        <button type="button" onClick={() => onFilterChange('rejected')} className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${activeFilter === 'rejected' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          Denied
        </button>
      </div>
    </div>
  </div>
);

export default SearchAndFilterBar;


