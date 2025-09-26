import React from 'react';
import { ArrowLeft, User } from 'lucide-react';

const LenderInfoHeader = ({ lenderData, onBack }) => (
  <div className="mb-8 flex justify-between items-start gap-4 flex-col">
    <div className="flex items-center space-x-4">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Lenders</span>
      </button>
    </div>
    {lenderData && (
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lenderData.name}'s Borrowers
            </h1>
            <p className="text-gray-600">{lenderData.email}</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default LenderInfoHeader;


