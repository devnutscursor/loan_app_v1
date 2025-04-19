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
              <h2 className="text-lg font-medium text-primary mb-2">Ready to apply for a loan?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Use our simple application process to get started with your home loan journey.
              </p>
              <button
                onClick={() => router.push('/borrower/apply')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Apply Now
              </button>
            </div>
            
            {/* Additional resources */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Home Buying Guide</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Learn about the home buying process from start to finish.
                  </p>
                  <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium">
                    Read the guide →
                  </a>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Understanding Mortgage Terms</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Decode common mortgage terminology and loan types.
                  </p>
                  <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium">
                    View glossary →
                  </a>
                </div>
                
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Financial Planning Tips</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Expert advice on preparing your finances for homeownership.
                  </p>
                  <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium">
                    See tips →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default FinancialCalculators;
