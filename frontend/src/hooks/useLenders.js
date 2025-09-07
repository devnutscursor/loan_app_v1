import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { companyService } from '../services/api';

export const useLenders = (user) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lenders, setLenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLenders, setTotalLenders] = useState(0);

  const itemsPerPage = 12;

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    fetchLenders();
  }, [user, router, currentPage, sortBy, sortOrder, searchTerm]);

  const fetchLenders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
        search: searchTerm
      };

      const response = await companyService.getLenders(user.company);
      const data = response.data.data;
      
      setLenders(data.lenders || []);
      setTotalPages(data.totalPages || 1);
      setTotalLenders(data.totalLenders || 0);

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
    handleNewLenderSuccess
  };
};
