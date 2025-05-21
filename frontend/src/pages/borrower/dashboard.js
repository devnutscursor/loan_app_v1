import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import { useRouter } from 'next/router';
import { 
  BarChart3, 
  FileText, 
  ChevronRight, 
  Calendar,
  Clock,
  CheckCircle, 
  AlertTriangle,
  BadgeDollarSign,
  ClipboardList,
  ArrowRightCircle,
  DollarSign,
  FileCheck,
  Wallet,
  Bell,
  Plus,
  LineChart,
  Download,
  ExternalLink
} from 'lucide-react';

// Component for stat cards with gradient backgrounds
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

// Quick action button component
const QuickActionButton = ({ icon: Icon, label, onClick, bgColor }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${bgColor} hover:shadow-md hover:scale-105`}
  >
    <Icon className="h-7 w-7 text-white mb-2" />
    <span className="text-xs font-medium text-white text-center">{label}</span>
  </button>
);

// Loan card component with modern design
const LoanCard = ({ loan, onView }) => {
  // Calculate progress percentage
  const progress = (loan.amountPaid / loan.amount) * 100 || 0;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Status styling
  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'rejected': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{loan.purpose || "Loan"}</h4>
            <p className="text-xs text-gray-500">Applied: {formatDate(loan.createdAt)}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(loan.status)}`}>
            {loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || "Status"}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Interest Rate</p>
            <p className="font-semibold text-gray-900">{loan.interestRate}%</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Term</p>
            <p className="font-semibold text-gray-900">{loan.term} months</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Due Date</p>
            <p className="font-semibold text-gray-900">{formatDate(loan.dueDate)}</p>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Repayment Progress</span>
            <span className="text-xs font-medium text-gray-800">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Paid: {formatCurrency(loan.amountPaid)}</span>
            <span className="text-xs text-gray-500">Total: {formatCurrency(loan.amount)}</span>
          </div>
        </div>
        
        <button
          onClick={() => onView(loan._id)}
          className="w-full mt-2 flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          View Loan Details
          <ChevronRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ icon: Icon, title, time, status, statusColor }) => (
  <li className="py-3">
    <div className="flex items-center space-x-4">
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${statusColor} bg-opacity-20`}>
        <Icon className={`h-4 w-4 ${statusColor.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${statusColor.replace('bg-', 'text-')}`}>
          {status}
        </span>
      </div>
    </div>
  </li>
);

// Progress component for payment tracking
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

// Summary card component
const SummaryCard = ({ title, value, subtitle, icon: Icon, iconColor }) => (
  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden p-4 hover:shadow-sm transition-all duration-200">
    <div className="flex items-center mb-2">
      <div className={`h-8 w-8 rounded-full ${iconColor} bg-opacity-20 flex items-center justify-center mr-3`}>
        <Icon className={`h-4 w-4 ${iconColor.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    </div>
    <div className="flex items-end">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="ml-2 text-xs text-gray-500 mb-1">{subtitle}</div>
    </div>
  </div>
);

const BorrowerDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingApplications: 0,
    totalAmount: 0,
    percentChanges: {
      loans: 0,
      applications: 0,
      amount: 0
    }
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    upcomingPayment: 0,
    nextDueDate: null
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch dashboard stats
        const statsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch recent loans
        const loansResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/loans?limit=3`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch recent activities
        const activitiesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/activities?limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Process the data
        const statsData = statsResponse.data.data || {};
        setStats({
          ...statsData,
          percentChanges: statsData.percentChanges || {
            loans: 0,
            applications: 0, 
            amount: 0
          }
        });
        
        const loansData = loansResponse.data.data?.loans || [];
        setRecentLoans(loansData);
        
        const activitiesData = activitiesResponse.data.data?.activities || [];
        setActivities(activitiesData);
        
        // Calculate payment summary from loans
        let totalPaid = 0;
        let upcomingPayment = 0;
        let nextDueDate = null;
        
        loansData.forEach(loan => {
          totalPaid += loan.amountPaid || 0;
          if (loan.status === 'approved' && (!nextDueDate || new Date(loan.dueDate) < new Date(nextDueDate))) {
            nextDueDate = loan.dueDate;
            upcomingPayment = loan.monthlyPayment || 0;
          }
        });
        
        setPaymentSummary({
          totalPaid,
          upcomingPayment,
          nextDueDate
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleViewLoan = (loanId) => {
    router.push(`/borrower/loans/${loanId}`);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Generate sample activities if none exist in the API response
  const processedActivities = activities.length > 0 ? activities : [
    { 
      _id: '1',
      type: 'application',
      title: 'New loan application submitted',
      description: 'Your application was received and is being processed.',
      date: new Date(Date.now() - 2 * 3600 * 1000),
      status: 'New',
      statusColor: 'bg-blue-500'
    },
    { 
      _id: '2',
      type: 'document',
      title: 'Document verification requested',
      description: 'Please upload the required identity verification documents.',
      date: new Date(Date.now() - 8 * 3600 * 1000),
      status: 'Pending',
      statusColor: 'bg-yellow-500'
    },
    { 
      _id: '3',
      type: 'payment',
      title: 'Payment reminder',
      description: 'Your next loan payment is due in 3 days.',
      date: new Date(Date.now() - 24 * 3600 * 1000),
      status: 'Upcoming',
      statusColor: 'bg-blue-500'
    }
  ];
  
  return (
    <MainLayout title="Borrower Dashboard">
      <div className="py-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your loans and applications
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/borrower/apply"
              className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              Apply for a Loan
            </Link>
            <Link href="/borrower/documents" 
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              My Documents
            </Link>
          </div>
        </div>
        
        {loading ? (
          <>
    {/* Stats Grid Loading Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
      ))}
    </div>

    {/* Main Content Layout Loading Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Loans Section Loading Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg border border-gray-50 p-4 animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j}>
                    <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 w-1/3 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-1">
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Activity Feed Loading Skeleton */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map(i => (
              <li key={i} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Resources Card - keeping this commented as requested */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Resources</h2>
          </div>
          
          <div className="space-y-3">
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Loan Requirements</p>
                <p className="text-xs text-gray-500">Learn about eligibility criteria</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
            
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <LineChart className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Financial Education</p>
                <p className="text-xs text-gray-500">Tips for managing your finances</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
            
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Reminders</p>
                <p className="text-xs text-gray-500">Set up alerts for upcoming payments</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard 
                title="Total Loans" 
                value={stats?.totalLoans || 0} 
                icon={FileText} 
                trend={true}
                trendValue={stats?.percentChanges?.loans || 0}
                bgClass="bg-gradient-to-br from-blue-600 to-blue-800"
              />
              <StatCard 
                title="Active Loans" 
                value={stats?.activeLoans || 0} 
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
                title="Total Borrowed" 
                value={formatCurrency(stats?.totalAmount)} 
                icon={BadgeDollarSign}
                trend={true}
                trendValue={stats?.percentChanges?.amount || 0}
                bgClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
              />
            </div>

            {/* Quick Actions Row */}
            {/* <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <QuickActionButton 
                  icon={Plus} 
                  label="New Loan Application" 
                  onClick={() => router.push('/borrower/apply')}
                  bgColor="bg-gradient-to-r from-blue-600 to-blue-800" 
                />
                <QuickActionButton 
                  icon={Wallet} 
                  label="Make a Payment" 
                  onClick={() => router.push('/borrower/payments')}
                  bgColor="bg-gradient-to-r from-green-600 to-green-800" 
                />
                <QuickActionButton 
                  icon={FileCheck} 
                  label="Upload Documents" 
                  onClick={() => router.push('/borrower/documents')}
                  bgColor="bg-gradient-to-r from-purple-600 to-purple-800" 
                />
                <QuickActionButton 
                  icon={Download} 
                  label="Download Statements" 
                  onClick={() => toast.info('Statement download coming soon!')}
                  bgColor="bg-gradient-to-r from-indigo-600 to-indigo-800" 
                />
              </div>
            </div> */}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Loans Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900">My Loans</h2>
                  <Link href="/borrower/loans" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                {recentLoans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentLoans.map((loan) => (
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No loans yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by applying for your first loan</p>
                    <Link href="/borrower/apply" className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      Apply Now
                    </Link>
                  </div>
                )}

                {/* Payment Summary */}
                {/* {recentLoans.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Payment Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SummaryCard
                        title="Total Paid"
                        value={formatCurrency(paymentSummary.totalPaid)}
                        subtitle="to date"
                        icon={BadgeDollarSign}
                        iconColor="bg-green-500"
                      />
                      <SummaryCard
                        title="Next Payment"
                        value={formatCurrency(paymentSummary.upcomingPayment)}
                        subtitle="due"
                        icon={Calendar}
                        iconColor="bg-blue-500"
                      />
                      <SummaryCard
                        title="Due Date"
                        value={formatDate(paymentSummary.nextDueDate)}
                        subtitle=""
                        icon={Clock}
                        iconColor="bg-yellow-500"
                      />
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      <Link href="/borrower/payments" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                        View Payment History <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Right Column: Activity and Resources */}
              <div className="space-y-6">
                {/* Activity Feed */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                  </div>

                  {processedActivities.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {processedActivities.map((activity, index) => (
                        <ActivityItem
                          key={activity._id || index}
                          icon={
                            activity.type === 'application' ? FileText :
                            activity.type === 'payment' ? DollarSign :
                            activity.type === 'document' ? FileCheck :
                            activity.type === 'status' ? Bell : 
                            Clock
                          }
                          title={activity.title}
                          time={typeof activity.date === 'string' 
                            ? new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          }
                          status={activity.status}
                          statusColor={activity.statusColor || 'bg-gray-500'}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No activity</h3>
                      <p className="mt-1 text-sm text-gray-500">Your recent activities will appear here.</p>
                    </div>
                  )}
                </div>

                {/* Resources Card */}
                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Resources</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Loan Requirements</p>
                        <p className="text-xs text-gray-500">Learn about eligibility criteria</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                    
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <LineChart className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Financial Education</p>
                        <p className="text-xs text-gray-500">Tips for managing your finances</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                    
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Bell className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment Reminders</p>
                        <p className="text-xs text-gray-500">Set up alerts for upcoming payments</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                  </div>
                </div> */}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default BorrowerDashboard;