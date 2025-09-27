import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilters = ({ 
  searchTerm, 
  activeFilter, 
  selectedBorrower, 
  borrowers,
  onSearchChange, 
  onFilterChange, 
  onBorrowerChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center sm:items-end">
      {/* Search Bar */}
      <div className="relative flex-grow max-w-md w-full">
        <label htmlFor="search-input" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="search-input"
            type="text"
            placeholder="Search by borrower name or loan number..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-4">
        {/* Borrower Filter */}
        <div>
          <label htmlFor="borrower-filter" className="block text-sm font-medium text-gray-700">
            Borrower
          </label>
          <select
            id="borrower-filter"
            value={selectedBorrower}
            onChange={onBorrowerChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="all">All Borrowers</option>
            {borrowers.map((borrower) => (
              <option key={borrower._id} value={`${borrower.firstName} ${borrower.lastName}`}>
                {borrower.firstName} {borrower.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Dropdown */}
        <div>
          <label htmlFor="filter-dropdown" className="block text-sm font-medium text-gray-700">
            Filter
          </label>
          <select
            id="filter-dropdown"
            value={activeFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="all">All Loans</option>
            <option value="recent">Recent</option>
            <option value="highValue">High Value</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
