import React from 'react';
import { ArrowLeft } from 'lucide-react';

const BorrowerHeader = ({ borrowerInfo, onBack }) => (
  <>
    <div className="mb-8 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Borrowers</span>
        </button>
      </div>
    </div>
    {borrowerInfo && (
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-600">
              {borrowerInfo.user?.firstName?.charAt(0)}{borrowerInfo.user?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {borrowerInfo.user?.firstName} {borrowerInfo.user?.lastName}'s Loans
            </h1>
            <p className="text-gray-600">{borrowerInfo.user?.email}</p>
          </div>
        </div>
      </div>
    )}
  </>
);

export default BorrowerHeader;


