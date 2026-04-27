import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api.service';
import { toast } from 'react-hot-toast';
import { lenderService } from '../../services/api';
import { ChevronDown } from 'lucide-react';

export const useLenderBorrowers = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lenderId, setLenderId] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Add this state at the top of your component with other states
  const [borrowerLoans, setBorrowerLoans] = useState({});

  const fetchBorrowers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/lenders/borrowers');
      setBorrowers(response.data.data || []);

      // Get lender ID for referral links
      const profileResponse = await api.get('/api/v1/lenders/profile');
      setLenderId(profileResponse.data.data?._id || '');

      setError(null);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
      setError('Failed to load borrowers. Please try again later.');
      toast.error('Failed to load borrowers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this effect to fetch loans for each borrower
  useEffect(() => {
    const fetchBorrowerLoans = async () => {
      const loansMap = {};
      for (const borrower of borrowers) {
        try {
          const response = await lenderService.getBorrowerLoans(borrower._id);
          loansMap[borrower._id] = response.data?.length || 0;
        } catch (error) {
          console.error(`Error fetching loans for borrower ${borrower._id}:`, error);
          loansMap[borrower._id] = 0;
        }
      }
      setBorrowerLoans(loansMap);
    };

    if (borrowers.length > 0) {
      fetchBorrowerLoans();
    }
  }, [borrowers]);

  useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  const handleShowReferralLink = (borrowerId = null) => {
    setSelectedBorrowerId(borrowerId);
    setReferralModalOpen(true);
  };

  const handleCloseReferralModal = () => {
    setReferralModalOpen(false);
    setSelectedBorrowerId(null);
  };

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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Filter borrowers based on search term and active filter
  const filteredBorrowers = useMemo(() => {
    if (!borrowers.length) return [];

    let results = [...borrowers];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(borrower =>
        borrower.user?.firstName?.toLowerCase().includes(search) ||
        borrower.user?.lastName?.toLowerCase().includes(search) ||
        borrower.user?.email?.toLowerCase().includes(search) ||
        borrower.user?.phone?.includes(search)
      );
    }

    // Apply filters
    if (activeFilter === 'recent') {
      // Filter borrowers created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      results = results.filter(borrower => new Date(borrower.createdAt) >= thirtyDaysAgo);
    } else if (activeFilter === 'hasLoans') {
      // Filter borrowers who have at least one loan using borrowerLoans state
      results = results.filter(borrower => (borrowerLoans[borrower._id] || 0) > 0);
    }

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case 'name':
          compareA = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
          compareB = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
          break;
        case 'email':
          compareA = (a.user?.email || '').toLowerCase();
          compareB = (b.user?.email || '').toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'loans':
          // Use borrowerLoans state for sorting by loan count
          compareA = borrowerLoans[a._id] || 0;
          compareB = borrowerLoans[b._id] || 0;
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [borrowers, searchTerm, activeFilter, sortBy, sortDirection, borrowerLoans]);

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;

    return sortDirection === 'asc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 transform rotate-180" />
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  return {
    borrowers,
    loading,
    error,
    lenderId,
    selectedBorrowerId,
    referralModalOpen,
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    borrowerLoans,
    filteredBorrowers,
    reloadBorrowers: fetchBorrowers,
    handleShowReferralLink,
    handleCloseReferralModal,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    formatDate,
    getSortIcon,
    clearFilters
  };
};
