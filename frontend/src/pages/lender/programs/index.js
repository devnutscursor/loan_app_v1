import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { fetchAPI } from '@/utils/api';
import LenderLayout from '@/components/layout/LenderLayout';
import Head from 'next/head';

export default function LoanPrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  // Fetch programs on component mount
  useEffect(() => {
    fetchLoanPrograms();
  }, []);

  const fetchLoanPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI('/loan-programs');
      if (response.status === 'success') {
        setPrograms(response.data);
      } else {
        setError('Failed to load loan programs');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan programs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = () => {
    router.push('/lender/programs/create');
  };

  const handleEditProgram = (id) => {
    router.push(`/lender/programs/${id}`);
  };

  const handleDeleteClick = (program) => {
    setProgramToDelete(program);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;

    try {
      const response = await fetchAPI(`/loan-programs/${programToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (response.status === 'success' || response.status === 204) {
        setSuccessMessage('Loan program deleted successfully');
        setSuccess(true);
        fetchLoanPrograms();
      } else {
        setError('Failed to delete loan program');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete loan program');
    } finally {
      setDeleteDialog(false);
      setProgramToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const navigateToRates = () => {
    router.push('/lender/programs/rates');
  };

  return (
    <LenderLayout>
      <Head>
        <title>Loan Programs | Lender Dashboard</title>
      </Head>
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <button 
            className="flex items-center px-4 py-2 mr-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold flex-grow text-gray-900">
            Loan Programs
          </h1>
          <button 
            className="px-4 py-2 mr-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" 
            onClick={navigateToRates}
          >
            Manage Rates
          </button>
          <button 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={handleCreateProgram}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available to Borrower</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No loan programs found. Click "New Program" to create one.
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => (
                      <tr key={program._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.programName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {program.programType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.loanTerm} years</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.isAvailableToBorrower ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditProgram(program._id)} 
                            className="text-blue-600 hover:text-blue-900 mr-3 focus:outline-none"
                            aria-label="Edit program"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(program)} 
                            className="text-red-600 hover:text-red-900 focus:outline-none"
                            aria-label="Delete program"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeleteDialog(false)}></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Confirm Delete</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the "{programToDelete?.programName}" program?
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error notification */}
      {(success || !!error) && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-md p-4 shadow-lg ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${success ? 'text-green-800' : 'text-red-800'}`}>  
                  {success ? successMessage : error}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={handleCloseSnackbar}
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${success ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' : 'text-red-500 hover:bg-red-100 focus:ring-red-600'}`}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LenderLayout>
  );
}
