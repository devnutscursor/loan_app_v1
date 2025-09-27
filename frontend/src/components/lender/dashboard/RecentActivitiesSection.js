import React from 'react';
import { RefreshCw } from 'lucide-react';
import ActivityItem from './ActivityItem';

const RecentActivitiesSection = ({ activities, activitiesLoading, onRefreshActivities }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <button 
          onClick={onRefreshActivities}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          disabled={activitiesLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${activitiesLoading ? 'animate-spin' : ''}`} />
          {activitiesLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {activitiesLoading && activities.length === 0 ? (
        // Loading skeleton for activities
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
  );
};

export default RecentActivitiesSection;
