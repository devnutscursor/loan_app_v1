import React from "react";
import MainLayout from "../../components/layout/MainLayout";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import DocumentManager from "../../components/borrower/documents/DocumentManager";
import RequiredDocumentsList from "../../components/borrower/documents/RequiredDocumentsList";
import LoanSelector from "../../components/borrower/documents/LoanSelector";
import DocumentRequests from "../../components/borrower/documents/DocumentRequests";
import { useDocuments } from "../../hooks/useDocuments";

/**
 * Documents Component
 *
 * Main documents page for borrowers to upload and manage loan documents.
 */
const Documents = () => {
  const {
    // State
    loans,
    selectedLoanId,
    isLoadingLoans,
    refreshTrigger,
    documentRequests,
    isLoadingRequests,
    selectedDocumentRequest,
    isUploading,
    
    // Handlers
    handleFileUpload,
    handleLoanSelection,
    
    // Utility functions
    setRefreshTrigger,
    setSelectedDocumentRequest,
    
    // Computed values
    hasLoans,
    selectedLoanRequests,
    hasSelectedLoanRequests
  } = useDocuments();

  // Find the selected loan to get its loan number
  const selectedLoan = loans.find(loan => loan._id === selectedLoanId);

  return (
    <ProtectedRoute allowedRoles={["borrower"]}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Document Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload, manage, and track documents for your loan applications
            </p>
          </div>

          <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8 mt-6">
            {/* Enhanced Loan Selector */}
            <LoanSelector
              loans={loans}
              selectedLoanId={selectedLoanId}
              isLoadingLoans={isLoadingLoans}
              onLoanSelection={handleLoanSelection}
            />

            {/* Document Requests from Lender */}
            {hasSelectedLoanRequests && (
              <DocumentRequests
                requests={selectedLoanRequests}
                isLoadingRequests={isLoadingRequests}
                selectedLoanNumber={selectedLoan?.loanNumber}
                onFileUpload={handleFileUpload}
              />
            )}

            {/* Required Documents Checklist */}
            <div className="mb-6 mt-6" id="upload-section">
              <RequiredDocumentsList
                loanId={selectedLoanId}
                onDocumentUploaded={() => {
                  setRefreshTrigger((prev) => prev + 1);
                  setSelectedDocumentRequest(null);
                }}
                selectedRequest={selectedDocumentRequest}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Documents;