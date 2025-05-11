import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import Link from 'next/link';

export default function BorrowerScenarioTailwind({ loanId, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qualification, setQualification] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    if (loanId) {
      fetchPrograms();
      fetchLoanDetails();
    }
  }, [loanId, refreshTrigger]);

  const fetchPrograms = async () => {
    try {
      const response = await fetchAPI('/loan-programs');
      if (response.status === 'success') {
        setPrograms(response.data.filter(p => p.isAvailableToBorrower));
      } else {
        setError('Failed to load loan programs');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan programs');
    }
  };

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      
      // Get loan details first
      const loanResponse = await fetchAPI(`/loans/${loanId}`);
      if (loanResponse.status !== 'success') {
        setError('Failed to load loan details');
        return;
      }
      
      // Extract loan data including the loanParameters
      const loanData = loanResponse.data?.data?.loan || loanResponse.data?.data || loanResponse.data;
      const savedProgramId = loanData?.loanParameters?.selectedProgramId;
      
      // Calculate qualification for the program
      const availablePrograms = programs.length > 0 ? programs : await fetchDefaultPrograms();
      
      if (availablePrograms.length === 0) {
        setError('No loan programs available');
        return;
      }
      
      // Use the saved program ID if it exists, otherwise use the first program as default
      let programToUse;
      
      if (savedProgramId) {
        // Try to find the saved program in available programs
        programToUse = availablePrograms.find(p => p._id === savedProgramId);
        console.log('[DEBUG] Using saved program ID:', savedProgramId);
      }
      
      // Fall back to first program if saved ID not found
      if (!programToUse) {
        programToUse = availablePrograms[0];
        console.log('[DEBUG] Using first available program as fallback');
      }
      
      const qualificationResponse = await fetchAPI(`/loan-programs/qualification/${loanId}/${programToUse._id}`);
      
      if (qualificationResponse.status === 'success') {
        setQualification(qualificationResponse.data);
        setSelectedProgram(programToUse);
      } else {
        setError('Failed to calculate qualification');
      }
    } catch (err) {
      console.error('[ERROR] Failed to load loan details:', err);
      setError(err.message || 'Failed to load scenario details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultPrograms = async () => {
    try {
      const response = await fetchAPI('/loan-programs');
      if (response.status === 'success') {
        setPrograms(response.data.filter(p => p.isAvailableToBorrower));
        return response.data.filter(p => p.isAvailableToBorrower);
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const changeProgram = async (programId) => {
    try {
      setLoading(true);
      
      const program = programs.find(p => p._id === programId);
      if (!program) return;
      
      const qualificationResponse = await fetchAPI(`/loan-programs/qualification/${loanId}/${programId}`);
      
      if (qualificationResponse.status === 'success') {
        setQualification(qualificationResponse.data);
        setSelectedProgram(program);
      } else {
        setError('Failed to calculate qualification for selected program');
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate qualification');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = () => {
    setDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialog(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading qualification data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!qualification || !selectedProgram) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">No qualification data available. Please set up loan programs first.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { isQualified, disqualificationReasons, loanMetrics } = qualification;
  const { dti, downPaymentPercentage, totalMonthlyPayment, loanAmount } = loanMetrics || {};

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isQualified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isQualified ? 'Qualified' : 'Not Qualified'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleShowDetails}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <Link 
            href={`/lender/loans/${loanId}/parameters`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Parameters
          </Link>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-5">
          {/* DTI Visualization */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isQualified ? "#10B981" : "#EF4444"}
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(downPaymentPercentage || 0, 100)}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold">{Math.round(downPaymentPercentage || 0)}%</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Down Payment</p>
            <p className="mt-1 text-sm text-gray-900">DTI: {dti ? dti.toFixed(2) : 0}%</p>
          </div>

          {/* Loan Details */}
          <div className="col-span-2">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Monthly Payment</dt>
                <dd className="mt-1 text-sm text-gray-900">${totalMonthlyPayment ? totalMonthlyPayment.toFixed(2) : '0.00'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${loanAmount ? (loanAmount / (1 - downPaymentPercentage / 100)).toFixed(2) : '0.00'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Down Payment</dt>
                <dd className="mt-1 text-sm text-gray-900">${loanAmount ? ((loanAmount / (1 - downPaymentPercentage / 100)) * (downPaymentPercentage / 100)).toFixed(2) : '0.00'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Loan Program</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedProgram.displayName}</dd>
              </div>
            </dl>
          </div>
        </div>

        {!isQualified && disqualificationReasons.length > 0 && (
          <div className="px-6 py-4 bg-red-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Reasons for Not Qualifying:</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {disqualificationReasons.map((reason, index) => (
                      <li key={index}>{reason.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog for Details - Hidden by default */}
      {detailsDialog && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseDetails}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Loan Program Details
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 font-semibold">Available Programs</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {programs.map(program => (
                          <button
                            key={program._id}
                            onClick={() => changeProgram(program._id)}
                            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded 
                              ${selectedProgram._id === program._id
                                ? 'border-indigo-500 bg-indigo-100 text-indigo-800'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {program.displayName}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-500 font-semibold">Program Restrictions</p>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-xs text-gray-500">Max DTI</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedProgram.restrictions?.dtiRestriction?.max || 'No Limit'}%</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-gray-500">Down Payment Range</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              Min: {selectedProgram.restrictions?.downPaymentRestriction?.min || 'No Minimum'}% - 
                              Max: {selectedProgram.restrictions?.downPaymentRestriction?.max || 'No Maximum'}%
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-gray-500">Loan Amount Range</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              Min: ${selectedProgram.restrictions?.loanAmountRestriction?.min?.toLocaleString() || 'No Minimum'} - 
                              Max: ${selectedProgram.restrictions?.loanAmountRestriction?.max?.toLocaleString() || 'No Maximum'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-500 font-semibold">Current Metrics</p>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-xs text-gray-500">DTI</dt>
                            <dd className="mt-1 text-sm text-gray-900">{dti?.toFixed(2) || '0.00'}%</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs text-gray-500">Down Payment</dt>
                            <dd className="mt-1 text-sm text-gray-900">{downPaymentPercentage?.toFixed(2) || '0.00'}%</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs text-gray-500">Loan Amount</dt>
                            <dd className="mt-1 text-sm text-gray-900">${loanAmount?.toLocaleString() || '0.00'}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      {!isQualified && disqualificationReasons.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Reasons for Not Qualifying:</h3>
                                <div className="mt-2 text-sm text-red-700">
                                  <ul className="list-disc pl-5 space-y-1">
                                    {disqualificationReasons.map((reason, index) => (
                                      <li key={index}>{reason.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Link
                  href={`/lender/loans/${loanId}/parameters`}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Edit Loan Parameters
                </Link>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
