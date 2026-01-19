import React, { useMemo } from "react";
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
const normalizeEmploymentType = (loan) => {
  if (!loan) return "employee";

  const extractType = (value) => {
    if (value === undefined || value === null) return null;
    const str = String(value).toLowerCase();

    if (["yes", "true", "self", "self-employed", "self_employed"].some((token) => str.includes(token))) {
      return "self-employed";
    }

    if (["1099", "contractor"].some((token) => str.includes(token))) {
      return "self-employed";
    }

    if (["no", "false", "w2", "w-2", "employee"].some((token) => str.includes(token))) {
      return "employee";
    }

    return null;
  };

  const candidateValues = [
    loan?.borrower?.employment?.employmentType,
    loan?.borrowerDetails?.employmentType,
    loan?.employmentType,
    loan?.loanDetails?.employmentType,
    loan?.borrowerDetails?.employers?.[0]?.isSelfEmployed,
    loan?.borrowerDetails?.employers?.[0]?.employmentStatus,
  ];

  for (const value of candidateValues) {
    const normalized = extractType(value);
    if (normalized) {
      return normalized;
    }
  }

  return "employee";
};

const deriveOwnsHome = (loan) => {
  if (!loan) return false;

  const rawValues = [
    loan?.propertiesOwned?.ownsProperty,
    loan?.borrowerDetails?.propertiesOwned?.ownsProperty,
    loan?.borrowerDetails?.ownsProperty,
  ];

  for (const value of rawValues) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["yes", "true", "y", "1"].includes(lower)) return true;
      if (["no", "false", "n", "0"].includes(lower)) return false;
    } else {
      return Boolean(value);
    }
  }

  return false;
};

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

  // Find the selected loan to get its loan number and metadata
  const selectedLoan = loans.find(loan => loan._id === selectedLoanId);

  const employmentType = useMemo(() => normalizeEmploymentType(selectedLoan), [selectedLoan]);
  const ownsHome = useMemo(() => deriveOwnsHome(selectedLoan), [selectedLoan]);

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
                isUploading={isUploading}
              />
            )}

            {/* Required Documents Checklist */}
            <div className="mb-6 mt-6" id="upload-section">
              <RequiredDocumentsList
                loanId={selectedLoanId}
                employmentType={employmentType}
                ownsHome={ownsHome}
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