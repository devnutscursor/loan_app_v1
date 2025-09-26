import React from 'react';
import { Users, Search, X } from 'lucide-react';

export const NoBorrowers = () => (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
      <Users className="h-8 w-8" />
    </div>
    <h3 className="mt-4 text-lg font-medium text-gray-900">No borrowers yet</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
      This lender doesn't have any borrowers associated with them yet.
    </p>
  </div>
);

export const NoResults = ({ onClear }) => (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600">
      <Search className="h-8 w-8" />
    </div>
    <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
    <p className="mt-2 text-sm text-gray-500">
      No borrowers match your search criteria. Try adjusting your search or filters.
    </p>
    <div className="mt-6">
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <X className="h-5 w-5 mr-2" aria-hidden="true" />
        Clear Filters
      </button>
    </div>
  </div>
);


