import { ArrowLeft, Save } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import Head from 'next/head';
import Link from 'next/link';
import { LoanProgramService } from '@/services';
import { useCompanyEditProgram } from '@/hooks/company/useCompanyEditProgram';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import component sections
import BasicProgramSection from '../../../components/lender/programs/BasicProgramSection';
import LoanRestrictionsSection from '../../../components/lender/programs/LoanRestrictionsSection';
import MortgageInsuranceSection from '../../../components/lender/programs/MortgageInsuranceSection';
import FinanceFeesSection from '../../../components/lender/programs/FinanceFeesSection';

export default function CompanyEditLoanProgram() {
  const {
    router,
    id,
    isNewProgram,
    program,
    loading,
    saving,
    error,
    success,
    validationErrors,
    formData,
    handleSave,
    handleInputChange,
    handleNestedInputChange,
    handleFinanceFeeChange,
    handleArrayChange,
    handleAddArrayItem,
    handleRemoveArrayItem,
  } = useCompanyEditProgram();

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['company']}>
        <MainLayout>
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <MainLayout>
        <Head>
          <title>
            {isNewProgram ? 'Create Loan Program' : 'Edit Loan Program'} - Company Dashboard
          </title>
        </Head>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/company/programs"
                className="group flex items-center px-2.5 py-1.5 rounded hover:bg-gray-100 transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-primary transition" />
                <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                  Back to Programs
                </span>
              </Link>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isNewProgram ? 'Create New Loan Program' : 'Edit Loan Program'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {isNewProgram 
                    ? 'Configure a new loan program for your company lenders'
                    : 'Update the loan program configuration'
                  }
                </p>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving || validationErrors.programName}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Program'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {isNewProgram ? 'Loan program created successfully!' : 'Loan program updated successfully!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-6">
            {/* Validation Error for Program Name */}
            {validationErrors.programName && (
              <div className="mb-4">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.programName}
                </p>
              </div>
            )}
            <BasicProgramSection
              formData={formData}
              onChange={handleInputChange}
              isLoading={saving}
            />

            <LoanRestrictionsSection
              formData={formData}
              onChange={handleNestedInputChange}
              isLoading={saving}
            />

            <MortgageInsuranceSection
              formData={formData}
              onChange={handleInputChange}
              onArrayChange={handleArrayChange}
              onAddArrayItem={handleAddArrayItem}
              onRemoveArrayItem={handleRemoveArrayItem}
              isLoading={saving}
            />

            <FinanceFeesSection
              formData={formData}
              onChange={handleFinanceFeeChange}
              isLoading={saving}
            />

          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}