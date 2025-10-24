import React from 'react';
import { DollarSign, Plus } from 'lucide-react';

const ProgramsHeader = ({ onManageRates, onCreateProgram }) => (
  <div className="mb-8 flex flex-col lg:flex-row justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Loan Programs</h1>
      <p className="mt-2 text-gray-600">Manage loan programs and their configurations for all lenders in your company</p>
    </div>
    <div className="flex gap-3 mt-5 lg:mt-0">
      <button
        onClick={onManageRates}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Manage Rates
      </button>
      <button
        onClick={onCreateProgram}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Program
      </button>
    </div>
  </div>
);

export default ProgramsHeader;


