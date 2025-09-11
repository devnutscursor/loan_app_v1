import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useLenderStats } from '../../hooks/useLenderStats';
import { LenderStatsSkeleton } from '../../components/company/lender-stats/LenderStatsSkeleton';
import StatCard from '../../components/company/lender-stats/StatCard';
import LoanCard from '../../components/company/lender-stats/LoanCard';
import BorrowerItem from '../../components/company/lender-stats/BorrowerItem';
import ActivityItem from '../../components/company/lender-stats/ActivityItem';
import { formatCurrency } from '../../utils/lenderStatsUtils';
import { 
  ArrowLeft,
  Users, 
  DollarSign, 
  FileText, 
  User,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  RefreshCw,
  Briefcase,
  Home,
  BadgeDollarSign
} from 'lucide-react';


const LenderStats = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { lenderId } = router.query;
  
  const {
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
  } = useLenderStats(user, lenderId);

  useEffect(() => {
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    if (lenderId) {
      fetchAll(lenderId);
    }
  }, [user, router, lenderId, fetchAll]);

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


  if (loading) {
    return (
      <CompanyLayout title="Lender Stats">
        <LenderStatsSkeleton />
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
              onClick={() => fetchAll(lenderId, true)}
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
                  onClick={() => refreshActivities(lenderId)}
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