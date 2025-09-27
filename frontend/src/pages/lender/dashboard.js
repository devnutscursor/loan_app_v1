import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import XMLLoanUpload from '../../components/lender/loans/XMLLoanUpload_new';
import NewLoanModal from '../../components/lender/loans/NewLoanModal';
import { useLenderDashboard } from '../../hooks/lender/useLenderDashboard';
import DashboardHeader from '../../components/lender/dashboard/DashboardHeader';
import LoadingSkeleton from '../../components/lender/dashboard/LoadingSkeleton';
import DashboardContent from '../../components/lender/dashboard/DashboardContent';

const LenderDashboard = () => {
  const {
    loading,
    showLoanModal,
    isXMLUploadOpen,
    stats,
    recentLoans,
    recentBorrowers,
    programs,
    borrowerLoans,
    activities,
    activitiesLoading,
    setShowLoanModal,
    setIsXMLUploadOpen,
    handleViewLoan,
    handleXMLUploadOption,
    handleManualCreateOption,
    formatCurrency,
    handleRefreshActivities,
    handleXMLUploadSuccess
  } = useLenderDashboard();
  
  return (
    <MainLayout title="Lender Dashboard">
      <div className="py-6">
        <DashboardHeader onNewLoanClick={() => setShowLoanModal(true)} />
        
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <DashboardContent
            stats={stats}
            recentLoans={recentLoans}
            recentBorrowers={recentBorrowers}
            programs={programs}
            borrowerLoans={borrowerLoans}
            activities={activities}
            activitiesLoading={activitiesLoading}
            formatCurrency={formatCurrency}
            onViewLoan={handleViewLoan}
            onNewLoanClick={() => setShowLoanModal(true)}
            onRefreshActivities={handleRefreshActivities}
          />
        )}
      </div>
      
      {/* New Loan Modal */}
      <NewLoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        onXMLUpload={handleXMLUploadOption}
        onManualCreate={handleManualCreateOption}
      />

      {/* XML Loan Upload Modal */}
      <XMLLoanUpload 
        isOpen={isXMLUploadOpen} 
        onClose={() => setIsXMLUploadOpen(false)} 
        onSuccess={handleXMLUploadSuccess}
      />
    </MainLayout>
  );
};

export default LenderDashboard;