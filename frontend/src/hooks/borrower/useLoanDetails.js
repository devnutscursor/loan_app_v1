import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { LoanService } from '../../services';
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
} from 'lucide-react';

const useLoanDetails = () => {
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

  // Fetch loan details
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

  return {
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
  };
};

export default useLoanDetails;
