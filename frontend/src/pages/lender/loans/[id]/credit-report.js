import React from "react";
import MainLayout from "../../../../components/layout/MainLayout";
import ProtectedRoute from "../../../../components/auth/ProtectedRoute";
import FileLoadingOverlay from "../../../../components/lender/credit-report/FileLoadingOverlay";
import CreditReportPageHeader from "../../../../components/lender/credit-report/CreditReportPageHeader";
import CreditReportStatusCard from "../../../../components/lender/credit-report/CreditReportStatusCard";
import CreditReportActions from "../../../../components/lender/credit-report/CreditReportActions";
import ProviderSelectionForm from "../../../../components/lender/credit-report/ProviderSelectionForm";
import CreditScoresDisplay from "../../../../components/lender/credit-report/CreditScoresDisplay";
import ReportDetails from "../../../../components/lender/credit-report/ReportDetails";
import useCreditReport from "../../../../hooks/lender/useCreditReport";
import AddCredentialModal from "@/components/lender/credentials/AddCredentialModal";
import EditCredentialModal from "@/components/lender/credentials/EditCredentialModal";
import ConsentRequiredModal from "../../../../components/lender/credit-report/ConsentRequiredModal";
import ManualConsentModal from "../../../../components/lender/credit-report/ManualConsentModal";
import ConsentStatusBanner from "../../../../components/lender/credit-report/ConsentStatusBanner";

const CreditReportPage = () => {
  const {
    // Data
    loanId,
    user,
    creditReport,
    reportStatus,
    selectedProviders,
    personalCredentials,
    organizationCredentials,
    selectedCredentialId,
    importMethod,
    currentOperation,
    
    // Loading states
    loading,
    fileLoading,
    showProviderForm,
    addOpen,
    editOpen,
    selectedCredential,
    
    // Consent state
    borrowerConsent,
    consentRequired,
    consentModalOpen,
    manualConsentModalOpen,
    consentLoading,
    
    // Event handlers
    handleSubmitReport,
    handleCreateReportClick,
    handleRefreshReportClick,
    handleReissueReportClick,
    handleUpgradeReportClick,
    handleViewReport,
    handleProviderChange,
    handleCancelProviderForm,
    handleBack,
    setImportMethod,
    handleChangeCredential,
    handleOpenAddAccount,
    handleCloseAddAccount,
    handleOpenEditAccount,
    handleCloseEditAccount,
    
    // Consent handlers
    handleOpenConsentModal,
    handleCloseConsentModal,
    handleOpenManualConsentModal,
    handleCloseManualConsentModal,
    handleRecordManualConsent,
    handleSendConsentEmail,
    
    credsHook
  } = useCreditReport();

  if (!user || (user.role !== 'lender' && user.role !== 'company')) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["lender", "company"]}>
      <MainLayout>
        <FileLoadingOverlay isLoading={fileLoading} />
        
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8">
          <CreditReportPageHeader
            loanId={loanId}
            onBack={handleBack}
          />

          {/* Consent Status Banner */}
          <ConsentStatusBanner
            borrowerConsent={borrowerConsent}
            loading={false}
            onRecordManualConsent={handleOpenManualConsentModal}
            onSendEmailRequest={handleSendConsentEmail}
          />

          <div className="space-y-6">
            <CreditReportStatusCard
              loading={loading}
              reportStatus={reportStatus}
            />

            <CreditReportActions
              loading={loading}
              reportStatus={reportStatus}
              fileLoading={fileLoading}
              onRefreshReport={handleRefreshReportClick}
              onReissueReport={handleReissueReportClick}
              onUpgradeReport={handleUpgradeReportClick}
              onViewReport={handleViewReport}
              onCreateReport={handleCreateReportClick}
              borrowerConsent={borrowerConsent}
            />

            <ProviderSelectionForm
              showForm={showProviderForm && !loading}
              selectedProviders={selectedProviders}
              loading={loading}
              currentOperation={currentOperation}
              onProviderChange={handleProviderChange}
              onSubmitReport={handleSubmitReport}
              onCancel={handleCancelProviderForm}
              userRole={user?.role}
              personalCredentials={personalCredentials}
              organizationCredentials={organizationCredentials}
              selectedCredentialId={selectedCredentialId}
              onChangeCredential={handleChangeCredential}
              onOpenAddAccount={handleOpenAddAccount}
              onOpenEditAccount={handleOpenEditAccount}
              importMethod={importMethod}
              setImportMethod={setImportMethod}
              hasActiveReport={reportStatus?.hasActiveReport}
            />

            <CreditScoresDisplay
              loading={loading}
              creditScores={creditReport?.creditScores}
            />

          </div>
        </div>
      {/* Modals reused from credentials UI */}
      <AddCredentialModal
        isOpen={addOpen}
        onClose={handleCloseAddAccount}
        onSubmit={credsHook.create}
        vendors={credsHook.vendors}
      />
      <EditCredentialModal
        isOpen={editOpen}
        onClose={handleCloseEditAccount}
        onSubmit={credsHook.update}
        onDelete={credsHook.remove}
        vendors={credsHook.vendors}
        credential={selectedCredential}
      />
      
      {/* Consent Modals */}
      <ConsentRequiredModal
        isOpen={consentModalOpen}
        onClose={handleCloseConsentModal}
        borrowerName={creditReport?.borrowerData?.firstName && creditReport?.borrowerData?.lastName 
          ? `${creditReport.borrowerData.firstName} ${creditReport.borrowerData.lastName}`
          : 'this borrower'}
        onSendEmailRequest={handleSendConsentEmail}
        onRecordManualConsent={handleOpenManualConsentModal}
        onCancel={handleCloseConsentModal}
      />
      
      <ManualConsentModal
        isOpen={manualConsentModalOpen}
        onClose={handleCloseManualConsentModal}
        borrowerName={creditReport?.borrowerData?.firstName && creditReport?.borrowerData?.lastName 
          ? `${creditReport.borrowerData.firstName} ${creditReport.borrowerData.lastName}`
          : 'this borrower'}
        borrowerId={creditReport?.borrowerData?.id}
        onSubmit={handleRecordManualConsent}
        loading={consentLoading}
      />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default CreditReportPage;
