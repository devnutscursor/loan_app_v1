import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const useCompanyDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topLenders, setTopLenders] = useState([]);
  const [sortBy, setSortBy] = useState('borrowerCount');

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'company' && stats) {
      fetchTopLenders();
    }
  }, [sortBy]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await companyService.getStats(user.company);
      setStats(statsResponse.data.data.summary);
      await fetchTopLenders();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopLenders = async () => {
    try {
      const topLendersResponse = await companyService.getTopLenders(user.company);
      setTopLenders(topLendersResponse.data.data.topLenders || []);
    } catch (error) {
      console.error('Error fetching top lenders:', error);
      toast.error('Failed to load top lenders');
    }
  };

  const handleLenderClick = (lenderId) => {
    router.push(`/company/lender-stats?lenderId=${lenderId}`);
  };

  const handleViewAllLenders = () => {
    router.push('/company/lenders');
  };

  const handleSortToggle = () => {
    setSortBy(prev => prev === 'borrowerCount' ? 'totalLoanAmount' : 'borrowerCount');
  };

  return {
    user,
    loading,
    stats,
    topLenders,
    sortBy,
    router,
    setSortBy,
    handleLenderClick,
    handleViewAllLenders,
    handleSortToggle,
  };
};


