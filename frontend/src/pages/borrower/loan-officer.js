import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import LoadingState from '../../components/borrower/loan-officer/LoadingState';
import ErrorState from '../../components/borrower/loan-officer/ErrorState';
import CompanySection from '../../components/borrower/loan-officer/CompanySection';
import LenderSection from '../../components/borrower/loan-officer/LenderSection';
import ContactInfo from '../../components/borrower/loan-officer/ContactInfo';
import { useLoanOfficer } from '../../hooks/useLoanOfficer';

const LoanOfficer = () => {
  const {
    lenderData,
    fetching,
    fetchError,
    hasLenderData,
    hasCompany,
    hasError,
    isLoading
  } = useLoanOfficer();

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-0 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1220px]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Your Loan Officer
            </h2>
            <p className="mt-2 text-sm text-gray-600">View your assigned loan officer and lender details</p>
          </div>

          <div className="space-y-6">
            {/* Loading state */}
            {isLoading && <LoadingState />}
            
            {/* Error state */}
            {!isLoading && hasError && <ErrorState error={fetchError} />}

            {/* Content */}
            {!isLoading && hasLenderData && (
              <>
                {/* Company Section */}
                {hasCompany && <CompanySection company={lenderData.company} />}

                {/* Lender Section */}
                <LenderSection lenderData={lenderData} />

                {/* Contact Info */}
                <ContactInfo />
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoanOfficer;