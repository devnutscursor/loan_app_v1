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

// Component for top lender card
const TopLenderCard = ({ lender, rank, onClick, sortBy }) => (
  <div 
    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold">
          {rank}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{lender.name}</h4>
          <p className="text-sm text-gray-600">{lender.email}</p>
        </div>
      </div>
      <div className="text-right">
        {sortBy === 'borrowerCount' ? (
          <>
            <p className="text-sm font-bold text-primary">{lender.borrowerCount} borrowers</p>
            <p className="text-xs text-gray-600">${lender.totalLoanAmount?.toLocaleString() || '0'}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-primary">${lender.totalLoanAmount?.toLocaleString() || '0'}</p>
            <p className="text-xs text-gray-600">{lender.borrowerCount} borrowers</p>
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
      setStats(statsResponse.data.data);

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
    router.push(`/company/lenders/${lenderId}`);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
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
            title="Total Lenders"
            value={stats?.totalLenders || 0}
            icon={Users}
            bgClass="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Borrowers"
            value={stats?.totalBorrowers || 0}
            icon={UserCheck}
            bgClass="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Active Loans"
            value={stats?.totalLoans || 0}
            icon={FileText}
            bgClass="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            title="Total Loan Volume"
            value={`$${stats?.totalLoanVolume?.toLocaleString() || '0'}`}
            icon={DollarSign}
            bgClass="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>

        {/* Top Lenders Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Top Lenders</h2>
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
            <p className="text-sm text-gray-600 mt-1">
              Ranked by {sortBy === 'borrowerCount' ? 'number of borrowers' : 'total loan amount'}
            </p>
          </div>
          
          <div className="p-6">
            {topLenders.length > 0 ? (
              <div className="space-y-3">
                {topLenders.map((lender, index) => (
                  <TopLenderCard
                    key={lender.lender.user.id}
                    lender={lender.lender.user}
                    rank={index + 1}
                    onClick={() => handleLenderClick(lender.lender.user.id)}
                    sortBy={sortBy}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No lenders found</p>
                <p className="text-sm text-gray-500 mt-1">Lenders will appear here once they're added to your company</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/company/lenders')}
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-gray-900">View All Lenders</p>
                <p className="text-sm text-gray-600">Browse all company lenders</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/company/profile')}
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
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
