import React from 'react';
import { DollarSign } from 'lucide-react';

const ProgramsHeader = ({ onNavigateToRates }) => {
  return (
    <div className="mb-8 flex justify-between items-start md:items-center flex-col md:flex-row">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Programs</h1>
        <p className="mt-2 text-gray-600">Manage your loan programs and their configurations</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNavigateToRates}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3 md:mt-0"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          View Rates
        </button>
      </div>
    </div>
  );
};

export default ProgramsHeader;
