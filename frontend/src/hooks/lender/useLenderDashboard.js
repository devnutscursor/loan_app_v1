import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { 
  FileText,
  CheckCircle, 
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  RefreshCw,
  Edit,
  FileCheck,
  FilePlus,
  FileX,
  FileEdit,
  MessageSquare
} from 'lucide-react';

export const useLenderDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [isXMLUploadOpen, setIsXMLUploadOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLoans: 0,
    approvedLoans: 0,
    pendingApplications: 0,
    totalAmount: 0,
    percentChanges: {
      loans: 5,
      applications: 12,
      amount: 8
    }
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [recentBorrowers, setRecentBorrowers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [borrowerLoans, setBorrowerLoans] = useState({});
  const [activities, setActivities] = useState([]);
  const [shouldRefreshDashboard, setShouldRefreshDashboard] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Progressive loading: Load critical data first, then secondary data
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Check if logout is in progress to prevent unnecessary API calls
    const isLogoutInProgress = localStorage.getItem('logoutInProgress');
    if (isLogoutInProgress) {
      return;
    }
    
    // Check if we should use cached data
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached dashboard data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // PHASE 1: Load critical dashboard data first (stats, recent loans, programs)
      console.log('Loading critical dashboard data...');
      const [statsResponse, programsResponse, lenderResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/dashboard?loanLimit=10`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000 // Increased timeout for critical data
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/loan-programs?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        })
      ]);

      // Process critical responses
      const dashboardData = statsResponse.data.data || {};
      const programsData = programsResponse.data.data || [];
      const lenderId = lenderResponse.data.data._id;

      setStats(dashboardData);
      setRecentLoans(dashboardData.recentLoans || []);
      setPrograms(programsData);
      setLastFetchTime(now);

      // PHASE 2: Load secondary data (borrowers and their loan counts) in parallel
      console.log('Loading secondary data...');
      const [borrowersResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/borrowers?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        })
      ]);

      const borrowersData = borrowersResponse.data.data || [];
      setRecentBorrowers(borrowersData);

      // Optimize borrower loan count fetching - use a single aggregated query if possible
      if (borrowersData.length > 0 && lenderId) {
        try {
          // Try to get borrower loan counts in a single request
          const borrowerLoanCountsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/${lenderId}/borrower-loan-counts`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );
          
          if (borrowerLoanCountsResponse.data?.data) {
            setBorrowerLoans(borrowerLoanCountsResponse.data.data);
          } else {
            // Fallback to individual requests but with shorter timeout
            const borrowerLoanPromises = borrowersData.map(async (borrower) => {
              try {
                const response = await axios.get(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/${lenderId}/borrowers/${borrower._id}`,
                  { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 3000 // Reduced timeout for individual requests
                  }
                );
                return { borrowerId: borrower._id, loanCount: (response.data.data.loans || []).length };
              } catch (err) {
                console.error(`Error fetching loans for borrower ${borrower._id}:`, err);
                return { borrowerId: borrower._id, loanCount: 0 };
              }
            });

            const borrowerLoanResults = await Promise.all(borrowerLoanPromises);
            const loansMap = {};
            borrowerLoanResults.forEach(({ borrowerId, loanCount }) => {
              loansMap[borrowerId] = loanCount;
            });
            setBorrowerLoans(loansMap);
          }
        } catch (error) {
          console.error('Error fetching borrower loan counts:', error);
          // Set empty map if all fails
          const emptyMap = {};
          borrowersData.forEach(borrower => {
            emptyMap[borrower._id] = 0;
          });
          setBorrowerLoans(emptyMap);
        }
      }
      
      // PHASE 3: Load activities asynchronously (don't block main dashboard)
      console.log('Loading activities asynchronously...');
      setActivitiesLoading(true);
      
      // Load activities in background without blocking the main dashboard
      setTimeout(async () => {
        try {
          const activitiesResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/activities?limit=5`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000 // Increased timeout for activities
            }
          );
          
          if (activitiesResponse.data && activitiesResponse.data.status === 'success') {
            const iconMap = {
              'FileText': FileText,
              'CheckCircle': CheckCircle, 
              'Clock': Clock,
              'AlertTriangle': AlertTriangle,
              'XCircle': XCircle,
              'Upload': Upload,
              'RefreshCw': RefreshCw,
              'Edit': Edit,
              'FileCheck': FileCheck,
              'FilePlus': FilePlus,
              'FileX': FileX,
              'FilePen': FileEdit,
              'MessageSquare': MessageSquare
            };
            
            // Transform backend activities to frontend format
            const mappedActivities = activitiesResponse.data.data.map(activity => ({
              icon: iconMap[activity.icon] || FileText, // Default to FileText if icon not found
              title: activity.title,
              time: activity.time,
              status: activity.status,
              statusColor: `bg-${activity.statusColor}-500`,
              id: activity.id,
              entityId: activity.entityId,
              entityType: activity.entityType,
              description: activity.description,
              borrowerId: activity.borrowerId
            }));
            setActivities(mappedActivities);
          } else {
            console.error('Invalid response format:', activitiesResponse);
            throw new Error('Invalid activity data format');
          }
        } catch (err) {
          console.error('Error fetching activities:', err);
          // Fallback to sample data if API fails
          setActivities([
            { 
              icon: FileText, 
              title: 'New loan application submitted',
              time: '2 hours ago',
              status: 'New',
              statusColor: 'bg-blue-500'
            },
            { 
              icon: CheckCircle, 
              title: 'Loan #12345 approved',
              time: '5 hours ago',
              status: 'Completed',
              statusColor: 'bg-green-500'
            },
            { 
              icon: Clock, 
              title: 'Document verification pending',
              time: 'Yesterday',
              status: 'Pending',
              statusColor: 'bg-yellow-500'
            },
            { 
              icon: AlertTriangle, 
              title: 'Credit check failed',
              time: '2 days ago',
              status: 'Failed',
              statusColor: 'bg-red-500'
            }
          ]);
        } finally {
          setActivitiesLoading(false);
        }
      }, 100); // Small delay to ensure main dashboard loads first
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Only show error toast if not during logout
      const isLogoutInProgress = localStorage.getItem('logoutInProgress');
      if (!isLogoutInProgress) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Effect to trigger dashboard refresh when shouldRefreshDashboard is true
  useEffect(() => {
    if (shouldRefreshDashboard) {
      fetchDashboardData();
      setShouldRefreshDashboard(false); // Reset the flag
    }
  }, [shouldRefreshDashboard, fetchDashboardData]);

  const handleViewLoan = (loanId) => {
    router.push(`/lender/loans/${loanId}`);
  };

  // Handler for NewLoanModal XML upload option
  const handleXMLUploadOption = () => {
    setShowLoanModal(false);
    setIsXMLUploadOpen(true);
  };

  // Handler for NewLoanModal manual creation option
  const handleManualCreateOption = () => {
    setShowLoanModal(false);
    router.push('/lender/loans/create');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleRefreshActivities = async () => {
    try {
      setActivitiesLoading(true);
      const token = localStorage.getItem('token');
      toast.loading('Refreshing activities...');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/activities?limit=5&_=${Date.now()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000 // Reduced timeout
        }
      );
      
      if (response.data && response.data.status === 'success') {
        const iconMap = {
          'FileText': FileText,
          'CheckCircle': CheckCircle, 
          'Clock': Clock,
          'AlertTriangle': AlertTriangle,
          'XCircle': XCircle,
          'Upload': Upload,
          'RefreshCw': RefreshCw,
          'Edit': Edit,
          'FileCheck': FileCheck,
          'FilePlus': FilePlus,
          'FileX': FileX,
          'FilePen': FileEdit,
          'MessageSquare': MessageSquare
        };
        
        const mappedActivities = response.data.data.map(activity => ({
          icon: iconMap[activity.icon] || FileText,
          title: activity.title,
          time: activity.time,
          status: activity.status,
          statusColor: `bg-${activity.statusColor}-500`,
          id: activity.id,
          entityId: activity.entityId,
          entityType: activity.entityType,
          description: activity.description,
          borrowerId: activity.borrowerId
        }));
        
        setActivities(mappedActivities);
        toast.success('Activities refreshed');
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
      toast.error('Failed to refresh activities');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleXMLUploadSuccess = () => {
    setIsXMLUploadOpen(false);
    toast.success('Loan created successfully');
    setShouldRefreshDashboard(true); // Trigger dashboard refresh
  };

  return {
    loading,
    showLoanModal,
    isXMLUploadOpen,
    stats,
    recentLoans,
    recentBorrowers,
    programs,
    borrowerLoans,
    activities,
    activitiesLoading,
    setShowLoanModal,
    setIsXMLUploadOpen,
    handleViewLoan,
    handleXMLUploadOption,
    handleManualCreateOption,
    formatCurrency,
    handleRefreshActivities,
    handleXMLUploadSuccess
  };
};
