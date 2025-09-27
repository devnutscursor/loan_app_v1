import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilters = ({ 
  searchTerm, 
  filters, 
  onSearchChange, 
  onFilterChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center sm:justify-between gap-4 items-center sm:items-end">
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
            placeholder="Search by name or email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-4">
        <div>
          <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role-filter"
            value={filters.role}
            onChange={(e) => onFilterChange('role', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="all">All Roles</option>
            <option value="lender">Lender</option>
            <option value="borrower">Borrower</option>
            <option value="company">Company</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
