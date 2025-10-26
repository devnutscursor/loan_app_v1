import React from 'react';
import Link from 'next/link';
import { Save } from 'lucide-react';

const RatesHeader = ({ saving, loading, onSaveRates }) => {
  return (
    <div className="flex items-center justify-between mb-3 min-h-[2.5rem]">
      {/* Left content area with back button and title */}
      <div className="flex items-center space-x-3">
        <Link
          href="/lender/programs"
          className="group flex items-center px-2.5 py-1.5 rounded hover:bg-gray-100 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 group-hover:text-primary transition"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
            Go Back
          </span>
        </Link>

        <span className="block w-px h-5 bg-gray-200"></span>

        <div className="flex flex-row justify-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-none">
            Program Loan Rates
          </h1>
        </div>
      </div>

      {/* Save button hidden for lenders - rates are read-only */}
      <button
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
        onClick={onSaveRates}
        disabled={saving || loading}
        style={{ display: 'none' }} // Hide save button for lenders
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save All Rates"}
      </button>
    </div>
  );
};

export default RatesHeader;
