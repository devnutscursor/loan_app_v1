import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { companyService } from '../services/api';
import { mapActivityIcons, transformActivities, transformStats, transformBorrowerLoans } from '../utils/lenderStatsUtils';

// Custom hook for fetching lender stats data
export const useLenderStats = (user, lenderId) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoans: 0,
    approvedLoans: 0,
    pendingApplications: 0,
    totalAmount: 0,
    metrics: {
      approvalRate: 0,
      approvalRateTrend: 0,
      avgProcessingTime: 0,
      processingTimeTrend: 0
    },
    percentChanges: {
      loans: 0,
      applications: 0,
      amount: 0
    }
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [recentBorrowers, setRecentBorrowers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [borrowerLoans, setBorrowerLoans] = useState({});
  const [activities, setActivities] = useState([]);
  const [lenderHeader, setLenderHeader] = useState(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchAll = useCallback(async (currentLenderId, forceRefresh = false) => {
    // Early return if user is not available or not a company user
    if (!user || user.role !== 'company' || !user.company || !currentLenderId) {
      setLoading(false);
      return;
    }

    // Check if we should use cached data
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached lender stats data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Use the new company API endpoints
      const [dashboardRes, borrowersRes, activitiesRes, lenderRes, programsRes] = await Promise.all([
        companyService.getLenderDashboard(user.company, currentLenderId),
        companyService.getLenderBorrowers(user.company, currentLenderId, { limit: 10 }),
        companyService.getLenderActivities(user.company, currentLenderId, { limit: 5 }),
        companyService.getLender(user.company, currentLenderId),
        companyService.getLenderPrograms(user.company, currentLenderId, { limit: 5 })
      ]);

      // Extract data from responses
      const dashboardData = dashboardRes.data.data;
      const recentBorrowersData = borrowersRes.data.data || [];
      const activitiesData = activitiesRes.data.data || [];
      const lenderData = lenderRes.data.data;
      const programsData = programsRes.data.data || [];

      // Map activities to include icons
      const iconMap = mapActivityIcons();
      const mappedActivities = transformActivities(activitiesData, iconMap);

      // Extract stats from dashboard data
      const transformedStats = transformStats(dashboardData);

      // Get recent loans from dashboard data
      const recentLoansData = dashboardData.recentLoans || [];

      // Get loan counts for borrowers
      const loansMap = transformBorrowerLoans(recentBorrowersData);

      setStats(transformedStats);
      setRecentLoans(recentLoansData);
      setRecentBorrowers(recentBorrowersData);
      setPrograms(programsData);
      setActivities(mappedActivities);
      setLenderHeader(dashboardData.lender);
      setBorrowerLoans(loansMap);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching lender dashboard data:', error);
      toast.error('Failed to load lender data');
    } finally {
      setLoading(false);
    }
  }, [user?.company, lastFetchTime]);

  const refreshActivities = useCallback(async (currentLenderId) => {
    if (!user || user.role !== 'company' || !currentLenderId) {
      return;
    }

    try {
      setActivitiesLoading(true);
      toast.loading('Refreshing activities...');
      
      const activitiesRes = await companyService.getLenderActivities(user.company, currentLenderId, { limit: 5 });
      const activitiesData = activitiesRes.data.data || [];
      
      // Map activities to include icons
      const iconMap = mapActivityIcons();
      const mappedActivities = transformActivities(activitiesData, iconMap);
      
      setActivities(mappedActivities);
      toast.success('Activities refreshed');
    } catch (error) {
      console.error('Error refreshing activities:', error);
      toast.error('Failed to refresh activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, [user?.company]);

  return {
    loading,
    stats,
    recentLoans,
    recentBorrowers,
    programs,
    borrowerLoans,
    activities,
    lenderHeader,
    activitiesLoading,
    fetchAll,
    refreshActivities
  };
};