import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const useCompanyLenderBorrowers = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lenderData, setLenderData] = useState(null);
  const [borrowers, setBorrowers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchBorrowers = useCallback(async () => {
    const { lenderId } = router.query;
    if (!lenderId || !user) return;

    try {
      setLoading(true);

      const [lenderResponse, borrowersResponse] = await Promise.all([
        companyService.getLender(user.company, lenderId),
        companyService.getLenderBorrowers(user.company, lenderId)
      ]);

      setLenderData(lenderResponse.data.data);
      const borrowersData = borrowersResponse.data.data || [];
      setBorrowers(borrowersData);

      setError(null);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
      setError('Failed to load borrowers. Please try again later.');
      toast.error('Failed to load borrowers');
    } finally {
      setLoading(false);
    }
  }, [user, router.query]);

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    if (router.query.lenderId) {
      fetchBorrowers();
    }
  }, [user, router, fetchBorrowers]);

  const handleBack = () => {
    router.push('/company/lenders');
  };

  const handleViewLoans = (borrowerId) => {
    router.push(`/company/lender-borrowers/${borrowerId}/loans?lenderId=${router.query.lenderId}`);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (filter) => setActiveFilter(filter);
  const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredBorrowers = useMemo(() => {
    if (!borrowers.length) return [];

    let results = [...borrowers];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(borrower =>
        borrower.user?.firstName?.toLowerCase().includes(search) ||
        borrower.user?.lastName?.toLowerCase().includes(search) ||
        borrower.user?.email?.toLowerCase().includes(search) ||
        borrower.user?.phone?.includes(search)
      );
    }

    if (activeFilter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      results = results.filter(borrower => new Date(borrower.createdAt) >= thirtyDaysAgo);
    } else if (activeFilter === 'hasLoans') {
      results = results.filter(borrower => (borrower.loanCount || 0) > 0);
    }

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
          compareA = a.loanCount || 0;
          compareB = b.loanCount || 0;
          break;
        default:
          return 0;
      }
      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [borrowers, searchTerm, activeFilter, sortBy, sortDirection]);

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? 'asc' : 'desc';
  };

  return {
    user,
    router,
    loading,
    error,
    lenderData,
    borrowers,
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    filteredBorrowers,
    handleBack,
    handleViewLoans,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    toggleSortDirection,
    setSearchTerm,
    setActiveFilter,
    formatDate,
    getSortIcon,
  };
};


