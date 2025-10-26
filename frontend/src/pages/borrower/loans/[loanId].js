import React, { useState } from "react";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import LoanDetailsLoadingSkeleton from "../../../components/borrower/loans/LoanDetailsLoadingSkeleton";
import LoanHeader from "../../../components/borrower/loans/LoanHeader";
import TabNavigation from "../../../components/borrower/loans/TabNavigation";
import TabContent from "../../../components/borrower/loans/TabContent";
import MobileExpandableNavigation from "../../../components/borrower/loans/MobileExpandableNavigation";
import ErrorState from "../../../components/borrower/loans/ErrorState";
import NoLoanState from "../../../components/borrower/loans/NoLoanState";
import useLoanDetails from "../../../hooks/borrower/useLoanDetails";

const LoanDetails = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const {
    // Data
    loan,
    loanId,
    mainTabs,
    activeTab,
    
    // Loading states
    loading,
    error,
    
    // Event handlers
    handleTabClick,
    handleRemoveDocument,
    
    // Utility functions
    getStatusBadgeColor,
    formatDate,
    formatCurrency
  } = useLoanDetails();

  const handleMobileNavToggle = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const handleMobileNavClose = () => {
    setIsMobileNavOpen(false);
  };


  return (
    <ProtectedRoute roles={["borrower", "admin"]}>
      <MainLayout
        title={loan ? `Loan ${loan.loanNumber || ""}` : "Loan Details"}
        noSidebarMargin={true}
      >
        <div className="py-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 lg:min-w-[970px]">
            <LoanHeader 
              loan={loan}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate}
            />

            {loading ? (
              <LoanDetailsLoadingSkeleton />
            ) : error ? (
              <ErrorState error={error} />
            ) : loan ? (
              <div className="flex">
                <TabNavigation 
                  mainTabs={mainTabs}
                  activeTab={activeTab}
                  onTabClick={handleTabClick}
                  loan={loan}
                />
                <TabContent 
                  activeTab={activeTab}
                  loan={loan}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              </div>
            ) : (
              <NoLoanState />
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {loan && (
          <MobileExpandableNavigation
            isOpen={isMobileNavOpen}
            onToggle={handleMobileNavToggle}
            onClose={handleMobileNavClose}
            mainTabs={mainTabs}
            activeTab={activeTab}
            handleTabClick={handleTabClick}
            loan={loan}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
