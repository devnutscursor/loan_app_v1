import React from 'react';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import LoanCard from './LoanCard';

const RecentLoansSection = ({ recentLoans, stats, onViewLoan, onNewLoanClick }) => {
  return (
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
              onView={onViewLoan}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recent applications</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new loan application</p>
          <button
            onClick={onNewLoanClick}
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
            <div className="grid sm:grid-cols-2 grid-cols-1 text-center sm:text-start gap-8">
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-3">Approval Rate</h4>
                <div className="flex items-end justify-center sm:justify-start space-x-2">
                  <div className="text-4xl font-bold text-gray-900">{stats?.metrics?.approvalRate || 0}%</div>
                  <div className={`pb-1 text-sm ${stats?.metrics?.approvalRateTrend >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    {stats?.metrics?.approvalRateTrend >= 0 ? '+' : ''}{stats?.metrics?.approvalRateTrend || 0}%
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Based on last 30 days</p>
              </div>
              
              <div>
                <h4 className="text-base font-medium text-gray-700 mb-3">Avg. Processing Time</h4>
                <div className="flex items-end justify-center sm:justify-start space-x-2">
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
  );
};

export default RecentLoansSection;
