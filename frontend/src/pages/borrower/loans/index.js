import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MainLayout from "../../../components/layout/MainLayout";
import LoanCard from "../../../components/common/LoanCard";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import LoansLoadingSkeleton from "../../../components/borrower/loans/LoansLoadingSkeleton";
import NoLoansView from "../../../components/borrower/loans/NoLoansView";
import LoanCategorySection from "../../../components/borrower/loans/LoanCategorySection";
import LoansHeader from "../../../components/borrower/loans/LoansHeader";
import StatusSummary from "../../../components/borrower/loans/StatusSummary";
import useBorrowerLoans from "../../../hooks/borrower/useBorrowerLoans";

const Loans = () => {
  const {
    // Data
    loans,
    loansList,
    statusGroups,
    filter,
    error,
    
    // Loading states
    loading,
    
    // Event handlers
    handleFilterChange,
    refreshLoans,
    
    // Utility functions
    fetchLoans
  } = useBorrowerLoans();




  return (
    <ProtectedRoute roles={["borrower", "admin"]}>
      <MainLayout title="My Loans">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <LoansLoadingSkeleton />
            ) : (
              <>
                <LoansHeader 
                  filter={filter}
                  onFilterChange={handleFilterChange}
                  onRefresh={refreshLoans}
                  loading={loading}
                />
                
                {loansList.length > 0 ? (
                  <div className="space-y-6">
                    <StatusSummary 
                      filter={filter}
                      loansList={loansList}
                      statusGroups={statusGroups}
                      loading={loading}
                    />

                    {filter === "all" ? (
                      <>
                        {/* Loan Categories - Show when "All Loans" is selected */}
                        <LoanCategorySection
                          title="Pending Applications"
                          loans={statusGroups.pending}
                          userRole="borrower"
                        />

                        <LoanCategorySection
                          title="Processing Applications"
                          loans={statusGroups.processing}
                          userRole="borrower"
                        />

                        <LoanCategorySection
                          title="Approved Loans"
                          loans={statusGroups.approved}
                          userRole="borrower"
                        />

                        <LoanCategorySection
                          title="Denied Applications"
                          loans={statusGroups.rejected}
                          userRole="borrower"
                        />

                        <LoanCategorySection
                          title="Closed Loans"
                          loans={statusGroups.closed}
                          userRole="borrower"
                        />

                        <LoanCategorySection
                          title="Other Applications"
                          loans={statusGroups.other}
                          userRole="borrower"
                        />
                      </>
                    ) : (
                      // Filtered Results Section
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-medium text-gray-900">
                            {filter === "Application Submitted" ? "Pending" :
                             filter === "Processing" ? "Processing" :
                             filter === "Approved" ? "Approved" :
                             filter === "Declined" ? "Denied" :
                             filter === "Closed" ? "Closed" : "Filtered"} Loans
                          </h2>
                          <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                            {loansList.length} {loansList.length === 1 ? "loan" : "loans"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {loansList.map((loan) => (
                            <LoanCard
                              key={loan._id}
                              loan={loan}
                              userRole="borrower"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply CTA at bottom if has loans */}
                    <div className="border-t border-gray-200 pt-6 mt-8">
                      <div className="flex items-center justify-between flex-col sm:flex-row">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Need another loan?
                          </h3>
                          <p className="text-sm text-gray-500">
                            Apply for additional financing with just a few clicks
                          </p>
                        </div>
                        <Link
                          href="/borrower/apply"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-4 sm:mt-0"
                        >
                          Apply Now <ChevronRight className="ml-1 h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <NoLoansView filter={filter} />
                )}
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Loans;
