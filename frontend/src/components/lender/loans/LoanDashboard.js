import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { DocumentService } from "../../../services/";
import { lenderService } from "../../../services/api";
// ...other imports
import {
  User as UserIcon,
  FileText,
  Table as TableIcon,
  Copy as DocumentDuplicateIcon,
  // Add these icons
  CheckCircle,
  CheckCircle2,
  Calendar,
  BadgePercent, // For Loan Qualification Card
  Home,
  Flag,
  Users, // For Dependents section
  Briefcase,
  Pencil,
  AlertCircle,
} from "lucide-react";
import LoanQualificationCard from "@/components/lender/loans/LoanQualificationCard";
// Add milestone service import
import milestoneService from "../../../services/api/milestone.service";
import { loanCompensationService } from "../../../services/mcr.service";

const LoanDashboard = ({ loan, setLoan, fetchLoanDetails, id, documents, milestones: propMilestones }) => {
  // Use milestones from props instead of local state
  const [milestones, setMilestones] = useState(propMilestones || []);
  const [loadingMilestones, setLoadingMilestones] = useState(true); // Start with loading true
  const [milestoneError, setMilestoneError] = useState(null);
  const [loanConditions, setLoanConditions] = useState([]);
  const [compensation, setCompensation] = useState(null);
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

      // console.log("Calculating document stats...");
      // console.log("Documents:", documents);
      // Determine required documents based on active loan conditions (what lender has actually requested)
      const totalRequired = Array.isArray(loanConditions) ? loanConditions.length : 0;

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

  // Load loan conditions for this loan (used to determine how many documents are actually required)
  useEffect(() => {
    const loadConditions = async () => {
      if (!id) return;
      try {
        const res = await lenderService.getLoanConditions(id);
        // Backend returns { status, count, data }
        const data = res?.data || res?.conditions || [];
        setLoanConditions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading loan conditions:", err);
        setLoanConditions([]);
      }
    };
    loadConditions();
  }, [id]);

  // Calculate document stats when documents or conditions change
  useEffect(() => {
    calculateDocumentStats();
  }, [documents, loanConditions]);

  // Load compensation for Key Dates
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await loanCompensationService.getCompensation(id);
        if (!cancelled) setCompensation(res.data);
      } catch (err) {
        if (!cancelled) console.error("Error loading compensation:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Update milestones when prop changes
  useEffect(() => {
    console.log("🔍 [DEBUG] LoanDashboard - propMilestones changed:", propMilestones);
    console.log("🔍 [DEBUG] LoanDashboard - propMilestones type:", typeof propMilestones);
    console.log("🔍 [DEBUG] LoanDashboard - propMilestones length:", Array.isArray(propMilestones) ? propMilestones.length : 'Not an array');
    
    if (propMilestones) {
      setMilestones(propMilestones);
      setLoadingMilestones(false);
      setMilestoneError(null);
      console.log("🔍 [DEBUG] LoanDashboard - Milestones updated from props");
    } else {
      console.log("🔍 [DEBUG] LoanDashboard - No milestones prop provided");
    }
  }, [propMilestones]);

  // Milestones are now fetched with the main loan data, so we don't need separate fetching
  // The milestones will be passed as props from the parent component

  // Add function to calculate milestone counts
  const getMilestoneStats = () => {
    console.log("🔍 [DEBUG] getMilestoneStats - milestones:", milestones);
    console.log("🔍 [DEBUG] getMilestoneStats - milestones length:", milestones?.length);
    
    if (!milestones || milestones.length === 0) {
      console.log("🔍 [DEBUG] getMilestoneStats - No milestones, returning zeros");
      return {
        completed: 0,
        total: 0,
        percent: 0,
      };
    }

    const completedCount = milestones.filter(
      (m) => m.status === "completed"
    ).length;
    
    const stats = {
      completed: completedCount,
      total: milestones.length,
      percent:
        milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0,
    };
    
    console.log("🔍 [DEBUG] getMilestoneStats - calculated stats:", stats);
    return stats;
  };

  // Get milestone statistics
  const milestoneStats = getMilestoneStats();

  // Status pipeline (Loan Hub timeline)
  const statusPipeline = [
    { code: "Pre-Qualification", label: "Pre-Qual" },
    { code: "Application Started", label: "App Started" },
    { code: "Application Submitted", label: "App Submitted" },
    { code: "Processing", label: "Processing" },
    { code: "Conditional Approval", label: "Cond. Approval" },
    { code: "Approved-Not-Accepted", label: "Appr. Not Accepted" },
    { code: "Clear to Close", label: "Clear to Close" },
    { code: "Closed", label: "Closed" },
    { code: "Funded", label: "Funded" },
  ];
  const currentStatusIndex = statusPipeline.findIndex(s => s.code === loan?.status);
  const isTerminalStatus = ["Declined", "Withdrawn", "Closed-Incomplete"].includes(loan?.status);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

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
      {/* Status pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {!isTerminalStatus && (
          <div className="relative">
            <div className="flex items-center justify-between">
              {statusPipeline.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={step.code} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`mt-1 text-[10px] text-center leading-tight ${
                      isCurrent ? "font-bold text-blue-700" : "text-gray-500"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStatusIndex / (statusPipeline.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {isTerminalStatus && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-sm text-red-700">
              This loan has been <strong>{loan?.status}</strong>.
            </span>
          </div>
        )}
      </div>

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
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <TableIcon className="h-4 w-4 text-blue-500 mr-2" />
                Loan Status
              </h3>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    loan?.status
                  )}`}
                >
                  {loan?.status?.toLowerCase() === 'conditional approval' ? 'APPROVED' : 
                   loan?.status?.toLowerCase() === 'declined' ? 'REJECTED' :
                   loan?.status?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-[10px] sm:text-xs">Loan Number</span>
                    <span className="font-medium text-[10px] sm:text-xs">
                      {loan?.loanNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 sm:text-xs text-[10px]">Loan Type</span>
                    <span className="font-medium text-[10px] sm:text-xs">
                      {loan?.loanDetails?.loanType || "Not specified"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-[10px] sm:text-xs">Approval Type</span>
                    <span className="font-medium text-[10px] sm:text-xs">
                      {loan?.approvalType || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-[10px] sm:text-xs">
                      Application Date
                    </span>
                    <span className="font-medium text-[10px] sm:text-xs">
                      {loan?.createdAt
                        ? new Date(loan.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium">
                      {loan?.updatedAt
                        ? new Date(loan.updatedAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Property Information Section - with improved spacing */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center mb-3">
                  <Home className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Information
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Property Type
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.property?.propertyType || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Property Value
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.property?.propertyValue
                          ? currencyFormatter.format(
                              loan.property.propertyValue
                            )
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Occupancy</span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.property?.occupancyType || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Year Built</span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.property?.yearBuilt || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Progress */}
              {/* <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application Progress
                  </div>
                  <div className="text-xs font-medium">
                    {loan?.completionPercentage || 0}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${loan?.completionPercentage || 0}%` }}
                  ></div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Key Dates */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center">
              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
              <h3 className="text-base font-medium text-gray-900">Key Dates</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Application Date</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.applicationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Approval Date</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.approvalDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Rate Lock Date</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.rateLockDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Clear to Close</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.clearToCloseDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Closing Date</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.closingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Funded Date</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.fundedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Lock Expiry</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(compensation?.rateLockExpiry)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] sm:text-xs">Created</span>
                  <span className="font-medium text-[10px] sm:text-xs">{formatDate(loan?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Information Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <UserIcon className="h-4 w-4 text-blue-500 mr-2" />
                Borrower Information
              </h3>
              <Link
                href={`/lender/loans/${id}?tab=borrower`}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <svg
                  className="ml-1 h-4 w-4 rotate-[315deg]"
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
            <div className="p-4">
              {/* Borrower Header with Avatar */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-base">
                    {loan?.borrowerDetails?.firstName
                      ? `${loan.borrowerDetails.firstName} ${
                          loan.borrowerDetails.middleName || ""
                        } ${loan.borrowerDetails.lastName || ""} ${
                          loan.borrowerDetails.suffix || ""
                        }`
                      : "Unknown"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {loan?.borrowerDetails?.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center mb-3">
                  <UserIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal Information
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Date of Birth
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.dateOfBirth
                          ? new Date(
                              loan.borrowerDetails.dateOfBirth
                            ).toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Marital Status
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.maritalStatus ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Phone</span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.phone || "Not provided"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">SSN</span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.ssn || "Not available"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">Citizenship</span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.citizenship || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        First-Time Buyer
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.declarations?.firstTimeBuyer ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center mb-3">
                  <Home className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Address
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-y-1.5 mb-2">
                  <div className="text-sm">
                    <div className="text-[10px] sm:text-xs">
                      <span className="font-medium text-gray-900">
                        {loan?.borrowerDetails?.currentAddress?.streetAddress ||
                          ""}{" "}
                        {loan?.borrowerDetails?.currentAddress?.aptSteNum || ""}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs">
                      <span className="text-gray-700">
                        {loan?.borrowerDetails?.currentAddress?.city || ""},{" "}
                        {loan?.borrowerDetails?.currentAddress?.state || ""}{" "}
                        {loan?.borrowerDetails?.currentAddress?.zipCode || ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Time at Address
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.currentAddress
                          ?.yearsAtAddress || 0}{" "}
                        years,{" "}
                        {loan?.borrowerDetails?.currentAddress
                          ?.monthsAtAddress || 0}{" "}
                        months
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center mb-3">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employment & Income
                  </div>
                </div>

                {/* Display Employer info if available */}
                {loan?.borrowerDetails?.employers &&
                  loan.borrowerDetails.employers.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] sm:text-xs font-medium">
                        {loan.borrowerDetails.employers[0].companyName || ""}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-2">
                        {loan.borrowerDetails.employers[0].jobTitle || ""}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Monthly Income
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.income?.baseIncome
                          ? currencyFormatter.format(loan.income.baseIncome)
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Total Monthly Income
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.financialCalculations?.totalIncome
                          ? currencyFormatter.format(
                              loan.financialCalculations.totalIncome
                            )
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px] sm:text-xs">
                        Total Monthly Debts
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.financialCalculations?.totalDebts
                          ? currencyFormatter.format(
                              loan.financialCalculations.totalDebts
                            )
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">
                        Years in Profession
                      </span>
                      <span className="font-medium text-[10px] sm:text-xs">
                        {loan?.borrowerDetails?.employers &&
                        loan.borrowerDetails.employers.length > 0
                          ? `${
                              loan.borrowerDetails.employers[0]
                                .yearsInProfession || 0
                            } years, ${
                              loan.borrowerDetails.employers[0]
                                .monthsInProfession || 0
                            } months`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dependents Section (if any) */}
              {loan?.borrowerDetails?.dependents &&
                loan.borrowerDetails.dependents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center mb-3">
                      <Users className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dependents: {loan.borrowerDetails.dependents.length}
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600">
                      {loan.borrowerDetails.dependents.map((dep, idx) => (
                        <span key={dep._id} className="inline-block mr-3">
                          {dep.name} ({dep.age})
                          {idx < loan.borrowerDetails.dependents.length - 1
                            ? ","
                            : ""}
                        </span>
                      ))}
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
                <h3 className="text-base font-medium text-gray-900 flex items-center">
                  <BadgePercent className="h-4 w-4 text-blue-500 mr-2" />
                  Loan Qualification Scenario
                </h3>
              </div>
              <div>
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
          {/* Milestones Progress Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <Flag className="h-4 w-4 text-blue-500 mr-2" />
                Milestones Progress
              </h3>
              <Link
                href={`/lender/loans/${id}?tab=milestones`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <span>View All</span>
                <svg
                  className="h-4 w-4 -rotate-45" /* -45° = 315° */
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
            <div className="p-4">
              {(() => {
                console.log("🔍 [DEBUG] Rendering milestones section - loadingMilestones:", loadingMilestones);
                console.log("🔍 [DEBUG] Rendering milestones section - milestones:", milestones);
                console.log("🔍 [DEBUG] Rendering milestones section - milestones.length:", milestones?.length);
                return null;
              })()}
              {loadingMilestones ? (
                <div className="space-y-4">
    {/* Skeleton for milestone stats */}
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-14 h-7 bg-gray-200 rounded animate-pulse mr-2"></div>
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="flex items-center">
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    {/* Skeleton for progress bar */}
    <div className="mt-3">
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2"></div>
    </div>

    {/* Skeleton for milestone cards */}
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-grow basis-0 min-w-[45%] bg-gray-100 rounded-md p-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full mr-2 flex-shrink-0 mt-0.5 animate-pulse"></div>
          <div className="overflow-hidden w-full">
            <div className="h-3 bg-gray-200 rounded w-20 mb-1.5 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex flex-grow basis-0 min-w-[45%] bg-gray-100 rounded-md p-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full mr-2 flex-shrink-0 mt-0.5 animate-pulse"></div>
          <div className="overflow-hidden w-full">
            <div className="h-3 bg-gray-200 rounded w-16 mb-1.5 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
              ) : milestoneError ? (
                <div className="text-center text-xs text-red-500 py-2">
                  {milestoneError}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="text-xl font-bold text-blue-600 mr-2">
                        {milestoneStats.completed}/{milestoneStats.total}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Milestones Completed
                      </p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-[10px] sm:text-xs font-medium">
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
                    <div className="mt-4">
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
                            <div className="text-[10px] sm:text-xs text-gray-500">
                              No milestones in progress
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-wrap gap-3">
                            {latestCompleted && (
                              <div className="flex flex-grow basis-0 min-w-[45%] bg-green-50 rounded-md p-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="overflow-hidden">
                                  <div className="text-green-700 text-[10px] sm:text-xs font-medium">
                                    Last completed:
                                  </div>
                                  <div className="text-green-700 text-[10px] sm:text-xs truncate">
                                    {latestCompleted.name}
                                  </div>
                                </div>
                              </div>
                            )}

                            {latestInProgress && (
                              <div className="flex flex-grow basis-0 min-w-[45%] bg-blue-50 rounded-md p-2">
                                <Calendar className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="overflow-hidden">
                                  <div className="text-blue-700 text-[10px] sm:text-xs font-medium">
                                    In progress:
                                  </div>
                                  <div className="text-blue-700 text-[10px] sm:text-xs truncate">
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
          {/* Documents Status */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 text-blue-500 mr-2" />
                Documents Status
              </h3>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
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
                        <div className="text-[10px] sm:text-xs text-gray-500">Required</div>
                        <div className="text-xs font-semibold">
                          {documentStats.required}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 transition-all hover:bg-gray-100">
                        <div className="text-[10px] sm:text-xs text-gray-500">Submitted</div>
                        <div className="text-xs font-semibold">
                          {documentStats.submitted}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 transition-all hover:bg-gray-100">
                        <div className="text-[10px] sm:text-xs text-gray-500">Approved</div>
                        <div className="text-xs font-semibold">
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
                        <div className="text-[10px] sm:text-xs text-gray-500">Progress</div>
                        <div className="text-xs font-semibold flex items-center">
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
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
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
      </div>
    </div>
  );
};

export default LoanDashboard;
