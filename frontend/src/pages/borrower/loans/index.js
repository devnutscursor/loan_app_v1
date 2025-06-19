import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Plus, Filter, ChevronRight } from "lucide-react";
import MainLayout from "../../../components/layout/MainLayout";
import LoanCard from "../../../components/common/LoanCard";
import { LoanService } from "../../../services";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await LoanService.getLoans({
          status: filter !== "all" ? filter : undefined,
        });

        if (response.success) {
          // Carefully extract loans array from the response with proper validation
          let loansArray = [];

          // Check all possible response formats based on the logs
          if (Array.isArray(response.data.data)) {
            loansArray = response.data.data;
          } else if (response.data && Array.isArray(response.data.data.loans)) {
            loansArray = response.data.data.loans;
          } else if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data.loans)
          ) {
            loansArray = response.data.data.loans;
          } else {
            console.warn("Unexpected response structure:", response);
            // Still use an empty array as fallback
          }

          // Filter out any null or undefined loans that might have been deleted
          const validLoans = loansArray.filter(loan => loan && loan._id);
          console.log(`Found ${validLoans.length} valid loans out of ${loansArray.length} total`);
          
          setLoans(validLoans);
        } else {
          console.warn("Unsuccessful loan fetch:", response.message);
          toast.error(response.message || "Failed to load your loans");
          setLoans([]);
          setError("Failed to load loans");
        }
      } catch (error) {
        console.error("Error fetching loans:", error);
        toast.error("Failed to load your loans. Please try again later.");
        setLoans([]);
        setError("Error loading loans");
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [filter, refreshKey]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  // Function to manually refresh loans
  const refreshLoans = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Ensure loans is always an array before filtering
  const loansList = Array.isArray(loans) ? loans : [];

  // Group loans by status for better organization - use lowercase comparison for safety
  const statusGroups = {
    pending: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return (
        status === "pending" ||
        status === "application submitted" ||
        status === "application started"
      );
    }),
    approved: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return (
        status === "approved" ||
        status === "conditional approval" ||
        status === "clear to close"
      );
    }),
    processing: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return status === "processing" || status === "underwriting";
    }),
    rejected: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return (
        status === "rejected" || status === "declined" || status === "withdrawn"
      );
    }),
    closed: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return status === "closed" || status === "funded";
    }),
    // Other status
    other: loansList.filter((loan) => {
      const status = (loan.status || "").toLowerCase();
      return ![
        "pending",
        "application submitted",
        "application started",
        "approved",
        "conditional approval",
        "clear to close",
        "processing",
        "underwriting",
        "rejected",
        "declined",
        "withdrawn",
        "closed",
        "funded",
      ].includes(status);
    }),
  };

  // Loan Category Section component
  const LoanCategorySection = ({
    title,
    loans,
    userRole,
    bgClass = "bg-white",
  }) => {
    if (!loans || loans.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            {loans.length} {loans.length === 1 ? "loan" : "loans"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => (
            <LoanCard key={loan._id} loan={loan} userRole={userRole} />
          ))}
        </div>
      </div>
    );
  };

  // Loading Skeleton for Loan Cards
  const LoadingSkeleton = () => (
    <>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-pulse">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <div className="h-10 w-36 bg-gray-200 rounded mr-4"></div>
          <div className="h-10 w-32 bg-gradient-to-r from-blue-200 to-blue-300 rounded"></div>
        </div>
      </div>

      {/* Status Summary Skeleton */}
      <div className="bg-blue-50 p-4 mb-6 rounded-lg animate-pulse">
        <div className="h-5 w-40 bg-blue-200 rounded mb-2"></div>
        <div className="h-4 w-full bg-blue-200 rounded"></div>
      </div>

      {/* Loan Categories Skeletons */}
      {["Pending", "Processing"].map((category, index) => (
        <div key={index} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                  <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="h-9 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );

  // No Loans View
  const NoLoansView = () => (
    <div className="bg-white shadow-sm rounded-lg p-8 text-center border border-gray-100">
      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50 mb-4">
        <svg
          className="h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">No loans found</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
        Get started by applying for a loan. Our process is quick, easy, and
        designed to help you meet your financial goals.
      </p>
      <div className="mt-6">
        <Link
          href="/borrower/apply"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Apply for Loan
        </Link>
      </div>
    </div>
  );

  return (
    <ProtectedRoute roles={["borrower", "admin"]}>
      <MainLayout title="My Loans">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <LoadingSkeleton />
            ) : loansList.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      My Loans
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      View and manage all your loan applications
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center">
                    <button 
                      onClick={refreshLoans} 
                      disabled={loading}
                      className="mr-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <div className="relative mr-4">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="filter"
                        name="filter"
                        value={filter}
                        onChange={handleFilterChange}
                        className="block w-full pl-10 pr-10 py-2 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Loans</option>
                        <option value="application submitted">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <Link
                      href="/borrower/apply"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Apply for Loan
                    </Link>
                  </div>
                </div>
                <div className="space-y-6">
                  {filter === "all" ? (
                    <>
                      {/* Status Summary Card */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-medium text-blue-800">
                            Loan Status Summary
                          </h3>
                          {loading ? (
                            <span className="text-xs text-blue-600">Loading...</span>
                          ) : (
                            <span className="text-xs text-blue-600">
                              Showing all {loansList.length} loans
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mr-2">
                            Total: {loansList.length}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 mr-2">
                            Pending: {statusGroups.pending.length}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 mr-2">
                            Processing: {statusGroups.processing.length}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 mr-2">
                            Approved: {statusGroups.approved.length}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 mr-2">
                            Rejected: {statusGroups.rejected.length}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 mr-2">
                            Closed: {statusGroups.closed.length}
                          </span>
                        </p>
                      </div>

                      {/* Loan Categories */}
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
                        title="Rejected Applications"
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
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">
                          {filter === "application submitted"
                            ? "Pending"
                            : filter === "processing"
                            ? "Processing"
                            : filter === "approved"
                            ? "Approved"
                            : filter === "rejected"
                            ? "Rejected"
                            : filter === "closed"
                            ? "Closed"
                            : "Filtered"}{" "}
                          Loans
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                          {loans.length} {loans.length === 1 ? "loan" : "loans"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loans.map((loan) => (
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
                    <div className="flex items-center justify-between">
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
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                      >
                        Apply Now <ChevronRight className="ml-1 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <NoLoansView />
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Loans;
