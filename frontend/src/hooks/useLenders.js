import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { companyService } from '../services/api';

export const useLenders = (user) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lenders, setLenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('borrowerCount');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLenders, setTotalLenders] = useState(0);
  const [filteredLenders, setFilteredLenders] = useState([]);

  const itemsPerPage = 12;

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    fetchLenders();
  }, []);

  const fetchLenders = async () => {
    try {
      setLoading(true);

      const response = await companyService.getLenders(user.company);
      const data = response.data.data;
      console.log("data",data);
      setLenders(data.lenders || []);
      setFilteredLenders(data.lenders || []);
      setTotalPages(data.totalPages || 1);
      setTotalLenders(data.lenders.length || 0);

    } catch (error) {
      console.error('Error fetching lenders:', error);
      toast.error('Failed to load lenders');
    } finally {
      setLoading(false);
    }
  };

  const handleNewLenderSuccess = () => {
    fetchLenders();
  };

  // Client-side sorting function
  const sortLenders = (lendersToSort, sortField, sortDirection) => {
    return [...lendersToSort].sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'borrowerCount') {
        aValue = a?.metrics?.borrowerCount || 0;
        bValue = b?.metrics?.borrowerCount || 0;
      } else if (sortField === 'totalLoanAmount') {
        aValue = a?.metrics?.totalLoanAmount || 0;
        bValue = b?.metrics?.totalLoanAmount || 0;
      } else if (sortField === 'name') {
        aValue = a?.user?.name || `${a?.user?.firstName || ''} ${a?.user?.lastName || ''}`.trim();
        bValue = b?.user?.name || `${b?.user?.firstName || ''} ${b?.user?.lastName || ''}`.trim();
      } else if (sortField === 'email') {
        aValue = a?.user?.email || '';
        bValue = b?.user?.email || '';
      } else {
        return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Apply sorting when sortBy or sortOrder changes
  useEffect(() => {
    if (filteredLenders.length > 0) {
      const sortedLenders = sortLenders(filteredLenders, sortBy, sortOrder);
      setFilteredLenders(sortedLenders);
    }
  }, [sortBy, sortOrder]);

  return {
    loading,
    lenders,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    totalPages,
    totalLenders,
    handleNewLenderSuccess,
    filteredLenders,
    setFilteredLenders
  };
};
