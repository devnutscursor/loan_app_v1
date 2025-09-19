import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { adminService } from '../../services/api';

// Components
const StatCard = ({ title, value, icon, change, changeType }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
          <dl className='text-end'>
            <dt className="font-medium text-gray-500 text-opacity-80 truncate text-end xl:text-start">{title}</dt>
            <dd className="flex items-baseline xl:justify-start justify-end min-w-28 xl:min-w-0">
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className={`font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'increase' ? '↑' : '↓'} {change}
            </span>{' '}
            <span className="text-gray-500">from previous period</span>
          </div>
        </div>
      )}
    </div>
  );
};



const UserStatistics = ({ users }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Statistics</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Borrowers</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.borrowers}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Lenders</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.lenders}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-500">Admins</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{users.admins}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoanStatistics = ({ loanStats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Statistics</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Total Applications</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{loanStats.totalApplications}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-green-600 text-center sm:text-start">{loanStats.approved}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600 text-center sm:text-start">{loanStats.pending}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Rejected</p>
            <p className="mt-1 text-2xl font-semibold text-red-600 text-center sm:text-start">{loanStats.rejected}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Total Loan Volume</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{formatCurrency(loanStats.totalVolume)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-start">Average Loan Amount</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 text-center sm:text-start">{formatCurrency(loanStats.averageAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalLoans: 0,
      totalUsers: 0,
      totalVolume: 0,
      activeLoans: 0
    },
    users: {
      borrowers: 0,
      lenders: 0,
      admins: 0
    },
    loanStats: {
      totalApplications: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalVolume: 0,
      averageAmount: 0
    }
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check if logout is in progress to prevent unnecessary API calls
        const isLogoutInProgress = localStorage.getItem('logoutInProgress');
        if (isLogoutInProgress) {
          return;
        }
        
        setLoading(true);
        const response = await adminService.getDashboard();
        setDashboardData(response.data.data);
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
    };
    
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  if (loading) {
    return (
      <ProtectedRoute roles={['admin']}>
        <MainLayout title="Admin Dashboard">
          <div className="flex justify-center items-center h-screen">
            <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
