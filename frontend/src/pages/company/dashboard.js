import React from 'react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useCompanyDashboard } from '../../hooks/company/useCompanyDashboard';
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

import { StatCard } from '../../components/company/dashboard/StatCards';
import TopLenderCard, { TopLenderCardSkeleton } from '../../components/company/dashboard/TopLenderCard';
import QuickActionSkeleton from '../../components/company/dashboard/QuickActionSkeleton';

const CompanyDashboard = () => {

  const {
    user,
    loading,
    stats,
    topLenders,
    sortBy,
    handleLenderClick,
    handleViewAllLenders,
    handleSortToggle,
    router,
  } = useCompanyDashboard();

  if (loading) {
    return (
      <CompanyLayout title="Company Dashboard">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="h-8 w-full max-w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-full max-w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 sm:h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* Top Lenders Section Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col items-center sm:items-start space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-full max-w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
