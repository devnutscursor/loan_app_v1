import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import XMLLoanUpload from '../../components/lender/loans/XMLLoanUpload_new';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  Calendar,
  Clock,
  CheckCircle, 
  AlertTriangle,
  Briefcase,
  Home,
  TrendingUp,
  BadgeDollarSign,
  ClipboardList,
  ArrowRightCircle,
  User,
  LineChart,
  XCircle,
  Upload,
  RefreshCw,
  Edit,
  FileCheck,
  FilePlus,
  FileX,
  FilePen,
  MessageSquare
} from 'lucide-react';

// Component for quick action buttons
const QuickActionButton = ({ icon: Icon, label, onClick, bgColor }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${bgColor} hover:shadow-md hover:scale-105`}
  >
    <Icon className="h-7 w-7 text-white mb-2" />
    <span className="text-xs font-medium text-white text-center">{label}</span>
  </button>
);

// Component for stat cards
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

// Progress component
const ProgressItem = ({ label, value, maxValue, color }) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-800">{value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ icon: Icon, title, time, status, statusColor, entityId, entityType, loanNumber, description, borrowerId }) => {
  const router = useRouter();
  
  // Handle click on activity item to navigate to related entity
  const handleActivityClick = () => {
    if (entityType === 'loan' && entityId) {
      if (status === 'Approved' || status === 'Rejected' || status === 'Correction') {
        // For document status changes, navigate to the documents tab
        router.push(`/lender/loans/${entityId}?tab=documents`);
      } else {
        router.push(`/lender/loans/${entityId}`);
      }
    } else if (entityType === 'borrower' && borrowerId) {
      // For message activities, navigate to the messages page with the specific borrower
      router.push(`/lender/messages?borrowerId=${borrowerId}`);
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

// Recent loan card component
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
              <p className="text-xs text-gray-500">Loan# {loan.loanNumber || "Loan"}</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(loan.status)}`}>
            {loan.status?.toLowerCase() === 'conditional approval' ? 'Approved' : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || 'Status'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(loan.loanDetails?.loanAmount)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Program</p>
            <p className="font-semibold text-gray-900">{loan.loanDetails?.programType || "N/A"}</p>
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

// Borrower item component
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
        <Link href={`/lender/loans?borrowerId=${borrower._id}`} className="ml-2 text-gray-500 hover:text-blue-700">
          <ArrowRightCircle className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

// Program item component
const ProgramItem = ({ program }) => {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center">
        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${program.isAvailableToBorrower ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className="text-sm text-gray-900 font-medium">
          {program.displayName || program.programName}
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
  );
};

const LenderDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
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
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats (includes recent loans)
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/dashboard?loanLimit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch borrowers
      const borrowersResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/borrowers?limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch loan programs
      const programsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/loan-programs?limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Process responses
      const dashboardData = statsResponse.data.data || {};
      setStats(dashboardData);
      
      // Use the recent loans from the dashboard API response
      setRecentLoans(dashboardData.recentLoans || []);

      const borrowersData = borrowersResponse.data.data || [];
      setRecentBorrowers(borrowersData);

      const programsData = programsResponse.data.data || [];
      setPrograms(programsData);

      // Initialize borrower loan count map
      const loansMap = {};
      
      // Get lender ID
      let lenderId = null;
      try {
        const lenderResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        lenderId = lenderResponse.data.data._id;
      } catch (err) {
        console.error('Error fetching lender profile:', err);
      }
      
      // Count loans for each borrower
      if (lenderId) {
        for (const borrower of borrowersData) {
          try {
            // Get loans for this specific borrower from lender's borrower endpoint
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/${lenderId}/borrowers/${borrower._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // The response structure has loans array in data.loans
            const loans = response.data.data.loans || [];
            loansMap[borrower._id] = loans.length;
            console.log(`Borrower ${borrower._id} has ${loans.length} loans`);
          } catch (err) {
            console.error(`Error fetching loans for borrower ${borrower._id}:`, err);
            loansMap[borrower._id] = 0;
          }
        }
      }
      
      setBorrowerLoans(loansMap);
      
      // Fetch real activities from backend
      try {
        // Use axios directly to avoid import issues
        console.log('Fetching activities from API...');
        const activitiesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/activities?limit=5&_=${Date.now()}`, // Add cache-busting
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log('Activities response:', activitiesResponse.data);
        if (activitiesResponse.data && activitiesResponse.data.status === 'success') {
          // Map backend icons to Lucide React components
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
            'FilePen': FilePen,
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
          console.log('Mapped activities:', mappedActivities);
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
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  return (
    <MainLayout title="Lender Dashboard">
      <div className="py-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your lending activity
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowLoanModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              New Loan
            </button>
            <Link href="/lender/borrowers" 
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              View All Borrowers
            </Link>
          </div>
        </div>
        
        {loading ? (
          <>
    {/* Stats Cards Loading Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
      ))}
    </div>

    {/* Quick Actions Row - uncomment if needed */}
    {/* <div className="mb-6">
      <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    </div> */}

    {/* Main Content Layout Loading Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Loans Section Loading Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
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

        {/* Performance Metrics Loading Skeleton */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {[1, 2, 3].map(i => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-10 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-gray-300 rounded-full" 
                      style={{ width: `${(i * 20) + 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="flex items-end space-x-1 mb-1">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-36 bg-gray-200 rounded mb-4"></div>
              
              <div className="h-3 w-36 bg-gray-200 rounded mb-2"></div>
              <div className="flex items-end space-x-1 mb-1">
                <div className="h-8 w-10 bg-gray-200 rounded"></div>
                <div className="h-5 w-12 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Borrowers, Activities and Programs Loading Skeleton */}
      <div className="space-y-6">
        {/* Borrowers Card Loading Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
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
        
        {/* Recent Activity Timeline Loading Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map(i => (
              <li key={i} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Loan Programs Loading Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
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
  </>
        ) : (
          <>
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Stats Cards */}
              <StatCard 
                title="Total Loans" 
                value={stats?.totalLoans || 0} 
                icon={Briefcase} 
                trend={true}
                trendValue={stats?.percentChanges?.loans || 0}
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
                trend={true}
                trendValue={stats?.percentChanges?.applications || 0} 
                bgClass="bg-gradient-to-br from-yellow-500 to-yellow-700"
              />
              <StatCard 
                title="Total Volume" 
                value={formatCurrency(stats?.totalAmount)} 
                icon={BadgeDollarSign}
                trend={true}
                trendValue={stats?.percentChanges?.amount || 0}
                bgClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
              />
            </div>

            {/* Main Content 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Loans Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900">Recent Loan Applications</h2>
                  <Link href="/lender/loans" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                {recentLoans.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Display actual loans without duplication */}
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
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new loan application</p>
                    <button
              onClick={() => setShowLoanModal(true)}
              className="mt-3 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              New Loan
            </button>
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
                    <Link href="/lender/borrowers" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                      All <ChevronRight className="ml-0.5 h-4 w-4" />
                    </Link>
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
                      <p className="mt-1 text-xs text-gray-500">Add your first borrower</p>
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
                        const token = localStorage.getItem('token');
                        toast.loading('Refreshing activities...');
                        const response = await axios.get(
                          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/activities?limit=5&_=${Date.now()}`,
                          { 
                            headers: { Authorization: `Bearer ${token}` },
                            timeout: 10000 // 10 second timeout  
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
                            'FilePen': FilePen,
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
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Refresh
                  </button>
                </div>

                  {activities.length > 0 ? (
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
                    <Link href="/lender/programs" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                      Manage <ChevronRight className="ml-0.5 h-4 w-4" />
                    </Link>
                  </div>

                  {programs.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {programs.slice(0, 5).map((program) => (
                        <ProgramItem key={program._id} program={program} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Home className="mx-auto h-6 w-6 text-gray-400" />
                      <h3 className="mt-1 text-sm font-medium text-gray-900">No programs</h3>
                      <p className="mt-1 text-xs text-gray-500">Create your first loan program</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* XML Loan Upload Modal */}
      <XMLLoanUpload 
        isOpen={showLoanModal} 
        onClose={() => setShowLoanModal(false)} 
        onSuccess={() => {
          setShowLoanModal(false);
          toast.success('Loan created successfully');
          setShouldRefreshDashboard(true); // Trigger dashboard refresh
        }} 
      />
    </MainLayout>
  );
};

export default LenderDashboard;