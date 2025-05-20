import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Link from "next/link";
import MainLayout from "../../../components/layout/MainLayout";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { lenderService } from "../../../services/api";
import LoanDashboard from "../../../components/lender/loans/LoanDashboard";
import { MessageCircle, StickyNote, Download } from "lucide-react";
import {
  BarChart2,
  User,
  FileText,
  Home,
  Wallet,
  ClipboardList, // or ClipboardCheck if you prefer
  Files, // instead of FileStack
  Trophy, // or Flag if you prefer
  FileSpreadsheet, // For Application tab icon
  ChevronDown, // For accordion expand/collapse
  ChevronRight,
} from "lucide-react";
// Form components for editing
import PersonalDetails from "../../../components/forms/borrower/PersonalDetails";
import ResidenceHistory from "../../../components/forms/borrower/ResidenceHistory";
import PropertyInformation from "../../../components/forms/property/PropertyInformation";
import LoanDetailsForm from "../../../components/forms/property/LoanDetails";
import EmploymentHistory from "../../../components/forms/borrower/EmploymentHistory";
import Income from "../../../components/forms/financial/Income";
import Debts from "../../../components/forms/financial/Debts";
import Assets from "../../../components/forms/financial/Assets";
import PropertyOwned from "../../../components/forms/additional/PropertyOwned";
import MilitaryService from "../../../components/forms/additional/MilitaryService";
import Declarations from "../../../components/forms/declarations/Declarations";
import Demographics from "../../../components/forms/declarations/Demographics";

// Import document components
import DocumentsCard from "../../../components/borrower/loan/DocumentsCard";
import LenderDocumentRequirements from "../../../components/lender/documents/LenderDocumentRequirements";
import BorrowerScenarioTailwind from "../../../components/lender/loans/BorrowerScenarioTailwind";
import LoanMilestones from "../../../components/lender/loans/LoanMilestones";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const LoanDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard"); // Change this line
  // At the top of your component
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tabs where the bar should NOT show
  const NO_SAVE_TABS = ["dashboard", "documents", "milestones"];

  // Call this to cancel changes
  const handleCancel = () => {
    // Reset form fields to their original values
    // You may need to refetch or reset state here
    setHasUnsavedChanges(false);
  };

  // Save all changes to the loan
  const saveLoan = async () => {
    try {
      setSaving(true);
      await lenderService.updateLoan(id, loan);
      toast.success("Loan details saved successfully");
      setSaving(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving loan:", error);
      toast.error("Failed to save loan details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to normalize loan data structure
  const normalizeData = (loanData) => {
    return {
      borrowerDetails: loanData.borrowerDetails || {},
      loanDetails: loanData.loanDetails || {},
      property: loanData.property || {},
      income: loanData.income || {},
      assets: loanData.assets || [],
      debts: loanData.debts || [],
      propertiesOwned: loanData.propertiesOwned || [],
      declarations: loanData.declarations || {},
      demographics: loanData.demographics || {},
      militaryService: loanData.militaryService || {},
      ...loanData,
    };
  };

  // Add new state to track accordion expansion
  const [isApplicationExpanded, setIsApplicationExpanded] = useState(true);

  // Modify tabs structure to include Application tab
  const mainTabs = [
    { id: "dashboard", label: "Loan Dashboard", icon: BarChart2 },
    { id: "documents", label: "Documents", icon: Files },
    { id: "milestones", label: "Milestones", icon: Trophy },
    { id: "application", label: "Application", icon: FileSpreadsheet }, // New parent tab
  ];

  // Define sub-tabs under Application
  const applicationSubTabs = [
    { id: "borrower", label: "Borrower Information", icon: User },
    { id: "loan", label: "Loan Details", icon: FileText },
    { id: "property", label: "Property Information", icon: Home },
    { id: "financial", label: "Financial Information", icon: Wallet },
    { id: "additional", label: "Additional Information", icon: ClipboardList },
  ];
  // Create a flat array of all valid tabs for validation
  const allTabs = [
    ...mainTabs.map((tab) => tab.id),
    ...applicationSubTabs.map((tab) => tab.id),
  ];

  // Function to handle tab clicks with accordion logic
  const handleTabClick = (tabId) => {
    if (tabId === "application") {
      // Toggle the accordion state
      const newExpandedState = !isApplicationExpanded;
      setIsApplicationExpanded(newExpandedState);

      // Only handle navigation when opening
      if (newExpandedState) {
        const currentTabIsSubTab = applicationSubTabs.some(
          (tab) => tab.id === activeTab
        );

        if (!currentTabIsSubTab) {
          const firstSubTab = applicationSubTabs[0].id;
          setActiveTab(firstSubTab);
          router.push(`/lender/loans/${id}?tab=${firstSubTab}`, undefined, {
            shallow: true,
          });
        }
      } else {
        // When closing, set the active tab to "application" itself
        setActiveTab("application");
        router.push(`/lender/loans/${id}?tab=application`, undefined, {
          shallow: true,
        });
      }
    } else {
      router.push(`/lender/loans/${id}?tab=${tabId}`, undefined, {
        shallow: true,
      });
      setActiveTab(tabId);
    }
  };

  // Determine if a subtab is currently active
  const isSubTabActive = applicationSubTabs.some((tab) => tab.id === activeTab);

  // If so, make sure the accordion is expanded when page loads
  useEffect(() => {
    if (isSubTabActive && !isApplicationExpanded) {
      setIsApplicationExpanded(true);
    }
  }, [activeTab, isSubTabActive, isApplicationExpanded]);

  // Uncomment and modify this useEffect to handle tab changes from URL
  useEffect(() => {
    if (!router.isReady || !id) return;

    // Check if there's a tab in the URL query
    const tabFromUrl = router.query.tab;

    // Check if this is a valid tab
    const isValidTab = allTabs.includes(tabFromUrl);

    if (isValidTab) {
      // Set active tab based on URL query
      setActiveTab(tabFromUrl);

      // If it's a subtab, ensure the accordion is expanded
      if (applicationSubTabs.some((tab) => tab.id === tabFromUrl)) {
        setIsApplicationExpanded(true);
      }
    } else if (!tabFromUrl) {
      // If no tab is specified, use default tab and update URL
      router.push(`/lender/loans/${id}?tab=dashboard`, undefined, {
        shallow: true,
      });
    }
  }, [router.isReady, router.query, id]);

  // Inside the LoanDetails component, add a new state for parameters data
  const [parametersData, setParametersData] = useState(null);
  const [loadingParameters, setLoadingParameters] = useState(false);

  // Add a function to fetch the parameters data
  const fetchLoanParameters = async () => {
    if (!id) return;

    try {
      setLoadingParameters(true);
      // Replace this with your actual API call to get the parameters data
      const response = await lenderService.getLoanParameters(id);
      if (response && response.data) {
        setParametersData(response.data);
      }
    } catch (error) {
      console.error("Error fetching loan parameters:", error);
    } finally {
      setLoadingParameters(false);
    }
  };

  // Update the useEffect that fetches loan details to also fetch parameters
  useEffect(() => {
    // Your existing loan details fetching code

    // Then fetch parameters if tab is dashboard
    if (activeTab === "dashboard") {
      fetchLoanParameters();
    }
  }, [id, activeTab]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching loan details for ID:", id);

      const response = await lenderService.getLoan(id);
      console.log("Loan details response:", response);

      if (response && (response.data || response.data?.data)) {
        // Extract loan data, handling different response structures
        // Based on the API structure in memory, data is nested under response.data.data
        const loanData =
          response.data?.data?.loan || response.data?.data || response.data;
        console.log("Loan details:", loanData);

        // Ensure all required properties exist with defaults
        const normalizedData = {
          borrowerDetails: loanData.borrowerDetails || {},
          loanDetails: loanData.loanDetails || {},
          property: loanData.property || {},
          income: loanData.income || {},
          assets: loanData.assets || [],
          debts: loanData.debts || [],
          propertiesOwned: loanData.propertiesOwned || [],
          declarations: loanData.declarations || {},
          demographics: loanData.demographics || {},
          militaryService: loanData.militaryService || {},
          ...loanData,
        };

        // Add console logs to inspect data
        console.log("Normalized data structure:", normalizedData);
        console.log("Borrower details:", normalizedData.borrowerDetails);
        console.log("Loan details:", normalizedData.loanDetails);

        setLoan(normalizedData);

        // Fetch documents separately since they are stored in a different collection
        try {
          const docsResponse = await lenderService.getLoanDocuments(id);
          console.log("Documents response:", docsResponse);

          if (docsResponse && docsResponse.data) {
            // Extract documents, handling nested structure
            const docsData = docsResponse.data?.data || docsResponse.data;
            setDocuments(Array.isArray(docsData) ? docsData : []);
          }
        } catch (docError) {
          console.error("Error fetching loan documents:", docError);
          // Don't fail the whole page load just because documents failed
        }
      } else {
        console.warn("Failed to fetch loan details");
        setError("Failed to load loan details");
        toast.error("Failed to load loan details");
      }
    } catch (error) {
      console.error("Error fetching loan details:", error);
      setError("An error occurred while loading the loan details");
      toast.error("Failed to load loan details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Don't fetch until id is available
    if (!id) return;

    fetchLoanDetails();
  }, [id]);

  // Add this effect near your other useEffect hooks
  // useEffect(() => {
  //   if (!router.isReady || !id) return;

  //   // Check if there's a tab in the URL query
  //   const tabFromUrl = router.query.tab;

  //   // Check if this is a valid tab
  //   const isValidTab = tabs.some((tab) => tab.id === tabFromUrl);

  //   if (isValidTab) {
  //     // Set active tab based on URL query
  //     setActiveTab(tabFromUrl);
  //   } else if (!tabFromUrl) {
  //     // If no tab is specified, use default tab and update URL
  //     router.push(`/lender/loans/${id}?tab=dashboard`, undefined, {
  //       shallow: true,
  //     });
  //   }
  // }, [router.isReady, router.query, id]);

  const handleRemoveDocument = async (documentId) => {
    // Document removal is only for borrowers, but we can show a message here
    toast.info("Only borrowers can remove documents");
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

  // Handle form field changes with better null checks
  const handleFieldChange = (section, field, value) => {
    console.log(`Updating ${section}.${field} with:`, value);
    setHasUnsavedChanges(true);
    setLoan((prev) => {
      // Make sure the section exists
      const sectionData = prev[section] || {};

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value,
        },
      };
    });
  };

  // Handle nested field changes
  const handleNestedFieldChange = (section, nestedSection, field, value) => {
    console.log(`Updating ${section}.${nestedSection}.${field} with:`, value);

    setLoan((prev) => {
      // Make sure the section and nested section exist
      const sectionData = prev[section] || {};
      const nestedSectionData = sectionData[nestedSection] || {};

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [nestedSection]: {
            ...nestedSectionData,
            [field]: value,
          },
        },
      };
    });
  };

  return (
    <ProtectedRoute allowedRoles={["lender"]}>
      <MainLayout>
        <div className="">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">
                    {/* Back button skeleton */}
                    <div className="flex items-center px-2 py-1 rounded">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="ml-1 h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="block w-px h-5 bg-gray-200"></div>
                    {/* Title skeleton */}
                    <div className="h-7 w-48 bg-gray-200 rounded"></div>
                  </div>

                  {/* Loan info header skeleton */}
                  <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Loan icon skeleton */}
                      <div className="flex-shrink-0 bg-gray-200 rounded-md p-2 h-10 w-10"></div>
                      <div className="ml-2 min-w-0">
                        {/* Loan number skeleton */}
                        <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                        {/* Loan type skeleton */}
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    {/* Action buttons skeleton */}
                    <div className="flex items-center gap-1">
                      {/* Circular button skeletons */}
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-9 w-9 bg-gray-200 rounded-full"
                        ></div>
                      ))}
                      {/* Main action button skeleton */}
                      <div className="ml-2 h-9 w-40 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  {/* Tabs skeleton */}
                  <div className="w-60 flex-shrink-0 mr-6">
                    <div className="rounded-xl bg-white p-2 shadow-md border border-gray-100">
                      <div className="flex flex-col space-y-2">
                        {[1, 2, 3, 4].map((tab) => (
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

                  {/* Content area skeleton */}
                  <div className="flex-1">
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <div className="flex justify-between mb-4">
                        <div className="h-7 bg-gray-200 rounded w-48"></div>
                        <div className="h-7 bg-gray-200 rounded w-24"></div>
                      </div>

                      {/* Dashboard-like content skeleton */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                          {/* Card 1 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          </div>

                          {/* Card 2 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
                            <div className="flex items-center mb-3">
                              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                              <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Card 3 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="h-6 w-10 bg-gray-200 rounded mr-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4"></div>
                            <div className="flex gap-3">
                              <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                              <div className="flex-1 p-3 bg-gray-200 rounded"></div>
                            </div>
                          </div>

                          {/* Card 4 */}
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-36 mb-3"></div>
                            <div className="flex items-center mb-3">
                              <div className="h-16 w-16 rounded-full bg-gray-200 mr-3"></div>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              <>
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-3 min-h-[2.5rem]">
                    <Link
                      href="/lender/loans"
                      className="group flex items-center px-2 py-1 rounded hover:bg-gray-100 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-hover:text-primary transition"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-gray-500 group-hover:text-primary transition">
                        Go Back
                      </span>
                    </Link>
                    <span className="block w-px h-5 bg-gray-200"></span>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                      Loan Application Details
                    </h1>
                  </div>

                  <div className="bg-white shadow-sm rounded-lg mb-6 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 bg-primary rounded-md p-2">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <rect x="4" y="3" width="16" height="18" rx="2" />
                          <path d="M8 7h8M8 11h4M8 15h8" />
                          <text x="16" y="17" fontSize="8" fill="currentColor">
                            $
                          </text>
                        </svg>
                      </div>
                      <div className="ml-2 min-w-0">
                        <h2 className="text-lg font-semibold truncate text-gray-900">
                          Loan {loan?.loanNumber || ""}
                        </h2>
                        <p className="text-xs text-gray-500 truncate">
                          {loan?.loanDetails?.loanType || "Loan"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        title="Add Note"
                        onClick={() =>
                          toast.info("Add note feature coming soon")
                        }
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <StickyNote className="h-5 w-5" />
                      </button>
                      <button
                        title="Send Message"
                        onClick={() =>
                          toast.info("Send message feature coming soon")
                        }
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                      <button
                        title="Download 3.2/3.4 File"
                        onClick={() =>
                          toast.info(
                            "Download 3.2/3.4 file feature coming soon"
                          )
                        }
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        title="Download URLA"
                        onClick={() =>
                          toast.info("Download URLA PDF feature coming soon")
                        }
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          toast.success("Pre-approval letter sent to borrower")
                        }
                        className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition"
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="white"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2l4-4"
                          ></path>
                        </svg>
                        Send Pre-Approval Letter
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {/* Vertical Tabs Navigation */}
                  {/* Vertical Tabs Navigation */}
                  <div className="w-60 flex-shrink-0 mr-6">
                    <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100 sticky top-4">
                      <nav
                        className="flex flex-col space-y-2"
                        aria-label="Tabs"
                      >
                        {mainTabs.map((tab) => {
                          const isActive = tab.id === activeTab;
                          const isExpanded =
                            tab.id === "application" && isApplicationExpanded;
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
                                        ? "text-blue-600 opacity-100 scale-110"
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

                                {/* Show chevron only for Application tab */}
                                {tab.id === "application" && (
                                  <span className="text-gray-500 transition-transform duration-200">
                                    {isApplicationExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </span>
                                )}

                                {/* Active indicator with enhanced styling */}
                                {isActive && (
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-full shadow-sm animate-pulse-subtle"></span>
                                )}
                              </button>

                              {/* Display sub-tabs when Application is expanded */}
                              {tab.id === "application" && (
                                <div
                                  className={`
      pl-4 mt-2 space-y-1.5 overflow-hidden
      transition-[max-height,opacity,transform] duration-300 ease-in-out
      ${isApplicationExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
    `}
                                >
                                  {applicationSubTabs.map((subTab) => {
                                    const isSubActive = activeTab === subTab.id;
                                    return (
                                      <button
                                        key={subTab.id}
                                        onClick={() => {
                                          router.push(
                                            `/lender/loans/${id}?tab=${subTab.id}`,
                                            undefined,
                                            { shallow: true }
                                          );
                                          setActiveTab(subTab.id);
                                        }}
                                        className={`
            relative w-full flex items-center py-2.5 px-4 rounded-lg text-sm font-medium
            transform transition-all duration-300 ease-in-out
            ${
              isSubActive
                ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
            }
          `}
                                      >
                                        <span
                                          className={`
              mr-3 transition-all duration-300 ease-in-out
              ${
                isSubActive
                  ? "text-blue-600 opacity-100 scale-110"
                  : "opacity-70"
              }
            `}
                                        >
                                          <subTab.icon className="h-4 w-4" />
                                        </span>
                                        <span
                                          className={`text-xs transition-colors duration-300 ${
                                            isSubActive
                                              ? "font-medium text-gray-900 "
                                              : ""
                                          }`}
                                        >
                                          {subTab.label}
                                        </span>
                                        {isSubActive && (
                                          <span className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full shadow-sm"></span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-hidden">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveLoan();
                      }}
                    >
                      {/* Dashboard Tab */}
                      {/* Dashboard Tab Content */}
                      {activeTab === "dashboard" && (
                        <LoanDashboard
                          loan={loan}
                          setLoan={setLoan}
                          fetchLoanDetails={fetchLoanDetails}
                          id={id}
                          documents={documents}
                        />
                      )}
                      {/* Loan Details Tab */}
                      {activeTab === "loan" && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              Loan Details
                            </h3>
                          </div>
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <LoanDetailsForm
                              loanInfo={loan.loanDetails || {}}
                              onChange={(field, value) => {
                                if (typeof field === "object" && field.target) {
                                  // Extract the actual field name by removing 'loanInfo.' prefix if present
                                  const fieldName = field.target.name.replace(
                                    "loanInfo.",
                                    ""
                                  );
                                  handleFieldChange(
                                    "loanDetails",
                                    fieldName,
                                    field.target.value
                                  );
                                } else {
                                  handleFieldChange(
                                    "loanDetails",
                                    field,
                                    value
                                  );
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Borrower Information Tab */}
                      {activeTab === "borrower" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Personal Details
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PersonalDetails
                                borrower={loan.borrowerDetails || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
                                    );
                                  } else {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field,
                                      value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Employment History
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <EmploymentHistory
                                borrower={loan.borrowerDetails}
                                onChange={(field, value) => {
                                  if (field === "employers") {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      "employers",
                                      value
                                    );
                                  } else if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Residence History
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <ResidenceHistory
                                borrower={loan.borrowerDetails || {}}
                                onChange={(field, value) => {
                                  if (field === "addresses") {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      "addresses",
                                      value
                                    );
                                  } else if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    handleFieldChange(
                                      "borrowerDetails",
                                      field.target.name,
                                      field.target.value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Property Information Tab */}
                      {activeTab === "property" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Property Information
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PropertyInformation
                                propertyInfo={loan.property || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract the actual field name by removing 'propertyInfo.' prefix if present
                                    const fieldName = field.target.name.replace(
                                      "propertyInfo.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "property",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else {
                                    handleFieldChange("property", field, value);
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Properties Owned
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <PropertyOwned
                                propertyOwned={loan.propertiesOwned || []}
                                onChange={(properties) => {
                                  setLoan((prev) => ({
                                    ...prev,
                                    propertiesOwned: properties,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Financial Information Tab */}
                      {activeTab === "financial" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Income Information
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Income
                                income={{
                                  ...(loan.income || {}),
                                  otherIncome: Array.isArray(
                                    loan.income?.otherIncome
                                  )
                                    ? loan.income.otherIncome
                                    : [],
                                }}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract field name by removing any prefix
                                    const fieldName = field.target.name.replace(
                                      "income.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "income",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else if (typeof field === "object") {
                                    // Handle case where entire object is passed
                                    setLoan((prev) => ({
                                      ...prev,
                                      income: field,
                                    }));
                                  } else {
                                    handleFieldChange("income", field, value);
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Assets
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Assets
                                assets={loan.assets || []}
                                onChange={(assets) => {
                                  setLoan((prev) => ({
                                    ...prev,
                                    assets: assets,
                                  }));
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Debts & Liabilities
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Debts
                                debts={
                                  Array.isArray(loan.debts) ? loan.debts : []
                                }
                                expenses={
                                  Array.isArray(loan.expenses)
                                    ? loan.expenses
                                    : []
                                }
                                onChange={(field, value) => {
                                  if (field === "debts") {
                                    setLoan((prev) => ({
                                      ...prev,
                                      debts: Array.isArray(value) ? value : [],
                                    }));
                                  } else if (field === "expenses") {
                                    setLoan((prev) => ({
                                      ...prev,
                                      expenses: Array.isArray(value)
                                        ? value
                                        : [],
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Information Tab */}
                      {activeTab === "additional" && (
                        <>
                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Military Service
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <MilitaryService
                                militaryService={loan.militaryService || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract field name, removing any 'militaryService.' prefix
                                    const fieldName = field.target.name.replace(
                                      "militaryService.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "militaryService",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else if (typeof field === "object") {
                                    // Handle case where entire object is passed
                                    setLoan((prev) => ({
                                      ...prev,
                                      militaryService: field,
                                    }));
                                  } else {
                                    handleFieldChange(
                                      "militaryService",
                                      field,
                                      value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Declarations
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Declarations
                                declarations={loan.declarations || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract field name, removing any 'declarations.' prefix
                                    const fieldName = field.target.name.replace(
                                      "declarations.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "declarations",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else if (typeof field === "object") {
                                    // Handle case where entire object is passed
                                    setLoan((prev) => ({
                                      ...prev,
                                      declarations: field,
                                    }));
                                  } else {
                                    handleFieldChange(
                                      "declarations",
                                      field,
                                      value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                            <div className="px-4 py-5 sm:px-6">
                              <h3 className="text-md leading-6 font-medium text-gray-900">
                                Demographics
                              </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <Demographics
                                demographics={loan.demographics || {}}
                                borrower={loan.borrowerDetails || {}}
                                onChange={(field, value) => {
                                  if (
                                    typeof field === "object" &&
                                    field.target
                                  ) {
                                    // Extract field name, removing any 'demographics.' prefix
                                    const fieldName = field.target.name.replace(
                                      "demographics.",
                                      ""
                                    );
                                    handleFieldChange(
                                      "demographics",
                                      fieldName,
                                      field.target.value
                                    );
                                  } else if (typeof field === "object") {
                                    // Handle case where entire object is passed
                                    setLoan((prev) => ({
                                      ...prev,
                                      demographics: field,
                                    }));
                                  } else {
                                    handleFieldChange(
                                      "demographics",
                                      field,
                                      value
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Documents Tab */}
                      {activeTab === "documents" && (
                        <>
                          {/* Document Requirements Section */}
                          <LenderDocumentRequirements
                            loanId={id}
                            documents={documents}
                            refreshDocuments={() => {
                              try {
                                // Use the current id from props/state to fetch again
                                if (id) {
                                  setLoading(true);
                                  setError(null);

                                  Promise.all([
                                    lenderService.getLoan(id),
                                    lenderService.getLoanDocuments(id),
                                  ])
                                    .then(
                                      ([loanResponse, documentsResponse]) => {
                                        if (
                                          loanResponse &&
                                          (loanResponse.data ||
                                            loanResponse.data?.data)
                                        ) {
                                          // Process loan data
                                          const loanData =
                                            loanResponse.data?.data ||
                                            loanResponse.data;

                                          setLoan(normalizeData(loanData));
                                        } else {
                                          console.warn(
                                            "⚠️ No loan data found in response"
                                          );
                                        }

                                        if (
                                          documentsResponse &&
                                          documentsResponse.success
                                        ) {
                                          const newDocs =
                                            documentsResponse.data || [];

                                          setDocuments(newDocs);
                                        } else {
                                          console.warn(
                                            "⚠️ No documents found in response"
                                          );
                                        }

                                        console.log("✅ Data refresh complete");
                                      }
                                    )
                                    .catch((error) => {
                                      console.error(
                                        "❌ Error refreshing loan details:",
                                        error
                                      );
                                      console.error("❌ Error details:", {
                                        message: error.message,
                                        stack: error.stack?.slice(0, 200), // Only log first part of stack
                                      });
                                      toast.error(
                                        "Failed to refresh loan details"
                                      );
                                    })
                                    .finally(() => {
                                      console.log(
                                        "🔄 Setting loading state to false"
                                      );
                                      setLoading(false);
                                      console.log(
                                        "=== END OF REFRESH OPERATION ===\n"
                                      );
                                    });
                                } else {
                                  console.error(
                                    "❌ Cannot refresh - no loan ID available"
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "❌ Unexpected error during refresh operation:",
                                  error
                                );
                                console.error("❌ Error details:", {
                                  message: error.message,
                                  stack: error.stack?.slice(0, 200), // Only log first part of stack
                                });
                                setLoading(false);
                              }
                            }}
                          />
                        </>
                      )}

                      {/* Milestones Tab */}
                      {activeTab === "milestones" && (
                        <>
                          <LoanMilestones loanId={id} />
                        </>
                      )}
                    </form>
                  </div>
                </div>
              </>
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
                    href="/lender/loans"
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
      {hasUnsavedChanges && !NO_SAVE_TABS.includes(activeTab) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-gray-100 border-t border-gray-200 shadow-lg flex justify-end px-6 py-3 space-x-3 animate-fade-in">
          <button
            type="button"
            className="gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-smtext-gray-700 font-medium shadow-sm hover:bg-gray-100 transition"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gap-1 px-3 py-1.5 rounded-md border border-transparent bg-blue-600 text-sm text-white font-medium shadow-sm hover:bg-blue-700 transition"
            onClick={saveLoan}
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default LoanDetails;
