import React from 'react';
import BorrowerScenario from './BorrowerScenario';
import { useRouter } from 'next/router';
import { CogIcon } from '@heroicons/react/outline';

export default function LoanConfigSection({ loanId, loanData }) {
  const router = useRouter();
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Configuration</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Qualification status and loan program settings
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => router.push('/lender/programs')}
        >
          <CogIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Manage Programs
        </button>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="p-0">
          <BorrowerScenario loanId={loanId} refreshTrigger={0} />
        </div>
      </div>
    </div>
  );
}
