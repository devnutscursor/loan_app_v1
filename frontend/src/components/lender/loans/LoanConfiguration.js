import React, { useState, useEffect } from 'react';
import { Settings, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import BorrowerScenario from './BorrowerScenario';
import { fetchAPI } from '@/utils/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`loan-config-tabpanel-${index}`}
      aria-labelledby={`loan-config-tab-${index}`}
      className="py-4"
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function LoanConfiguration({ loanId }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigateToPrograms = () => {
    router.push('/lender/programs');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Loan Configuration
        </h2>
        <button
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleNavigateToPrograms}
        >
          <Settings className="mr-2 h-4 w-4" />
          Manage Programs
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="loan configuration tabs">
          <button
            className={`w-1/2 py-3 px-1 text-center border-b-2 text-sm font-medium ${activeTab === 0 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={(e) => handleChangeTab(e, 0)}
            role="tab"
            aria-selected={activeTab === 0}
            id="loan-config-tab-0"
            aria-controls="loan-config-tabpanel-0"
          >
            Borrower Scenario
          </button>
          <button
            className={`w-1/2 py-3 px-1 text-center border-b-2 text-sm font-medium ${activeTab === 1 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={(e) => handleChangeTab(e, 1)}
            role="tab"
            aria-selected={activeTab === 1}
            id="loan-config-tab-1"
            aria-controls="loan-config-tabpanel-1"
          >
            Loan Parameters
          </button>
        </nav>
      </div>

      <div className="my-4"></div>

      <TabPanel value={activeTab} index={0}>
        <BorrowerScenario 
          loanId={loanId} 
          refreshTrigger={refreshTrigger}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Configure loan parameters such as interest rate, terms, and fees specific to this loan.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 mt-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => router.push(`/lender/loans/${loanId}/parameters`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Set Loan Parameters
          </button>
        </div>
      </TabPanel>
    </div>
  );
}
