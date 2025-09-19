import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

const SearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSort, 
  getSortIcon 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lenders by name or email..."
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onSort('name')}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm">Name</span>
            {getSortIcon('name')}
          </button>
          <button
            onClick={() => onSort('borrowerCount')}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm">Borrowers</span>
            {getSortIcon('borrowerCount')}
          </button>
          <button
            onClick={() => onSort('totalLoanAmount')}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm">Loan Volume</span>
            {getSortIcon('totalLoanAmount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
