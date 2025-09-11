import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft,
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp,
  User,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Upload,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Briefcase,
  Home,
  BadgeDollarSign,
  ClipboardList,
  ArrowRightCircle,
  LineChart,
  Edit,
  FileCheck,
  FilePlus,
  FileX,
  FilePen,
  MessageSquare
} from 'lucide-react';

// Component for stat cards (reused from lender dashboard)
const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass }) => (
  <div className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${bgClass}`}>
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-white text-opacity-80 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-white">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-xs font-medium ${
                  trendValue >= 0 ? 'text-green-100' : 'text-red-100'
                }`}>
                  {trendValue >= 0 ? (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-green-100" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-red-100" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{Math.abs(trendValue)}%</span>
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// Recent loan card component (reused from lender dashboard)
const LoanCard = ({ loan, onView }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Status styling
  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'application submitted':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
      case 'clear to close':
      case 'conditional approval':
        return "bg-green-100 text-green-800";
      case 'rejected':
      case 'declined':
        return "bg-red-100 text-red-800";
      case 'funded':
      case 'closed':
        return "bg-blue-100 text-blue-800";
      case 'processing':
      case 'underwriting':
        return "bg-purple-100 text-purple-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
              {loan.borrowerDetails?.firstName?.charAt(0) || "B"}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{loan.borrowerDetails?.firstName} {loan.borrowerDetails?.lastName}</h4>
              <p className="text-xs text-gray-500">Loan# {loan.loanNumber || loan._id.slice(-6)}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(loan.status)}`}>
            {loan.status?.toLowerCase() === 'conditional approval' ? 'Approved' : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || 'Status'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(loan.loanAmount)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Program</p>
            <p className="font-semibold text-gray-900">N/A</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Applied</p>
            <p className="font-semibold text-gray-900">{formatDate(loan.createdAt)}</p>
          </div>
        </div>
        
        <button
          onClick={() => onView(loan._id)}
          className="w-full mt-2 flex items-center justify-center py-1.5 px-3 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          View Details
          <ChevronRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Borrower item component (reused from lender dashboard)
const BorrowerItem = ({ borrower, borrowerLoans }) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <span className="text-sm font-medium">
            {borrower.user?.firstName?.charAt(0)}{borrower.user?.lastName?.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {borrower.user?.firstName} {borrower.user?.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{borrower.user?.email}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
          {borrowerLoans[borrower._id] || 0} loans
        </span>
        <ArrowRightCircle className="ml-2 h-4 w-4 text-gray-500" />
      </div>
    </div>
  );
};

// Activity item component (reused from lender dashboard)
const ActivityItem = ({ icon: Icon, title, time, status, statusColor, entityId, entityType, loanNumber, description, borrowerId }) => {
  const router = useRouter();
  
  // Handle click on activity item to navigate to related entity
  const handleActivityClick = () => {
    if (entityType === 'loan' && entityId) {
      // For company users, we can't navigate to lender-specific pages
      // Instead, we could show a modal or redirect to a company view
      toast('Loan details view not available for company users', {
        icon: 'ℹ️',
        duration: 3000,
      });
    } else if (entityType === 'borrower' && borrowerId) {
      toast('Borrower details view not available for company users', {
        icon: 'ℹ️',
        duration: 3000,
      });
    }
  };
  
  return (
    <li className="py-3">
      <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${statusColor} bg-opacity-20`}>
          <Icon className={`h-4 w-4 ${statusColor.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500">{time}</p>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        <div>
          <button
            onClick={handleActivityClick}
            className="flex items-center justify-center py-1 px-3 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            disabled={!entityId && !borrowerId}
          >
            View
            <ChevronRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </li>
  );
};

const LenderStats = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [stats, setStats] = useState({
    totalLoans: 0,
    approvedLoans: 0,
    pendingApplications: 0,
    totalAmount: 0,
    approvalRate: 0,
    avgProcessingTime: 0,
    processingTimeTrend: 0,
    approvalRateTrend: 0,
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

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    const { lenderId } = router.query;
    if (lenderId) {
      fetchAll(lenderId);
    }
  }, [user, router]);

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
      const iconMap = { 
        FileText, CheckCircle, Clock, RefreshCw, XCircle, Upload, 
        Edit, FileCheck, FilePlus, FileX, FilePen, MessageSquare 
      };
      const mappedActivities = activities.map(a => ({
        ...a,
        icon: iconMap[a.icon] || FileText,
        statusColor: `bg-${a.statusColor}-500`
      }));

      console.log("Metrics", dashboardData.stats);

      // Extract stats from dashboard data
      const stats = {
        totalLoans: dashboardData.stats?.totalLoans || 0,
        approvedLoans: dashboardData.stats?.approvedLoans || 0,
        pendingApplications: dashboardData.stats?.pendingApplications || 0,
        totalAmount: dashboardData.stats?.totalAmount || 0,
        metrics: {
          approvalRate: dashboardData.stats?.metrics?.approvalRate || 0,
          avgProcessingTime: dashboardData.stats?.metrics?.avgProcessingTime || 0,
          processingTimeTrend: dashboardData.stats?.metrics?.processingTimeTrend || 0,
          approvalRateTrend: dashboardData.stats?.metrics?.approvalRateTrend || 0,
        },
        percentChanges: {
          loans: 0,
          applications: 0,
          amount: 0
        }
      };

      // Get recent loans from dashboard data
      const recentLoans = dashboardData.recentLoans || [];

      // Get loan counts for borrowers
      const loansMap = {};
      recentBorrowers.forEach(borrower => {
        loansMap[borrower._id] = borrower.loanCount || 0;
      });

      setStats(stats);
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

  const handleBack = () => {
    router.push('/company/lenders');
  };

  const handleViewLoan = (loanId) => {
    // For company users, we can't navigate to lender-specific pages
    toast('Loan details view not available for company users', {
      icon: 'ℹ️',
      duration: 3000,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <CompanyLayout title="Lender Stats">
        <div className="py-6">
          {/* Header Skeleton */}
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-start justify-center space-x-4 flex-col">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4 ml-5"></div>
              <div>
                <div className="h-8 w-96 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Lender Info Card Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="mt-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* Main Content Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Loans Section Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="w-full">
                          <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-8 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Performance Metrics Skeleton */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                      <div className="flex items-end space-x-2 mb-2">
                        <div className="h-10 w-16 bg-gray-200 rounded"></div>
                        <div className="h-4 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                      <div className="flex items-end space-x-2 mb-2">
                        <div className="h-10 w-8 bg-gray-200 rounded"></div>
                        <div className="h-5 w-12 bg-gray-200 rounded"></div>
                        <div className="h-4 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-3 w-40 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              {/* Borrowers Card Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="space-y-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-5 w-16 bg-gray-200 rounded"></div>
                          <div className="h-4 w-4 bg-gray-200 rounded-full ml-2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recent Activity Timeline Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Loan Programs Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  if (!lenderHeader) {
    return (
      <CompanyLayout title="Lender Stats">
        <div className="text-center py-12">
          <p className="text-gray-600">Lender not found</p>
          <button
            onClick={handleBack}
            className="mt-4 text-primary hover:text-primary-dark"
          >
            Back to Lenders
          </button>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Lender Stats">
      <div className="py-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-start justify-center space-x-4 flex-col">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Lenders</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lender performance overview and statistics</h1>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => fetchAll(router.query.lenderId, true)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Refresh Data
            </button>
          </div>
        </div>

        {/* Lender Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{lenderHeader.name}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  {console.log("lenderHeader", lenderHeader)}
                  <Mail className="h-4 w-4" />
                  <span>{lenderHeader.email}</span>
                </div>
                {lenderHeader.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{lenderHeader.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Loans" 
            value={stats?.totalLoans || 0} 
            icon={Briefcase} 
            trend={false}
            bgClass="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <StatCard 
            title="Approved Loans" 
            value={stats?.approvedLoans || 0} 
            icon={CheckCircle}
            trend={false}
            bgClass="bg-gradient-to-br from-green-600 to-green-800"
          />
          <StatCard 
            title="Pending Applications" 
            value={stats?.pendingApplications || 0} 
            icon={Clock}
            trend={false}
            bgClass="bg-gradient-to-br from-yellow-500 to-yellow-700"
          />
          <StatCard 
            title="Total Volume" 
            value={formatCurrency(stats?.totalAmount)} 
            icon={BadgeDollarSign}
            trend={false}
            bgClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
          />
        </div>

        {/* Main Content 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Loans Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-gray-900">Recent Loan Applications</h2>
            </div>

            {recentLoans.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recentLoans.slice(0, 8).map((loan) => (
                  <LoanCard
                    key={loan._id}
                    loan={loan}
                    onView={handleViewLoan}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent applications</h3>
                <p className="mt-1 text-sm text-gray-500">This lender has no recent loan applications</p>
              </div>
            )}

            {/* Performance Metrics */}
            {recentLoans.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Lending Performance Metrics</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Approval Rate</h4>
                      <div className="flex items-end space-x-2">
                        <div className="text-4xl font-bold text-gray-900">{stats?.metrics?.approvalRate || 0}%</div>
                        <div className={`pb-1 text-sm ${stats?.metrics?.approvalRateTrend >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          {stats?.metrics?.approvalRateTrend >= 0 ? '+' : ''}{stats?.metrics?.approvalRateTrend || 0}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Based on last 30 days</p>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Avg. Processing Time</h4>
                      <div className="flex items-end space-x-2">
                        <div className="text-4xl font-bold text-gray-900">{stats?.metrics?.avgProcessingTime || 0}</div>
                        <div className="pb-1 text-lg font-medium text-gray-700">days</div>
                        <div className={`pb-1 text-sm ${stats?.metrics?.processingTimeTrend <= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          {stats?.metrics?.processingTimeTrend <= 0 ? '+' : ''}{Math.abs(stats?.metrics?.processingTimeTrend || 0)}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">From application to approval</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Borrowers, Programs and Activity */}
          <div className="space-y-6">
            {/* Borrowers Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Borrowers</h2>
              </div>

              {recentBorrowers.length > 0 ? (
                <div className="space-y-1">
                  {recentBorrowers.slice(0, 4).map((borrower) => (
                    <BorrowerItem 
                      key={borrower._id} 
                      borrower={borrower} 
                      borrowerLoans={borrowerLoans} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="mx-auto h-6 w-6 text-gray-400" />
                  <h3 className="mt-1 text-sm font-medium text-gray-900">No borrowers yet</h3>
                  <p className="mt-1 text-xs text-gray-500">This lender has no borrowers</p>
                </div>
              )}
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                <button 
                  onClick={async () => {
                    try {
                      setActivitiesLoading(true);
                      toast.loading('Refreshing activities...');
                      await fetchAll(router.query.lenderId, true);
                      toast.success('Activities refreshed');
                    } catch (error) {
                      console.error('Error refreshing activities:', error);
                      toast.error('Failed to refresh activities');
                    } finally {
                      setActivitiesLoading(false);
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={activitiesLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${activitiesLoading ? 'animate-spin' : ''}`} />
                  {activitiesLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {activitiesLoading && activities.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id || Math.random().toString()}
                      icon={activity.icon}
                      title={activity.title}
                      time={activity.time}
                      status={activity.status}
                      statusColor={activity.statusColor}
                      entityId={activity.entityId}
                      entityType={activity.entityType}
                      loanNumber={activity.loanNumber}
                      description={activity.description}
                      borrowerId={activity.borrowerId}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>

            {/* Loan Programs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Active Programs</h2>
              </div>

              {programs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {console.log("programs", programs)}
                  {programs.slice(0, 5).map((program) => (
                    <div key={program._id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 bg-green-500`}></div>
                          <span className="text-sm text-gray-900 font-medium">
                            {program.programName || program.displayName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {program.programType && (
                            <span className="capitalize">{program.programType}</span>
                          )}
                          {program.loanTerm && (
                            <span> · {program.loanTerm}yr</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Home className="mx-auto h-6 w-6 text-gray-400" />
                  <h3 className="mt-1 text-sm font-medium text-gray-900">No programs</h3>
                  <p className="mt-1 text-xs text-gray-500">No loan programs available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default LenderStats;