import React from 'react';
import { Search, X } from 'lucide-react';

const BorrowersSearchAndFilters = ({ 
  searchTerm, 
  activeFilter, 
  onSearchChange, 
  onFilterChange, 
  onClearFilters 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      {/* Search Bar */}
      <div className="relative flex-grow max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium 
            ${activeFilter === 'all'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('recent')}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium 
            ${activeFilter === 'recent'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('hasLoans')}
            className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
            ${activeFilter === 'hasLoans'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            With Loans
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowersSearchAndFilters;
