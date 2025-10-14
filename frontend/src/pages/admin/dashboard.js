import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import LoanStatistics from '@/components/admin/dashboard/LoanStatistics';
import UserStatistics from '@/components/admin/dashboard/UserStatistics';
import useAdminDashboard from '@/hooks/admin/useAdminDashboard';

// Skeleton component for stat cards
const StatCardSkeleton = () => (
  <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-md bg-gray-200"></div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton component for chart/statistics sections
const ChartSkeleton = () => (
  <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
    <div className="p-5">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div className="space-y-3">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { 
    dashboardData, 
    loading, 
    formatCurrency 
  } = useAdminDashboard();

  if (loading) {
    return (
      <ProtectedRoute roles={['admin']}>
        <MainLayout title="Admin Dashboard">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              {/* Skeleton Title */}
              <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
              
              {/* Skeleton Summary Cards */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              
              {/* Skeleton Main Content */}
              <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute roles={['admin']}>
      <MainLayout title="Admin Dashboard">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            
            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Loans"
                value={dashboardData.summary.totalLoans}
                icon={
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                }
                change="8%"
                changeType="increase"
              />
              
              <StatCard
                title="Total Users"
                value={dashboardData.summary.totalUsers}
                icon={
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                }
                change="12%"
                changeType="increase"
              />
              
              <StatCard
                title="Total Volume"
                value={formatCurrency(dashboardData.summary.totalVolume)}
                icon={
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                }
                change="23%"
                changeType="increase"
              />
              
              <StatCard
                title="Active Loans"
                value={dashboardData.summary.activeLoans}
                icon={
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                }
                change="5%"
                changeType="increase"
              />
            </div>
            
            {/* Main dashboard content */}
            <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <LoanStatistics loanStats={dashboardData.loanStats} />
              <UserStatistics users={dashboardData.users} />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
