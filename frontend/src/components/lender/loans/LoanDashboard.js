import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { DocumentService } from "../../../services/";
import { standardDocumentRequirements } from "../../../data/documentRequirements";
// ...other imports
import {
  User as UserIcon,
  FileText,
  Table as TableIcon,
  Copy as DocumentDuplicateIcon,
  // Add these icons
  CheckCircle,
  Calendar,
} from "lucide-react";
import LoanQualificationCard from "@/components/lender/loans/LoanQualificationCard";
// Add milestone service import
import milestoneService from "../../../services/api/milestone.service";

const LoanDashboard = ({ loan, setLoan, fetchLoanDetails, id, documents }) => {
  // Add state for milestones
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [milestoneError, setMilestoneError] = useState(null);
  // ...existing state
  const [documentStats, setDocumentStats] = useState({
    required: 0,
    submitted: 0,
    approved: 0,
    completionRate: 0,
  });
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Calculate document statistics
  const calculateDocumentStats = () => {
    try {
      setLoadingDocuments(true);

      console.log("Calculating document stats...");
      console.log("Documents:", documents);
      console.log(
        "Standard Document Requirements:",
        standardDocumentRequirements
      );
      // Get total required documents from standard requirements
      const totalRequired = standardDocumentRequirements.length;

      // Count unique document submissions by category+type
      const uniqueDocTypes = new Set();
      const uniqueApprovedTypes = new Set();

      if (documents && documents.length > 0) {
        documents.forEach((doc) => {
          const docIdentifier = `${doc.category}-${doc.documentType}`;
          uniqueDocTypes.add(docIdentifier);

          if (doc.status && doc.status.toLowerCase() === "approved") {
            uniqueApprovedTypes.add(docIdentifier);
          }
        });
      }

      const totalSubmitted = uniqueDocTypes.size;
      const approvedDocs = uniqueApprovedTypes.size;

      // Calculate completion rate
      const completionRate =
        totalRequired > 0
          ? Math.round((totalSubmitted / totalRequired) * 100)
          : 0;

      setDocumentStats({
        required: totalRequired,
        submitted: totalSubmitted,
        approved: approvedDocs,
        completionRate: completionRate > 100 ? 100 : completionRate,
      });
    } catch (error) {
      console.error("Error calculating document stats:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Calculate document stats when documents prop changes
  useEffect(() => {
    calculateDocumentStats();
  }, [documents]);

  // Add function to fetch milestones
  const fetchMilestones = async () => {
    if (!id) return;

    try {
      setLoadingMilestones(true);
      setMilestoneError(null);
      const response = await milestoneService.getLoanMilestones(id);

      if (response.status === "success") {
        setMilestones(response.data.milestones || []);
      } else {
        setMilestoneError("Failed to load milestones");
        console.error("Error fetching milestones:", response);
      }
    } catch (err) {
      console.error("Error loading milestones:", err.message);
      setMilestoneError(err.message || "Error loading milestones");
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Add useEffect to fetch milestones when component mounts
  useEffect(() => {
    if (id) {
      fetchMilestones();
    }
  }, [id]);

  // Add function to calculate milestone counts
  const getMilestoneStats = () => {
    if (!milestones || milestones.length === 0) {
      return {
        completed: 0,
        total: 0,
        percent: 0,
      };
    }

    const completedCount = milestones.filter(
      (m) => m.status === "completed"
    ).length;
    return {
      completed: completedCount,
      total: milestones.length,
      percent:
        milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0,
    };
  };

  // Get milestone statistics
  const milestoneStats = getMilestoneStats();

  // Helper for currency formatting
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  // Helper to get status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Loan Summary Card */}
          {/* <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Loan Summary</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Loan Amount</p>
                <p className="font-medium">
                  {loan?.loanDetails?.loanAmount 
                    ? currencyFormatter.format(loan.loanDetails.loanAmount) 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Interest Rate</p>
                <p className="font-medium">
                  {loan?.loanDetails?.interestRate 
                    ? `${loan.loanDetails.interestRate}%` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Term</p>
                <p className="font-medium">
                  {loan?.loanDetails?.term 
                    ? `${loan.loanDetails.term} months` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Monthly Payment</p>
                <p className="font-medium">
                  {loan?.loanDetails?.estimatedMonthlyPayment 
                    ? currencyFormatter.format(loan.loanDetails.estimatedMonthlyPayment) 
                    : 'Not calculated'}
                </p>
              </div>
            </div>
          </div> */}

          {/* Loan Status Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
                Loan Status
              </h3>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      loan?.status
                    )}`}
                  >
                    {loan?.status?.toUpperCase() || "UNKNOWN"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Last updated:{" "}
                  {loan?.updatedAt
                    ? new Date(loan.updatedAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Loan ID</span>
                  <span className="font-medium">{loan?._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Application Date</span>
                  <span className="font-medium">
                    {loan?.createdAt
                      ? new Date(loan.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loan Type</span>
                  <span className="font-medium">
                    {loan?.loanDetails?.loanType || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Information Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
                Borrower Information
              </h3>
            </div>
            <div className="p-4 text-sm">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {loan?.borrowerDetails?.firstName
                      ? `${loan.borrowerDetails.firstName} ${
                          loan.borrowerDetails.middleName || ""
                        } ${loan.borrowerDetails.lastName || ""}`
                      : "Unknown"}
                  </p>
                  <p className="text-gray-500">
                    {loan?.borrowerDetails?.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">
                    {loan?.borrowerDetails?.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">SSN</p>
                  <p className="font-medium">
                    {loan?.borrowerDetails?.ssn || "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Documents Status */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 text-blue-500 mr-2" />
                Documents Status
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  documentStats.completionRate >= 100
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {documentStats.completionRate >= 100
                  ? "Complete"
                  : "In Progress"}
              </span>
            </div>
            <div className="p-4">
              {loadingDocuments ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-5 bg-gray-100 rounded w-3/4"></div>
                  <div className="animate-pulse h-5 bg-gray-100 rounded w-2/3 mt-2"></div>
                  <div className="animate-pulse h-3 bg-gray-100 rounded w-full mt-4"></div>
                </div>
              ) : (
                <div>
                  {/* Progress Circle and Stats */}
                  <div className="flex items-center mb-4">
                    {/* Visual progress indicator */}
                    <div className="relative w-16 h-16 mr-4 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#edf2f7"
                          strokeWidth="3"
                        ></circle>
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray={100}
                          strokeDashoffset={100 - documentStats.completionRate}
                          transform="rotate(-90 18 18)"
                          strokeLinecap="round"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {documentStats.completionRate}%
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2 transition-all hover:bg-gray-100">
                        <div className="text-xs text-gray-500">Required</div>
                        <div className="font-semibold">
                          {documentStats.required}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 transition-all hover:bg-gray-100">
                        <div className="text-xs text-gray-500">Submitted</div>
                        <div className="font-semibold">
                          {documentStats.submitted}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 transition-all hover:bg-gray-100">
                        <div className="text-xs text-gray-500">Approved</div>
                        <div className="font-semibold">
                          {documentStats.approved}
                        </div>
                      </div>
                      <div
                        className={`rounded p-2 transition-all ${
                          documentStats.submitted === 0
                            ? "bg-gray-50"
                            : documentStats.submitted < documentStats.required
                            ? "bg-amber-50"
                            : "bg-green-50"
                        }`}
                      >
                        <div className="text-xs text-gray-500">Progress</div>
                        <div className="font-semibold flex items-center">
                          <span>
                            {documentStats.submitted}/{documentStats.required}
                          </span>
                          {documentStats.submitted >=
                            documentStats.required && (
                            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-right">
                    <Link
                      href={`/lender/loans/${id}?tab=documents`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View All Documents
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="space-y-4">
          {/* Loan Qualification Card */}
          {loan && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900">
                  Loan Qualification
                </h3>
              </div>
              <div className="p-4">
                <LoanQualificationCard
                  loan={loan}
                  enablePolling={false}
                  onUpdate={(updatedLoan) => {
                    setLoan(updatedLoan);
                  }}
                />
              </div>
            </div>
          )}

          {/* Milestones Progress */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900">
                Milestones Progress
              </h3>
              <Link
                href={`/lender/loans/${id}?tab=milestones`}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            <div className="p-4">
              {loadingMilestones ? (
                <div className="flex justify-center items-center h-16">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : milestoneError ? (
                <div className="text-center text-sm text-red-500 py-2">
                  {milestoneError}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="text-xl font-bold text-blue-600 mr-2">
                        {milestoneStats.completed}/{milestoneStats.total}
                      </div>
                      <p className="text-sm text-gray-500">
                        Milestones Completed
                      </p>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>
                        {Math.round(milestoneStats.percent)}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${milestoneStats.percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {milestones.length > 0 && (
                    <div className="mt-4 text-sm">
                      {(() => {
                        // Find the latest completed milestone
                        const completedMilestones = milestones.filter(
                          (m) => m.status === "completed"
                        );
                        const latestCompleted =
                          completedMilestones.length > 0
                            ? [...completedMilestones].sort((a, b) => {
                                return (
                                  new Date(b.updatedAt || b.createdAt) -
                                  new Date(a.updatedAt || a.createdAt)
                                );
                              })[0]
                            : null;

                        // Find the latest in-progress milestone
                        const inProgressMilestones = milestones.filter(
                          (m) => m.status !== "completed"
                        );
                        const latestInProgress =
                          inProgressMilestones.length > 0
                            ? [...inProgressMilestones].sort((a, b) => {
                                return (
                                  new Date(b.updatedAt || b.createdAt) -
                                  new Date(a.updatedAt || a.createdAt)
                                );
                              })[0]
                            : null;

                        if (!latestCompleted && !latestInProgress) {
                          return (
                            <div className="mt-1 text-gray-500">
                              No milestones in progress
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-wrap gap-3">
                            {latestCompleted && (
                              <div className="flex flex-grow basis-0 min-w-[45%] bg-green-50 rounded-md p-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-1" />
                                <div className="overflow-hidden">
                                  <div className="text-green-700 font-medium">
                                    Last completed:
                                  </div>
                                  <div className="text-green-700 truncate text-sm">
                                    {latestCompleted.name}
                                  </div>
                                </div>
                              </div>
                            )}

                            {latestInProgress && (
                              <div className="flex flex-grow basis-0 min-w-[45%] bg-blue-50 rounded-md p-2">
                                <Calendar className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-1" />
                                <div className="overflow-hidden">
                                  <div className="text-blue-700 font-medium">
                                    In progress:
                                  </div>
                                  <div className="text-blue-700 truncate">
                                    {latestInProgress.name}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDashboard;
