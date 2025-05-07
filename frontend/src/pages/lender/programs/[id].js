import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { fetchAPI } from '@/utils/api';
import LenderLayout from '@/components/layout/LenderLayout';
import LoanProgramForm from '@/components/lender/programs/LoanProgramForm';
import Head from 'next/head';
import Link from 'next/link';

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
      const response = await fetchAPI(`/loan-programs/${id}`);
      if (response.status === 'success') {
        setProgram(response.data);
      } else {
        setError('Failed to load loan program');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan program');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      
      const url = isNewProgram ? '/loan-programs' : `/loan-programs/${id}`;
      const method = isNewProgram ? 'POST' : 'PUT';
      
      const response = await fetchAPI(url, {
        method,
        data: formData  // Changed from body: JSON.stringify(formData)
      });
      
      if (response.status === 'success') {
        setSuccess(true);
        
        // For new programs, redirect to the edit page after creation
        if (isNewProgram) {
          router.push(`/lender/programs/${response.data._id}`);
        }
      } else {
        setError('Failed to save loan program');
      }
    } catch (err) {
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
