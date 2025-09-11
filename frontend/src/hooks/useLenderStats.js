import { useState, useEffect, useCallback } from 'react';
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

  const fetchAll = useCallback(async (lenderId, forceRefresh = false) => {
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
        companyService.getLenderDashboard(user.company, lenderId),
        companyService.getLenderBorrowers(user.company, lenderId, { limit: 10 }),
        companyService.getLenderActivities(user.company, lenderId, { limit: 5 }),
        companyService.getLender(user.company, lenderId),
        companyService.getLenderPrograms(user.company, lenderId, { limit: 5 })
      ]);

      // Extract data from responses
      const dashboardData = dashboardRes.data.data;
      const recentBorrowers = borrowersRes.data.data || [];
      const activities = activitiesRes.data.data || [];
      const lenderData = lenderRes.data.data;
      const programs = programsRes.data.data || [];

      // Map activities to include icons
      const iconMap = mapActivityIcons();
      const mappedActivities = transformActivities(activities, iconMap);

      // Extract stats from dashboard data
      const transformedStats = transformStats(dashboardData);

      // Get recent loans from dashboard data
      const recentLoans = dashboardData.recentLoans || [];

      // Get loan counts for borrowers
      const loansMap = transformBorrowerLoans(recentBorrowers);

      setStats(transformedStats);
      setRecentLoans(recentLoans);
      setRecentBorrowers(recentBorrowers);
      setPrograms(programs);
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
  }, [user.company, lastFetchTime]);

  const refreshActivities = useCallback(async (lenderId) => {
    try {
      setActivitiesLoading(true);
      toast.loading('Refreshing activities...');
      await fetchAll(lenderId, true);
      toast.success('Activities refreshed');
    } catch (error) {
      console.error('Error refreshing activities:', error);
      toast.error('Failed to refresh activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, [fetchAll]);

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
