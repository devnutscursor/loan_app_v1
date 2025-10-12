import React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import BorrowerStep from '../../components/forms/borrower/BorrowerStep';
import PropertyStep from '../../components/forms/property/PropertyStep';
import FinancialStep from '../../components/forms/financial/FinancialStep';
import AdditionalStep from '../../components/forms/additional/AdditionalStep';
import DeclarationsStep from '../../components/forms/declarations/DeclarationsStep';
import ReviewStep from '../../components/forms/review/ReviewStep';
import StepNavigator from '../../components/ui/StepNavigator';
import { useLoanApplication } from '../../hooks/useLoanApplication';

const LoanApplication = () => {
  const {
    // State
    currentStep,
    setCurrentStep,
    currentSubStep,
    setCurrentSubStep,
    loading,
    draftId,
    loanTypes,
    formData,
    setFormData,
    errors,
    setErrors,
    
    // Credit report consent
    hasExistingConsent,
    creditReportConsent,
    setCreditReportConsent,
    loadingConsent,
    consentData,
    
    // Context
    isLenderContext,
    userRole,
    
    // Handlers
    handleChange,
    handleBorrowerChange,
    handlePropertyChange,
    nextStep,
    prevStep,
    handleSubmit,
    
    // Utility functions
    validateStep,
    fillWithTestData,
    clearForm
  } = useLoanApplication();

  // Render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BorrowerStep
            formData={formData}
            handleChange={handleBorrowerChange}
            validateStep={validateStep}
            nextStep={nextStep}
            errors={errors}
            currentSubStep={currentSubStep}
            setCurrentSubStep={setCurrentSubStep}
            userType="borrower"
            toast={toast}
          />
        );
      
      case 2:
        return (
          <PropertyStep
            formData={formData}
            handleChange={handlePropertyChange}
            loanTypes={loanTypes}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 3:
        return (
          <FinancialStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 4:
        return (
          <AdditionalStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 5:
        return (
          <DeclarationsStep
            formData={formData}
            handleChange={handleChange}
            validateStep={validateStep}
            nextStep={nextStep}
            prevStep={prevStep}
            errors={errors}
            userType="borrower"
          />
        );
      
      case 6:
        return (
          <ReviewStep
            formData={formData}
            setCurrentStep={setCurrentStep}
            handleSubmit={handleSubmit}
            loading={loading}
            userType="borrower"
            hasExistingConsent={hasExistingConsent}
            creditReportConsent={creditReportConsent}
            setCreditReportConsent={setCreditReportConsent}
            loadingConsent={loadingConsent}
            consentData={consentData}
          />
        );
      
      default:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Unknown Step</h3>
            <p className="mt-1 text-sm text-gray-600">
              There was an error with the application process.
            </p>
          </div>
        );
    }
  };

  // Define the steps for the application
  const applicationSteps = [
    { title: 'Borrowers' },
    { title: 'Property & Loan' },
    { title: 'Assets & Debts' },
    { title: 'Additional Info' },
    { title: 'Declarations' },
    { title: 'Review & Submit' }
  ];
  
  // Calculate progress percentage
  const progress = (currentStep / 6) * 100;

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Apply for Loan">
        <div className="py-6">
          <div className="mx-auto sm:px-6">
            <div className="flex justify-between items-center flex-col lg:flex-row">
              <h1 className="text-2xl font-semibold text-gray-900 lg:mb-0 mb-3">Apply for a Loan</h1>
              
              {/* Development Tools - Enhanced to match lender page */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <button
                      type="button"
                      onClick={fillWithTestData}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                      title="Fill form with comprehensive test data (uses standard borrower submission)"
                    >
                      🧪 Fill Test Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Enable validation override and jump to review step
                        window._tempValidateOverride = true;
                        setCurrentStep(6); // Review step
                        toast.success('Jumped to review step with validation bypass');
                      }}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                      title="Jump to review step (bypasses validation, uses standard borrower submission)"
                    >
                      ⚡ Jump to Review
                    </button>
                    <button
                      type="button"
                      onClick={clearForm}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                      title="Clear form and reset to step 1"
                    >
                      🗑️ Clear Form
                    </button>
                    <Link href="/borrower/loans">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ← Back to My Loans
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          
            {/* Step Navigator */}
            <div className="mt-4">
              <StepNavigator 
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                steps={applicationSteps}
                formData={formData}
                validateStep={validateStep}
              />
            </div>

            {/* Form Auto-Save Info Banner */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Auto-Save Enabled:</strong> Your form data is automatically saved as you type. If you refresh the page or return later, your progress will be restored.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Form */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <form onSubmit={currentStep === 6 ? handleSubmit : (e) => e.preventDefault()}>
                {renderStep()}
                
                {/* Only show these navigation buttons for steps that don't have their own navigation */}
                {/* Remove the default navigation buttons for all steps with custom navigation */}
                {false && (
                  <div className="mt-8 flex justify-between">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Previous
                      </button>
                    )}
                    
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanApplication;