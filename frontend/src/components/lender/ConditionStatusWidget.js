import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import lenderService from '../../services/api/lender.service';

/**
 * ConditionStatusWidget Component
 * Dashboard widget displaying summary of condition statuses across loans
 */
const ConditionStatusWidget = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    submitted: 0,
    cleared: 0,
    waived: 0,
    expired: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentConditions, setRecentConditions] = useState([]);

  useEffect(() => {
    fetchConditionStats();
  }, []);

  const fetchConditionStats = async () => {
    try {
      setLoading(true);
      // Fetch condition statistics
      const statsResponse = await lenderService.getConditionStats();
      setStats(statsResponse.data.data || {
        pending: 0,
        inProgress: 0,
        submitted: 0,
        cleared: 0,
        waived: 0,
        expired: 0,
        total: 0
      });

      // Fetch most recent updated conditions
      const recentResponse = await lenderService.getRecentConditions();
      setRecentConditions(recentResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching condition statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecentCondition = (loanId, conditionId) => {
    router.push({
      pathname: `/lender/application-details`,
      query: { id: loanId, tab: 'conditions', highlight: conditionId }
    });
  };

  const handleViewAllConditions = (status) => {
    router.push({
      pathname: `/lender/conditions`,
      query: status ? { status } : {}
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-500',
      in_progress: 'text-blue-500',
      submitted: 'text-indigo-500',
      cleared: 'text-green-500',
      waived: 'text-purple-500',
      expired: 'text-red-500'
    };
    return colors[status] || 'text-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Condition Status Overview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Summary of loan conditions and their current statuses
        </p>
      </div>

      {loading ? (
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('pending')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-yellow-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Pending</p>
                  <p className="text-xl font-semibold text-yellow-500">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('in_progress')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-blue-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">In Progress</p>
                  <p className="text-xl font-semibold text-blue-500">{stats.inProgress}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('submitted')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-indigo-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-xl font-semibold text-indigo-500">{stats.submitted}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('cleared')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-green-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Cleared</p>
                  <p className="text-xl font-semibold text-green-500">{stats.cleared}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('waived')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-purple-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Waived</p>
                  <p className="text-xl font-semibold text-purple-500">{stats.waived}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewAllConditions('expired')}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 text-red-500">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Expired</p>
                  <p className="text-xl font-semibold text-red-500">{stats.expired}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-6">
            <h4 className="text-base font-medium text-gray-900">Recent Condition Activity</h4>
            {recentConditions.length > 0 ? (
              <ul className="mt-2 divide-y divide-gray-200">
                {recentConditions.map(condition => (
                  <li 
                    key={condition._id} 
                    className="py-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewRecentCondition(condition.loanId, condition._id)}
                  >
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(condition.status)}`}></span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {condition.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Loan #{condition.loanNumber || condition.loanId.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full uppercase ${getStatusColor(condition.status)} bg-opacity-10`}>
                        {condition.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(condition.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No recent condition activity</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => handleViewAllConditions()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              View All Conditions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionStatusWidget;
