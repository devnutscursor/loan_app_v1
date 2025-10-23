import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { lenderService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';

const useLenderLoans = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { borrowerId } = router.query;
  
  // State management
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isXMLUploadOpen, setIsXMLUploadOpen] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);

  // Fetch loans data
  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (user.role === "company") {
      router.push('/company/dashboard');
    } else if (user.role !== 'lender') {
      router.push('/login');
      return;
    }
    
    const fetchLoans = async () => {
      try {
        setLoading(true);
        let response;
        
        if (borrowerId) {
          response = await lenderService.getBorrowerLoans(borrowerId);
          const data = response.data || [];
          setLoans(data);
        } else {
          response = await lenderService.getLoans();
          const data = response.data.data.loans || [];
          setLoans(data);
        }
        
        console.log("response", response.data);

      } catch (e) {
        console.error('Error fetching lender loans:', e);
        toast.error('Failed to load loans');
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && user) {
      fetchLoans();
    }
  }, [borrowerId, router.isReady, user]);

  // Check for newLoan query parameter to automatically open the new loan modal
  useEffect(() => {
    if (router.isReady && router.query.newLoan === 'true') {
      setIsNewLoanModalOpen(true);
      // Clean up the URL by removing the query parameter
      router.replace('/lender/loans', undefined, { shallow: true });
    }
  }, [router.isReady, router.query]);

  // Event handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
    );
  };

  // Filter and sort loans
  const filteredLoans = useMemo(() => {
    if (!loans.length) return [];

    let results = [...loans];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(loan =>
        (loan.borrowerDetails?.firstName + ' ' + loan.borrowerDetails?.lastName).toLowerCase().includes(search) ||
        (loan.loanNumber || '').toLowerCase().includes(search) ||
        (loan.loanDetails?.propertyAddress || '').toLowerCase().includes(search)
      );
    }
    
    // Create local variables for sorting based on the active filter
    let localSortBy = sortBy;
    let localSortDirection = sortDirection;
    
    // Set appropriate sort parameters based on the active filter
    if (activeFilter === 'recent') {
      // For 'Recent' filter: Sort by date (newest first)
      localSortBy = 'date';
      localSortDirection = 'desc';
    } else if (activeFilter === 'highValue') {
      // For 'High Value' filter: Sort by loan amount (highest first)
      localSortBy = 'amount';
      localSortDirection = 'desc';
    }

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (localSortBy) {
        case 'borrower':
          compareA = `${a.borrowerDetails?.firstName || ''} ${a.borrowerDetails?.lastName || ''}`.toLowerCase();
          compareB = `${b.borrowerDetails?.firstName || ''} ${b.borrowerDetails?.lastName || ''}`.toLowerCase();
          break;
        case 'amount':
          compareA = a.loanDetails?.loanAmount || 0;
          compareB = b.loanDetails?.loanAmount || 0;
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'loanNumber':
          compareA = a.loanNumber || '';
          compareB = b.loanNumber || '';
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return localSortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [loans, searchTerm, activeFilter, sortBy, sortDirection]);

  // Modal handlers
  const handleXMLUploadSuccess = (newLoan) => {
    // Add the new loan to the list and navigate to it
    setLoans(prevLoans => [newLoan, ...prevLoans]);
    toast.success('Loan created successfully from XML!');
    
    // Navigate to the new loan details page
    if (newLoan._id) {
      router.push(`/lender/loans/${newLoan._id}`);
    }
  };

  const handleXMLUploadOption = () => {
    setIsNewLoanModalOpen(false);
    setIsXMLUploadOpen(true);
  };

  const handleManualCreateOption = () => {
    setIsNewLoanModalOpen(false);
    router.push('/lender/loans/create');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  return {
    // Data
    loans,
    filteredLoans,
    loading,
    error,
    borrowerId,
    user,
    
    // Search and filter state
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    
    // Modal state
    isXMLUploadOpen,
    isNewLoanModalOpen,
    
    // Event handlers
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    getSortIcon,
    handleXMLUploadSuccess,
    handleXMLUploadOption,
    handleManualCreateOption,
    handleClearFilters,
    
    // Modal controls
    setIsXMLUploadOpen,
    setIsNewLoanModalOpen
  };
};

export default useLenderLoans;
