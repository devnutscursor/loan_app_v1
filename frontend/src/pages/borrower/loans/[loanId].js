import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { LoanService } from "../../../services";
// Import lucide icons
import {
  FileText,
  User,
  Home,
  Users,
  Wallet,
  ClipboardList,
  FileCheck,
  Award,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Trophy,
} from "lucide-react";
// Import our card components
import LoanSummaryCard from "../../../components/borrower/loan/LoanSummaryCard";
import BorrowerInfoCard from "../../../components/borrower/loan/BorrowerInfoCard";
import PropertyCard from "../../../components/borrower/loan/PropertyCard";
import FinancialInfoCard from "../../../components/borrower/loan/FinancialInfoCard";
import PropertiesOwnedCard from "../../../components/borrower/loan/PropertiesOwnedCard";
import MilitaryServiceCard from "../../../components/borrower/loan/MilitaryServiceCard";
// DocumentsCard is managed through a separate page, not needed here
import DemographicsCard from "../../../components/borrower/loan/DemographicsCard";
import DeclarationsCard from "../../../components/borrower/loan/DeclarationsCard";
import LoanMilestones from "../../../components/borrower/loan/LoanMilestones";

const LoanDetails = () => {
  const router = useRouter();
  const { loanId, tab } = router.query;
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Define the tab structure
  const mainTabs = [
    { id: "overview", label: "Loan Overview", icon: FileText },
    { id: "borrower", label: "Borrower Info", icon: User },
    { id: "property", label: "Property", icon: Home },
    { id: "financial", label: "Financial Info", icon: Wallet },
    { id: "declarations", label: "Declarations", icon: ClipboardList },
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "military", label: "Military Service", icon: Briefcase },
  ];

  // Update active tab from URL when component mounts or URL changes
  useEffect(() => {
    if (router.isReady && tab) {
      const isValidTab = mainTabs.some((t) => t.id === tab);
      if (isValidTab) {
        setActiveTab(tab);
      }
    }
  }, [router.isReady, tab]);

  useEffect(() => {
    // Don't fetch until loanId is available
    if (!loanId) return;

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching loan details for ID:", loanId);

        const response = await LoanService.getLoan(loanId);
        console.log("Loan details response:", response);

        if (response.success) {
          // Extract loan data, handling different response structures
          const loanData = response.data?.loan || response.data.data;
          // Enrich interest rate and term from nested loanParameters / program
          if (loanData?.loanParameters) {
            const { interestRate, selectedProgramId } = loanData.loanParameters;
            if (interestRate && !loanData.loanDetails?.interestRate) {
              loanData.loanDetails = { ...loanData.loanDetails, interestRate };
            }
            // Determine loan term
            if (!loanData.loanDetails?.loanTerm) {
              let loanTerm = null;

              // 1. Directly from loanParameters
              if (loanData.loanParameters.loanTerm) {
                loanTerm = loanData.loanParameters.loanTerm;
              }
              // 2. Populated selectedProgramId object
              else if (selectedProgramId?.loanTerm) {
                loanTerm = selectedProgramId.loanTerm;
              }
              // 3. Fetch LoanProgram by ID
              else if (selectedProgramId) {
                try {
                  const programRes = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/loan-programs/${selectedProgramId}?_=${Date.now()}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                  );
                  loanTerm = programRes.data?.data?.loanProgram?.loanTerm || null;
                } catch (progErr) {
                  console.warn('Unable to fetch loan program term', progErr);
                }
              }
              if (loanTerm) {
                loanData.loanDetails = { ...loanData.loanDetails, loanTerm };
              }
            }
          }
          
          // Fetch milestone data to calculate loan progress
          try {
            const milestonesResponse = await LoanService.getLoanMilestones(loanId);
            
            if (milestonesResponse.success) {
              // Use either the API-provided overallProgress or calculate it from milestones
              let milestoneProgress = 0;
              
              if (typeof milestonesResponse.data?.overallProgress === 'number') {
                milestoneProgress = milestonesResponse.data.overallProgress;
                console.log(`Loan ${loanId}: Using API-provided milestone progress: ${milestoneProgress}%`);
              } else if (milestonesResponse.data?.milestones?.length > 0) {
                const milestones = milestonesResponse.data.milestones;
                milestoneProgress = LoanService.calculateMilestoneProgress(milestones);
                console.log(`Loan ${loanId}: Calculated milestone progress: ${milestoneProgress}%`);
              }
              
              // Update loan data with milestone progress and milestones
              loanData.milestoneProgress = milestoneProgress;
              loanData.milestones = milestonesResponse.data?.milestones || [];
              
              // Debug the loan data after enhancing with milestone progress
              console.log(`Enhanced loan ${loanId} with milestoneProgress=${milestoneProgress}`, {
                hasLoanData: !!loanData,
                hasOverallProgressInResponse: typeof milestonesResponse.data?.overallProgress === 'number',
                overallProgressInResponse: milestonesResponse.data?.overallProgress,
                milestoneProgressAppliedToLoan: loanData.milestoneProgress
              });
            }
          } catch (milestonesError) {
            console.error(`Error fetching milestones for loan ${loanId}:`, milestonesError);
            // Continue with loan data even if milestone fetch fails
          }
          
          // Set the loan data with milestones if available
          setLoan(loanData);
        } else {
          console.warn("Failed to fetch loan details:", response.message);
          setError(response.message || "Failed to load loan details");
          toast.error(response.message || "Failed to load loan details");
        }
      } catch (error) {
        console.error("Error fetching loan details:", error);
        setError("An error occurred while loading the loan details");
        toast.error("Failed to load loan details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [loanId]);

  // Handle tab click
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    router.push(`/borrower/loans/${loanId}?tab=${tabId}`, undefined, {
      shallow: true,
    });
  };

  const handleRemoveDocument = async (documentId) => {
    if (!documentId || !loanId) return;

    try {
      const confirmed = window.confirm(
        "Are you sure you want to remove this document?"
      );
      if (!confirmed) return;

      const response = await LoanService.removeDocument(loanId, documentId);

      if (response.success) {
        toast.success("Document removed successfully");
        // Update loan state to reflect the document removal
        setLoan((prevLoan) => ({
          ...prevLoan,
          documents: prevLoan.documents.filter((doc) => doc._id !== documentId),
        }));
      } else {
        toast.error(response.message || "Failed to remove document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document. Please try again.");
    }
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    status = status.toLowerCase();
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Loading skeleton for the tabs
  const TabsSkeleton = () => (
    <div className="w-60 flex-shrink-0 mr-6 animate-pulse">
      <div className="rounded-xl bg-white p-3 shadow-md border border-gray-100">
        <div className="flex flex-col space-y-2">
          {[1, 2, 3, 4, 5, 6].map((tab) => (
            <div key={tab} className="py-3 px-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Content skeleton based on active tab
  const ContentSkeleton = () => (
    <div className="flex-1">
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute roles={["borrower", "admin"]}>
      <MainLayout
        title={loan ? `Loan ${loan.loanNumber || ""}` : "Loan Details"}
        noSidebarMargin={true}
      >
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/borrower/loans"
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      Loan Application
                      {loan && loan.loanNumber && (
                        <div className="ml-3 px-2.5 py-1 bg-blue-50 rounded-md flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-800">
                            {loan.loanNumber}
                          </span>
                        </div>
                      )}
                    </h1>
                  </div>
                  <div className="mt-2 flex items-center">
                    {loan && loan.status && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          loan.status
                        )}`}
                      >
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-current"></span>
                        {loan.status.charAt(0).toUpperCase() +
                          loan.status.slice(1)}
                      </span>
                    )}
                    {loan && loan.applicationDate && (
                      <span className="ml-4 text-sm text-gray-500 flex items-center">
                        <svg
                          className="mr-1 h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Submitted{" "}
                        {formatDate(loan.applicationDate || loan.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                {loan && (
                  <div className="flex items-center space-x-3">
                    {/* Management buttons in a more compact design */}
                    <div className="flex space-x-3 mr-1">
                      <Link
                        href={`/borrower/documents?loanId=${loan._id}`}
                        className="relative inline-flex items-center p-2 border border-blue-200 rounded-full text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 group"
                        aria-label="Manage Documents"
                      >
                        <svg
                          className="h-5 w-5"
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
                        <span className="absolute bottom-full mb-2 w-auto min-w-max left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Manage Documents
                        </span>
                      </Link>

                      <Link
                        href={`/borrower/milestones?loanId=${loan._id}`}
                        className="relative inline-flex items-center p-2 border border-blue-200 rounded-full text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 group"
                        aria-label="Manage Milestones"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                        <span className="absolute bottom-full mb-2 w-auto min-w-max left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Manage Milestones
                        </span>
                      </Link>
                    </div>

                    {/* Edit Application button - disabled if editing is not allowed by lender */}
                    {loan.editingEnabled !== false ? (
                      <Link
                        href={`/borrower/apply?draft=${loan.loanNumber}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <svg
                          className="-ml-1 mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit this Application
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-gray-400 bg-gray-200 cursor-not-allowed transition-colors duration-200"
                        title="Editing has been disabled by the lender"
                      >
                        <svg
                          className="-ml-1 mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit this Application
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex">
                <TabsSkeleton />
                <ContentSkeleton />
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error loading loan details
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : loan ? (
              <div className="flex">
                {/* Vertical Tabs Navigation */}
                <div className="w-60 flex-shrink-0 mr-6">
                  <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100 sticky top-4">
                    <nav className="flex flex-col space-y-2" aria-label="Tabs">
                      {mainTabs.map((tab) => {
                        const isActive = tab.id === activeTab;

                        // Skip Military tab if no military service data
                        if (tab.id === "military" && !loan.militaryService) {
                          return null;
                        }

                        return (
                          <div key={tab.id} className="group">
                            <button
                              onClick={() => handleTabClick(tab.id)}
                              className={`
                              relative w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium
                              transform transition-all duration-300 ease-in-out
                              ${
                                isActive
                                  ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                              }
                            `}
                            >
                              <div className="flex items-center">
                                <span
                                  className={`mr-3 transition-all duration-300 ${
                                    isActive
                                      ? "text-blue-700 opacity-100 scale-110"
                                      : "opacity-70 group-hover:opacity-90"
                                  }`}
                                >
                                  <tab.icon
                                    className={`h-5 w-5 ${
                                      isActive ? "drop-shadow-sm" : ""
                                    }`}
                                  />
                                </span>
                                <span
                                  className={isActive ? "font-semibold" : ""}
                                >
                                  {tab.label}
                                </span>
                              </div>

                              {/* Active indicator with enhanced styling */}
                              {isActive && (
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <LoanSummaryCard
                      loan={loan}
                      formatCurrency={formatCurrency}
                    />
                  )}

                  {/* Borrower Tab */}
                  {activeTab === "borrower" && (
                    <BorrowerInfoCard borrowerDetails={loan.borrowerDetails} />
                  )}

                  {/* Property Tab */}
                  {activeTab === "property" && (
                    <PropertyCard
                      property={loan.property}
                      formatCurrency={formatCurrency}
                    />
                  )}

                  {/* Financial Tab */}
                  {activeTab === "financial" && (
                    <div className="space-y-6">
                      <FinancialInfoCard
                        loan={loan}
                        formatCurrency={formatCurrency}
                      />
                      <PropertiesOwnedCard
                        loan={loan}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  )}

                  {/* Declarations Tab */}
                  {activeTab === "declarations" && (
                    <div className="space-y-6">
                      {loan.declarations && (
                        <DeclarationsCard
                          loan={loan}
                          formatCurrency={formatCurrency}
                        />
                      )}
                    </div>
                  )}
                  {activeTab === "demographics" && (
                    <div className="space-y-6">
                      {loan.demographics && <DemographicsCard loan={loan} />}
                    </div>
                  )}
                  {/* Military Service Tab */}
                  {activeTab === "military" && (
                    <div className="space-y-6">
                      {loan.militaryService && (
                        <MilitaryServiceCard
                          loan={loan}
                          formatDate={formatDate}
                        />
                      )}
                    </div>
                  )}

                  {/* Documents are managed separately via the documents page */}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No loan found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This loan doesn't exist or you don't have permission to view
                  it.
                </p>
                <div className="mt-6">
                  <Link
                    href="/borrower/loans"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Return to Loans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LoanDetails;
