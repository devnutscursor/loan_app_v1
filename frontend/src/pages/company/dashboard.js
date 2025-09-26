import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  TrendingUp,
  Building2,
  UserCheck,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Component for stat cards
const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass, textClass = "text-white" }) => (
  <div className={`${bgClass} rounded-xl p-6 shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${textClass} opacity-90`}>{title}</p>
        <p className={`text-2xl font-bold ${textClass} mt-1`}>{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-300 mr-1" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <Icon className={`h-8 w-8 ${textClass} opacity-80`} />
    </div>
  </div>
);

// Modular skeleton components
const StatCardSkeleton = ({ bgClass }) => (
  <div className={`${bgClass} rounded-xl p-6 shadow-lg animate-pulse`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 w-24 bg-white bg-opacity-30 rounded mb-2"></div>
        <div className="h-8 w-16 bg-white bg-opacity-30 rounded mb-2"></div>
        <div className="h-3 w-12 bg-white bg-opacity-30 rounded"></div>
      </div>
      <div className="h-8 w-8 bg-white bg-opacity-30 rounded"></div>
    </div>
  </div>
);

const TopLenderCardSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-40 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const QuickActionSkeleton = () => (
  <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-100 animate-pulse">
    <div className="h-6 w-6 bg-gray-200 rounded"></div>
    <div className="text-left flex-1">
      <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
      <div className="h-3 w-40 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Component for top lender card
const TopLenderCard = ({ lender, rank, onClick, sortBy }) => (
  <div 
    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
          {rank}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{lender.lender.user.name}</h4>
          <p className="text-sm text-gray-600 max-w-[150px] truncate">{lender.lender.user.email}</p>
        </div>
      </div>
      <div className="text-right">
        {sortBy === 'borrowerCount' ? (
          <>
            <p className="text-sm font-bold text-primary">{lender.metrics.borrowerCount} borrowers</p>
            <p className="text-xs text-gray-600">${lender.metrics.totalLoanAmount?.toLocaleString() || '0'}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-primary">${lender.metrics.totalLoanAmount?.toLocaleString() || '0'}</p>
            <p className="text-xs text-gray-600">{lender.metrics.borrowerCount} borrowers</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const CompanyDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topLenders, setTopLenders] = useState([]);
  const [sortBy, setSortBy] = useState('borrowerCount'); // 'borrowerCount' or 'totalLoanAmount'

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  // Refetch top lenders when sort changes
  useEffect(() => {
    if (user && user.role === 'company' && stats) {
      fetchTopLenders();
    }
  }, [sortBy]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch company stats
      const statsResponse = await companyService.getStats(user.company);
      setStats(statsResponse.data.data.summary);

      // Fetch top lenders with current sort
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

  if (loading) {
    return (
      <CompanyLayout title="Company Dashboard">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* Top Lenders Section Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <TopLenderCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionSkeleton />
              <QuickActionSkeleton />
              <div className="hidden md:block">
                <QuickActionSkeleton />
              </div>
            </div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Company Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.firstName} {user?.lastName}</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            <span>{user?.company?.name || 'Company'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Loan Officers"
            value={stats?.totalLenders || 0}
            icon={Users}
            bgClass="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <StatCard
            title="Total Borrowers"
            value={stats?.totalBorrowers || 0}
            icon={UserCheck}
            bgClass="bg-gradient-to-br from-green-600 to-green-800"
          />
          <StatCard
            title="Active Loans"
            value={stats?.totalLoans || 0}
            icon={FileText}
            bgClass="bg-gradient-to-br from-yellow-500 to-yellow-700"
          />
          <StatCard
            title="Total Loan Volume"
            value={`$${stats?.totalLoanVolume?.toLocaleString() || '0'}`}
            icon={DollarSign}
            bgClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
          />
        </div>

        {/* Top Loan Officers Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
              <div className="flex flex-col items-center sm:items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Top Loan Officers</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Ranked by {sortBy === 'borrowerCount' ? 'number of borrowers' : 'total loan amount'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Sort Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <button
                    onClick={handleSortToggle}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {sortBy === 'borrowerCount' ? 'Borrowers' : 'Amount'}
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleViewAllLenders}
                  className="flex items-center space-x-1 text-primary hover:text-primary-dark transition-colors"
                >
                  <span className="text-sm font-medium">View All</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {topLenders.length > 0 ? (
              <div className="space-y-3">
                {topLenders.map((lender, index) => (
                  <TopLenderCard
                    key={lender.lender.user.id}
                    lender={lender}
                    rank={index + 1}
                    onClick={() => handleLenderClick(lender.lender.id)}
                    sortBy={sortBy}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No loan officers found</p>
                <p className="text-sm text-gray-500 mt-1">Loan Officers will appear here once they're added to your company</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/company/lenders')}
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-gray-900">View All Loan Officers</p>
                <p className="text-sm text-gray-600">Browse all company loan officers</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/company/profile')}
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Building2 className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Company Profile</p>
                <p className="text-sm text-gray-600">Update company information</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyDashboard;
