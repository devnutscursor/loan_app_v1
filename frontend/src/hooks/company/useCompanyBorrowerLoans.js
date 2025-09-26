import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { companyService } from '@/services/api';
import { toast } from 'react-hot-toast';

export const useCompanyBorrowerLoans = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { borrowerId, lenderId } = router.query;

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowerInfo, setBorrowerInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        if (!borrowerId || !lenderId || !user) {
          setError('Missing required parameters');
          return;
        }
        const response = await companyService.getLenderBorrowerLoans(user.company, lenderId, borrowerId);
        const data = response.data.data.loans || [];
        console.log("data", data);
        setLoans(data);

        try {
          const borrowerResponse = await companyService.getLenderBorrowers(user.company, lenderId);
          const borrowers = borrowerResponse.data.data || [];
          const borrower = borrowers.find(b => b._id === borrowerId);
          if (borrower) setBorrowerInfo(borrower);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Could not fetch borrower info:', err);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error fetching borrower loans:', e);
        toast.error('Failed to load loans');
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && user) {
      fetchLoans();
    }
  }, [borrowerId, lenderId, router.isReady, user]);

  const handleBack = () => {
    router.push(`/company/lender-borrowers?lenderId=${lenderId}`);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (filter) => setActiveFilter(filter);
  const toggleSortDirection = () => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const filteredLoans = useMemo(() => {
    if (!loans.length) return [];
    let results = [...loans];
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(loan =>
        loan.loanNumber?.toLowerCase().includes(search) ||
        loan.status?.toLowerCase().includes(search) ||
        loan.loanDetails?.loanAmount?.toString().includes(search)
      );
    }
    if (activeFilter === 'pending') {
      results = results.filter(loan => ['Application Submitted', 'In Review', 'Pending Documents'].includes(loan.status));
    } else if (activeFilter === 'approved') {
      results = results.filter(loan => ['Conditional Approval', 'Clear to Close', 'Closed', 'Funded'].includes(loan.status));
    } else if (activeFilter === 'rejected') {
      results = results.filter(loan => ['Rejected', 'Withdrawn'].includes(loan.status));
    }
    results.sort((a, b) => {
      let compareA, compareB;
      switch (sortBy) {
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        case 'amount':
          compareA = a.loanDetails?.loanAmount || 0;
          compareB = b.loanDetails?.loanAmount || 0;
          break;
        case 'status':
          compareA = (a.status || '').toLowerCase();
          compareB = (b.status || '').toLowerCase();
          break;
        case 'number':
          compareA = (a.loanDetails?.loanNumber || '').toLowerCase();
          compareB = (b.loanDetails?.loanNumber || '').toLowerCase();
          break;
        default:
          return 0;
      }
      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
    return results;
  }, [loans, searchTerm, activeFilter, sortBy, sortDirection]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Application Submitted':
      case 'In Review':
      case 'Pending Documents':
        return 'bg-yellow-100 text-yellow-800';
      case 'Conditional Approval':
      case 'Clear to Close':
        return 'bg-green-100 text-green-800';
      case 'Closed':
      case 'Funded':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortDirection;
  };

  return {
    router,
    user,
    borrowerId,
    lenderId,
    loans,
    loading,
    error,
    borrowerInfo,
    searchTerm,
    activeFilter,
    sortBy,
    sortDirection,
    filteredLoans,
    handleBack,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    setSearchTerm,
    setActiveFilter,
    getStatusColor,
    getSortIcon,
  };
};


