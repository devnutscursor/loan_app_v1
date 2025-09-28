import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoanService } from '../../services';

const useBorrowerLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  // Fetch loans from API
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Special handling for Approved filter to include Conditional Approval
      let filterParams = {};
      if (filter !== "all") {
        if (filter === "Approved") {
          // Use array of statuses to include both Approved and Conditional Approval
          filterParams = { status: ["Approved", "Conditional Approval"] };
        } else {
          filterParams = { status: filter };
        }
      }
      
      const response = await LoanService.getLoans(filterParams);

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

  // Effect to fetch loans when filter or refreshKey changes
  useEffect(() => {
    fetchLoans();
  }, [filter, refreshKey]);

  // Handle filter change
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

  return {
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
  };
};

export default useBorrowerLoans;
