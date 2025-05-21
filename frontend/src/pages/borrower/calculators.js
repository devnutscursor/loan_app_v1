import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import CalculatorContainer from '../../components/borrower/calculators/CalculatorContainer';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Financial Calculators Page - Provides borrowers with calculators for making financial decisions
 * related to home loans.
 */
const FinancialCalculators = () => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Financial Calculators">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Financial Calculators</h1>
              <p className="mt-1 text-sm text-gray-500">
                Explore different loan scenarios to make informed financial decisions about your home loan.
              </p>
            </div>
            
            {/* Main content */}
            <div className="mb-10">
              <CalculatorContainer />
            </div>
            
            {/* Call to action */}
            <div className="bg-primary-50 rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-700 mb-2">Ready to apply for a loan?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Use our simple application process to get started with your home loan journey.
              </p>
              <button
                onClick={() => router.push('/borrower/apply')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Apply Now
              </button>
            </div>
            
            
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default FinancialCalculators;
