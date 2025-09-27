import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/api';

export const useAdminLoans = () => {
  const [loans, setLoans] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBorrower, setSelectedBorrower] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch loans and borrowers in parallel
        const [loansResponse, borrowersResponse] = await Promise.all([
          adminService.getLoans(),
          adminService.getUsers({ role: 'borrower' })
        ]);
        
        console.log('Admin loans response:', loansResponse.data);
        console.log('Admin borrowers response:', borrowersResponse.data);
        
        const loansData = loansResponse.data.data || loansResponse.data.loans || [];
        const borrowersData = borrowersResponse.data.data || borrowersResponse.data.users || [];
        
        // Debug: Check if Asad Ali is in the borrowers list
        const asadAli = borrowersData.find(borrower => 
          borrower.firstName?.toLowerCase() === 'asad' && 
          borrower.lastName?.toLowerCase() === 'ali'
        );
        console.log('Asad Ali found in borrowers:', asadAli);
        console.log('All borrower IDs:', borrowersData.map(b => ({ id: b._id, name: `${b.firstName} ${b.lastName}` })));
        
        setLoans(loansData);
        setBorrowers(borrowersData);
      } catch (e) {
        console.error('Error fetching admin data:', e);
        toast.error('Failed to load data');
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleBorrowerChange = (e) => {
    const selectedBorrowerName = e.target.value;
    setSelectedBorrower(selectedBorrowerName);
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

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    setSelectedBorrower('all');
  };

  // Effect to handle filtering with async borrower ID lookup
  useEffect(() => {
    const applyFilters = async () => {
      if (!loans.length) {
        setFilteredLoans([]);
        return;
      }

      setFilterLoading(true);
      let results = [...loans];

      // Apply borrower filter by name instead of ID
      if (selectedBorrower !== 'all') {
        results = results.filter(loan => {
          const borrowerName = `${loan.borrowerDetails?.firstName || ''} ${loan.borrowerDetails?.lastName || ''}`.trim();
          return borrowerName.toLowerCase() === selectedBorrower.toLowerCase();
        });
      }

      // Apply search
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim();
        results = results.filter(loan =>
          (loan.borrowerDetails?.firstName + ' ' + loan.borrowerDetails?.lastName).toLowerCase().includes(search) ||
          (loan.loanNumber || '').toLowerCase().includes(search) ||
          (loan._id || '').toLowerCase().includes(search) ||
          (loan.loanDetails?.loanAmount || 0).toString().includes(search)
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

      setFilteredLoans(results);
      setFilterLoading(false);
    };

    applyFilters();
  }, [loans, searchTerm, activeFilter, selectedBorrower, sortBy, sortDirection]);

  return {
    loans,
    borrowers,
    loading,
    error,
    searchTerm,
    activeFilter,
    selectedBorrower,
    sortBy,
    sortDirection,
    filteredLoans,
    filterLoading,
    handleSearchChange,
    handleFilterChange,
    handleBorrowerChange,
    handleSortChange,
    clearFilters
  };
};
