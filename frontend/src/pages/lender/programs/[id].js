import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import LenderLayout from '@/components/layout/LenderLayout';
import LoanProgramForm from '@/components/lender/programs/LoanProgramForm';
import Head from 'next/head';
import Link from 'next/link';
import { LoanProgramService } from '@/services';

export default function EditLoanProgram() {
  const router = useRouter();
  const { id } = router.query;
  const isNewProgram = id === 'create';
  
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(!isNewProgram);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch program data on component mount if editing
  useEffect(() => {
    if (!isNewProgram && id) {
      fetchProgramData();
    }
  }, [id, isNewProgram]);

  const fetchProgramData = async () => {
    try {
      setLoading(true);
      console.log('Fetching program data for ID:', id);
      const response = await LoanProgramService.getProgram(id);
      console.log('Program data response:', response);
      
      // Handle different response structures
      if (response) {
        // If response.data has status and data properties (nested API response)
        if (response.data && response.data.status === 'success' && response.data.data) {
          console.log('Setting program from nested data:', response.data.data);
          setProgram(response.data.data);
        } 
        // If response.data is directly the program object (it has an _id)
        else if (response.data && response.data._id) {
          console.log('Setting program from direct data:', response.data);
          setProgram(response.data);
        }
        // If response itself has status and data properties
        else if (response.status === 'success' && response.data) {
          console.log('Setting program from direct API response:', response.data);
          setProgram(response.data);
        }
        else {
          console.error('Unexpected program data structure:', response);
          setError('Failed to load loan program: Unexpected data structure');
        }
      } else {
        console.error('Empty response received');
        setError('Failed to load loan program: Empty response');
      }
    } catch (err) {
      console.error('Error fetching program data:', err);
      setError(err.message || 'Failed to load loan program');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('Saving loan program with data:', formData);
      let response;
      
      if (isNewProgram) {
        response = await LoanProgramService.createProgram(formData);
      } else {
        response = await LoanProgramService.updateProgram(id, formData);
      }
      
      console.log('Save response:', response);
      
      // Handle different response structures
      if (response) {
        if (response.data) {
          // If response.data has status property (nested structure)
          if (response.data.status === 'success') {
            console.log('Program saved successfully (nested):', response.data);
            setSuccess(true);
            // For new programs, redirect to the edit page after creation
            if (isNewProgram && response.data.data && response.data.data._id) {
              router.push(`/lender/programs/${response.data.data._id}`);
            }
          } 
          // If response.data is the saved program object (it has an _id)
          else if (response.data._id) {
            console.log('Program saved successfully (direct):', response.data);
            setSuccess(true);
            // For new programs, redirect to the edit page after creation
            if (isNewProgram) {
              router.push(`/lender/programs/${response.data._id}`);
            }
          }
          // If response.data has some other structure
          else {
            console.error('Unexpected data structure in response:', response.data);
            setError('Failed to save loan program: Unexpected response structure');
          }
        } 
        // If response has status directly
        else if (response.status === 'success') {
          console.log('Program saved successfully (direct API response):', response);
          setSuccess(true);
          // For new programs, redirect to the edit page after creation
          if (isNewProgram && response.data && response.data._id) {
            router.push(`/lender/programs/${response.data._id}`);
          }
        }
        // If response is a 204 No Content or similar success status
        else if (response.status === 204 || response.status === 200) {
          console.log('Program saved successfully (status code):', response.status);
          setSuccess(true);
        }
        else {
          console.error('Unrecognized response structure:', response);
          setError('Failed to save loan program: Unrecognized response');
        }
      } else {
        console.error('Empty response received');
        setError('Failed to save loan program: Empty response');
      }
    } catch (err) {
      console.error('Error saving program:', err);
      setError(err.message || 'Failed to save loan program');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const pageTitle = isNewProgram ? 'Create Loan Program' : 'Edit Loan Program';

  if (loading) {
    return (
      <LenderLayout>
        <Head>
          <title>{pageTitle} | Lender Dashboard</title>
        </Head>
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </LenderLayout>
    );
  }

  return (
    <LenderLayout>
      <Head>
        <title>{pageTitle} | Lender Dashboard</title>
      </Head>
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <button 
            className="flex items-center px-4 py-2 mr-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={() => router.push('/lender/programs')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <nav className="text-sm" aria-label="breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/lender/programs" className="text-gray-500 hover:text-gray-700">
                    Loan Programs
                  </Link>
                </li>
                <li className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-900">
                    {isNewProgram ? 'Create New' : program?.displayName || 'Edit'}
                  </span>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <LoanProgramForm 
          program={program} 
          isLoading={saving}
          onSave={handleSaveProgram}
          error={error}
        />
      </div>

      {/* Success notification */}
      {success && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-md bg-green-50 p-4 border border-green-200 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Loan program saved successfully</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={handleCloseSnackbar}
                    className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
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
