import React from 'react';
import StatCards from './StatCards';
import RecentLoansSection from './RecentLoansSection';
import RecentBorrowersSection from './RecentBorrowersSection';
import RecentActivitiesSection from './RecentActivitiesSection';
import LoanProgramsSection from './LoanProgramsSection';

const DashboardContent = ({ 
  stats, 
  recentLoans, 
  recentBorrowers, 
  programs, 
  borrowerLoans, 
  activities, 
  activitiesLoading,
  formatCurrency,
  onViewLoan,
  onNewLoanClick,
  onRefreshActivities
}) => {
  return (
    <>
      {/* Stats Cards */}
      <StatCards stats={stats} formatCurrency={formatCurrency} />

      {/* Main Content 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Loans Section */}
        <RecentLoansSection
          recentLoans={recentLoans}
          stats={stats}
          onViewLoan={onViewLoan}
          onNewLoanClick={onNewLoanClick}
        />

        {/* Right Column: Borrowers, Programs and Activity */}
        <div className="space-y-6">
          {/* Borrowers Card */}
          <RecentBorrowersSection
            recentBorrowers={recentBorrowers}
            borrowerLoans={borrowerLoans}
          />

          {/* Recent Activity Timeline */}
          <RecentActivitiesSection
            activities={activities}
            activitiesLoading={activitiesLoading}
            onRefreshActivities={onRefreshActivities}
          />

          {/* Loan Programs */}
          <LoanProgramsSection programs={programs} />
        </div>
      </div>
    </>
  );
};

export default DashboardContent;
