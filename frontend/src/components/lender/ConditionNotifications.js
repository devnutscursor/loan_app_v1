import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import lenderService from '../../services/api/lender.service';

/**
 * ConditionNotifications Component
 * Displays notifications for condition updates and pending reviews
 */
const ConditionNotifications = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Get notifications related to conditions (e.g., conditions that need review)
      const response = await lenderService.getConditionNotifications();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching condition notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await lenderService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewCondition = (loanId, conditionId, notificationId) => {
    // Mark as read
    markAsRead(notificationId);
    
    // Navigate to the loan details page with conditions tab active
    router.push({
      pathname: `/lender/application-details`,
      query: { id: loanId, tab: 'conditions', highlight: conditionId }
    });
  };

  // Display a preview of notifications or the full list based on expanded state
  const displayedNotifications = expanded 
    ? notifications 
    : notifications.slice(0, 3);

  if (loading) {
    return (
      <div className="px-4 py-4 sm:px-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-5 sm:px-6">
        <div className="text-center text-sm text-gray-500">
          No pending condition notifications
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {displayedNotifications.map((notification) => (
          <li 
            key={notification._id} 
            className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
            onClick={() => handleViewCondition(
              notification.loanId, 
              notification.conditionId, 
              notification._id
            )}
          >
            <div className="flex items-center space-x-3">
              {!notification.read && (
                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary"></span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {notifications.length > 3 && (
        <div className="px-4 py-3 bg-gray-50 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            {expanded ? 'Show less' : `Show all (${notifications.length})`}
          </button>
        </div>
      )}
      
      <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-200">
        <Link 
          href="/lender/notifications"
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default ConditionNotifications;
