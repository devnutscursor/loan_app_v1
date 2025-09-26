import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  sortOrder,
  onSortByChange,
  onSortOrderChange,
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
          placeholder="Search loan officers by name or email..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {/* Sort Dropdowns */}
      <div className="flex gap-2">
        <div className="inline-flex rounded-md shadow-sm">
          <select
            value={sortBy}
            onChange={onSortByChange}
            className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="borrowerCount">Borrowers</option>
            <option value="totalLoanAmount">Loan Volume</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <select
            value={sortOrder}
            onChange={onSortOrderChange}
            className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-l-0 border-gray-300 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
