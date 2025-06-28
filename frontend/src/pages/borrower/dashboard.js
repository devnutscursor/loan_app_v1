import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';
import ActivityManager from '../../components/dashboard/ActivityManager';
import { 
  BarChart3, 
  FileText, 
  ChevronRight, 
  Calendar,
  Clock,
  CheckCircle, 
  AlertTriangle,
  BadgeDollarSign,
  ClipboardList,
  ArrowRightCircle,
  DollarSign,
  FileCheck,
  Wallet,
  Bell,
  Plus,
  LineChart,
  Download,
  ExternalLink,
  XCircle,
  Upload,
  FilePlus,
  FileX,
  FilePen,
  MessageSquare,
  RefreshCw,
  Edit,
  User
} from 'lucide-react';

// Component for stat cards with gradient backgrounds
const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass }) => (
  <div className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${bgClass}`}>
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-white text-opacity-80 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-white">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-xs font-medium ${
                  trendValue >= 0 ? 'text-green-100' : 'text-red-100'
                }`}>
                  {trendValue >= 0 ? (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-green-100" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-red-100" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{Math.abs(trendValue)}%</span>
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// Quick action button component
const QuickActionButton = ({ icon: Icon, label, onClick, bgColor }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${bgColor} hover:shadow-md hover:scale-105`}
  >
    <Icon className="h-7 w-7 text-white mb-2" />
    <span className="text-xs font-medium text-white text-center">{label}</span>
  </button>
);

// Loan card component with modern design
const LoanCard = ({ loan, onView }) => {
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Status styling
  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'application submitted':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
      case 'clear to close':
      case 'conditional approval':
        return "bg-green-100 text-green-800";
      case 'rejected':
      case 'declined':
        return "bg-red-100 text-red-800";
      case 'funded':
      case 'closed':
        return "bg-blue-100 text-blue-800";
      case 'processing':
      case 'underwriting':
        return "bg-purple-100 text-purple-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-medium text-gray-900">Loan# {loan.loanNumber || "Loan"}</h4>
            <p className="text-xs text-gray-500">Applied: {formatDate(loan.createdAt)}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(loan.status)}`}>
            {loan.status?.toLowerCase() === 'conditional approval' ? 'Approved' : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || "Status"}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs mb-4">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(loan.loanDetails?.loanAmount || loan.amount || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Interest Rate</p>
            <p className="font-semibold text-gray-900">{loan.interestRate ? `${loan.interestRate}%` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Term</p>
            <p className="font-semibold text-gray-900">{loan.loanDetails?.loanTerm ? `${loan.loanDetails.loanTerm} years` : loan.loanParameters?.loanTerm ? `${loan.loanParameters.loanTerm} years` : 'N/A'}</p>
          </div>
        </div>
        
        <button
          onClick={() => onView(loan._id)}
          className="w-full mt-2 flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          View Loan Details
          <ChevronRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem = ({ icon: Icon, title, time, status, statusColor, entityId, entityType, loanNumber, description, url }) => {
  const router = useRouter();

  // Use FileText as the default fallback icon
  const IconComponent = typeof Icon === 'function' ? Icon : FileText;

  const handleActivityClick = () => {
    if (url) {
      router.push(url);
    } else if (entityType === 'loan' && entityId) {
      router.push(`/borrower/loans/${entityId}`);
    } else if (entityType === 'document') {
      router.push('/borrower/documents');
    } else if (entityType === 'message') {
      router.push('/borrower/messages');
    } else if (entityType === 'milestone') {
      router.push(`/borrower/loans/${entityId}?tab=milestones`);
    }
  };

  // Determine colors based on notification type
  let iconBgColor = 'bg-blue-100';
  let iconTextColor = 'text-blue-600';

  if (entityType === 'message' || title?.toLowerCase().includes('message')) {
    iconBgColor = 'bg-blue-100';
    iconTextColor = 'text-blue-600';
  } else if (entityType === 'document' || title?.toLowerCase().includes('document')) {
    if (status === 'Approved' || title?.toLowerCase().includes('approved')) {
      iconBgColor = 'bg-green-100';
      iconTextColor = 'text-green-600';
    } else if (status === 'Rejected' || title?.toLowerCase().includes('rejected')) {
      iconBgColor = 'bg-red-100';
      iconTextColor = 'text-red-600';
    } else {
      iconBgColor = 'bg-blue-100'; 
      iconTextColor = 'text-blue-600';
    }
  } else if (entityType === 'milestone' || title?.toLowerCase().includes('milestone')) {
    iconBgColor = 'bg-green-100';
    iconTextColor = 'text-green-600';
  }
  
  return (
    <li className="py-3">
      <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${iconBgColor}`}>
          <IconComponent className={`h-4 w-4 ${iconTextColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500">{time}</p>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        <div>
          <button
            onClick={handleActivityClick}
            className="flex items-center justify-center py-1 px-3 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            disabled={!entityId && !url}
          >
            View
            <ChevronRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </li>
  );
};

// Progress component for payment tracking
const ProgressItem = ({ label, value, maxValue, color }) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-800">{value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Summary card component
const SummaryCard = ({ title, value, subtitle, icon: Icon, iconColor }) => (
  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden p-4 hover:shadow-sm transition-all duration-200">
    <div className="flex items-center mb-2">
      <div className={`h-8 w-8 rounded-full ${iconColor} bg-opacity-20 flex items-center justify-center mr-3`}>
        <Icon className={`h-4 w-4 ${iconColor.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    </div>
    <div className="flex items-end">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="ml-2 text-xs text-gray-500 mb-1">{subtitle}</div>
    </div>
  </div>
);

const BorrowerDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingApplications: 0,
    totalAmount: 0,
    percentChanges: {
      loans: 0,
      applications: 0,
      amount: 0
    }
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    upcomingPayment: 0,
    nextDueDate: null
  });
  
  // Storage key for notifications
  const NOTIFICATIONS_STORAGE_KEY = 'borrower_notifications';
  
  // Generate unique ID for notifications
  const generateNotificationId = (type, data) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${type}-${timestamp}-${random}`;
  };
  
  // Format relative time for notifications
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Unknown time";
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Unknown time";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  // Save notifications to localStorage
  const saveNotifications = (notificationsList) => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsList));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  };
  
  // Load notifications from localStorage
  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
    return [];
  };
  
  // Add a new notification
  const addNotification = (notification) => {
    setActivities(prevActivities => {
      // Check if notification already exists
      const exists = prevActivities.some(activity => 
        activity.id === notification.id ||
        (activity.entityId === notification.entityId && 
         activity.title === notification.title && 
         activity.description === notification.description)
      );
      
      if (exists) return prevActivities;
      
      // Add new notification at the beginning
      const newActivities = [notification, ...prevActivities];
      
      // Limit to 50 notifications
      const limitedActivities = newActivities.slice(0, 50);
      
      // Save to localStorage
      saveNotifications(limitedActivities);
      
      return limitedActivities;
    });
  };
  
  const activitySeenKey = 'borrower_activity_seen';
  const activitiesKey = 'borrower_activities';
  
  // Function to generate a unique ID for activities to prevent duplicates
  const generateActivityId = (activity) => {
    return `${activity.entityType || ''}-${activity.entityId || ''}-${activity.title || ''}-${activity.time || ''}`
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  // Add a unique ID to each activity if it doesn't have one
  const processActivities = (activityList) => {
    return activityList.map(activity => {
      // Make sure icon is a valid function or component
      const iconComponent = typeof activity.icon === 'function' ? activity.icon : FileText;
      
      // Clean up statusColor to be consistent format (remove 'bg-' prefix if present)
      let statusColor = activity.statusColor;
      if (statusColor && statusColor.startsWith('bg-')) {
        statusColor = statusColor.replace('bg-', '');
        if (statusColor.endsWith('-500')) {
          statusColor = statusColor.replace('-500', '');
        }
      }
      
      return {
        ...activity,
        id: activity.id || generateActivityId(activity),
        icon: iconComponent,
        statusColor: statusColor,
        timestamp: activity.timestamp || new Date().toISOString()
      };
    });
  };

  // Function to merge activities without duplicates
  const mergeActivities = (existingActivities, newActivities) => {
    // Create a map of existing activities by their ID
    const activityMap = {};
    const activitySet = new Set(); // Track duplicate activity IDs
    
    // Create a set to track documents by title+loanId to detect duplicates
    const documentSet = new Set();
    // Create a set to track milestones by title+loanId to detect duplicates
    const milestoneSet = new Set();
    
    // Add all existing activities to the map first
    existingActivities.forEach(activity => {
      if (!activity.id) {
        activity.id = generateActivityId(activity);
      }
      
      // Skip if we've already seen this activity
      if (activitySet.has(activity.id)) return;
      activitySet.add(activity.id);
      
      // Track document activities by document name and loan ID
      if (activity.entityType === 'document' && activity.description) {
        const docKey = `${activity.title}-${activity.description}`;
        documentSet.add(docKey);
      }
      
      // Track milestone activities by milestone name and loan ID
      if (activity.entityType === 'milestone' && activity.description) {
        const milestoneKey = `${activity.title}-${activity.description}`;
        milestoneSet.add(milestoneKey);
      }
      
      activityMap[activity.id] = activity;
    });
    
    // Add new activities if they don't exist already
    newActivities.forEach(activity => {
      if (!activity.id) {
        activity.id = generateActivityId(activity);
      }
      
      // Skip if we've already seen this activity ID
      if (activitySet.has(activity.id)) return;
      activitySet.add(activity.id);
      
      // Skip duplicate document activities
      if (activity.entityType === 'document' && activity.description) {
        const docKey = `${activity.title}-${activity.description}`;
        if (documentSet.has(docKey)) return;
        documentSet.add(docKey);
      }
      
      // Skip duplicate milestone activities
      if (activity.entityType === 'milestone' && activity.description) {
        const milestoneKey = `${activity.title}-${activity.description}`;
        if (milestoneSet.has(milestoneKey)) return;
        milestoneSet.add(milestoneKey);
      }
      
      // Add or update activity in the map
      activityMap[activity.id] = {
        ...activity,
        // Ensure we have a proper timestamp for sorting
        timestamp: activity.timestamp || new Date().toISOString()
      };
    });
    
    // Convert map back to array
    const mergedActivities = Object.values(activityMap);
    
    // Sort by timestamp, most recent first
    return mergedActivities.sort((a, b) => {
      // Convert to Date objects for consistent comparison
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      
      // Most recent first (descending order)
      return dateB - dateA;
    });
  };
  
  // Load activities from localStorage when component mounts
  useEffect(() => {
    try {
      // First, set empty array as default
      setActivities([]);
      
      const savedActivities = localStorage.getItem(activitiesKey);
      if (savedActivities) {
        try {
          const parsedActivities = JSON.parse(savedActivities);
          if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
            console.log('Loaded activities from localStorage:', parsedActivities.length);
            
            // Remove any default activities that might be saved
            const filteredActivities = parsedActivities.filter(activity => {
              // Filter out activities that match the pattern of default notifications
              const isDefaultNotification = 
                (!activity.loanNumber && !activity.entityId) || 
                (activity.title && activity.title.includes('Document') && 
                 !activity.loanNumber && !activity.entityId);
              
              return !isDefaultNotification;
            });
            
            // Apply any required transformations and set activities
            const processedActivities = processActivities(filteredActivities);
            setActivities(processedActivities);
          }
        } catch (parseError) {
          console.error('Failed to parse activities from localStorage:', parseError);
          // Clear invalid data
          localStorage.removeItem(activitiesKey);
        }
      }
    } catch (error) {
      console.error('Failed to load activities from localStorage:', error);
    }
    
    // Initial check to clear localStorage if user has no loans
    // This will be run before fetchDashboardData completes
    const checkForNoLoans = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Quick check just for loan count
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // If there are no loans, clear notifications
        if (response.data?.data?.totalLoans === 0) {
          console.log("Quick check found no loans. Clearing notifications.");
          setActivities([]);
          localStorage.removeItem(activitiesKey);
        }
      } catch (error) {
        console.error("Error in quick loan check:", error);
      }
    };
    
    checkForNoLoans();
  }, []);
  
  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      try {
        // Don't store more than 50 activities to avoid localStorage limits
        const limitedActivities = activities.slice(0, 50);
        localStorage.setItem(activitiesKey, JSON.stringify(limitedActivities));
        console.log('Saved activities to localStorage:', limitedActivities.length);
      } catch (error) {
        console.error('Failed to save activities to localStorage:', error);
      }
    }
  }, [activities]);
  
  // Handle socket events for real-time notifications
  const handleSocketEvent = (data) => {
    console.log('Socket event received:', data);
    
    // Ensure data has the required fields
    if (!data) return;
    
    const timestamp = new Date().toISOString();
    let notification = null;
    
    // 1. Handle message notifications
    if (data.type === 'message' || data.eventType === 'message' || data.eventType === 'new_lender_message') {
      const senderName = data.senderName || data.sender || 'Lender';
      const messagePreview = data.content?.substring(0, 30) || 'You have a new message';
      
      notification = {
        id: generateNotificationId('message', data),
        icon: MessageSquare,
        title: `New message from ${senderName}`,
        description: messagePreview,
        status: 'New',
        statusColor: 'blue',
        entityType: 'message',
        url: '/borrower/messages',
        timestamp: timestamp
      };
      
      // Show toast notification
      toast(`New Message from ${senderName}: ${messagePreview}`, {
        duration: 5000
      });
    }
    
    // 2. Handle milestone notifications
    else if (data.type === 'milestone' || data.eventType === 'milestone-completed' || data.eventType === 'milestone_updated') {
      const milestoneName = data.title || data.milestoneName || 'Loan milestone';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      notification = {
        id: generateNotificationId('milestone', data),
        icon: CheckCircle,
        title: `Milestone completed`,
        description: `${milestoneName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        status: 'Completed',
        statusColor: 'green',
        entityId: loanId,
        entityType: 'milestone',
        loanNumber: loanNumber,
        url: loanId ? `/borrower/loans/${loanId}?tab=milestones` : '/borrower/loans',
        timestamp: timestamp
      };
      
      // Show toast notification
      toast(`Milestone Completed: ${milestoneName}${loanNumber ? ` for loan ${loanNumber}` : ''}`, {
        duration: 5000
      });
    }
    
    // 3. Handle document request notifications
    else if (data.type === 'document-request' || data.eventType === 'document-request' || data.eventType === 'document_requested') {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      notification = {
        id: generateNotificationId('document-request', data),
        icon: FilePlus,
        title: `Document requested`,
        description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        status: 'Pending',
        statusColor: 'blue',
        entityId: loanId,
        entityType: 'document',
        loanNumber: loanNumber,
        url: '/borrower/documents',
        timestamp: timestamp
      };
      
      // Show toast notification - using standard toast instead of toast.info
      toast(`Document Requested: ${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`, {
        duration: 5000
      });
    }
    
    // 4. Handle document status notifications (approved/rejected)
    else if (data.type === 'document-status' || data.eventType === 'document-status' || data.eventType === 'document_status_changed') {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      // Extract status from various possible properties
      const statusFromData = data.status || data.newStatus || (data.metadata ? data.metadata.status : null) || 'Updated';
      
      // Process status
      let status = statusFromData;
      let statusColor = 'blue';
      let icon = FileText;
      
      if (status && typeof status === 'string') {
        status = status.toLowerCase();
        
        if (status.includes('approved') || status === 'approve') {
          status = 'Approved';
          statusColor = 'green';
          icon = FileCheck;
          
          toast(`Document Approved: ${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`, {
            duration: 5000
          });
        } 
        else if (status.includes('rejected') || status.includes('denied') || status === 'reject' || status === 'decline') {
          status = 'Rejected';
          statusColor = 'red';
          icon = FileX;
          
          toast(`Document Rejected: ${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`, {
            duration: 5000
          });
        }
        else if (status.includes('correction') || status.includes('needs correction')) {
          status = 'Needs Correction';
          statusColor = 'yellow';
          icon = FilePen;
          
          toast(`Document Needs Correction: ${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`, {
            duration: 5000
          });
        }
      }
      
      notification = {
        id: generateNotificationId('document-status', data),
        icon: icon,
        title: `Document ${status}`,
        description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        status: status,
        statusColor: statusColor,
        entityId: loanId,
        entityType: 'document',
        loanNumber: loanNumber,
        url: '/borrower/documents',
        timestamp: timestamp
      };
    }
    
    // Add notification if created
    if (notification) {
      // Check if this notification is related to a real loan (if we have loan data)
      if (recentLoans && recentLoans.length > 0 && notification.loanNumber) {
        const loanExists = recentLoans.some(loan => {
          const loanNumberMatch = loan.loanNumber && notification.loanNumber.includes(loan.loanNumber);
          const loanIdMatch = loan._id && notification.entityId === loan._id;
          return loanNumberMatch || loanIdMatch;
        });
        
        // Skip notification if it doesn't match any loan
        if (!loanExists) {
          console.log(`Skipping notification - no matching loan found`);
          return;
        }
      }
      
      addNotification(notification);
    }
  };
  
  // Socket connection for real-time notifications
  useEffect(() => {
    // Try to establish socket connection
    try {
      // Use the backend API URL without the path for socket connection
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const socketUrl = apiUrl ? apiUrl.replace('/api/v1', '') : null;
      
      if (!socketUrl) {
        console.log('Socket URL not configured. Skipping socket connection.');
        return;
      }
      
      console.log('Connecting to socket at:', socketUrl);
      
      const socket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token')
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });
      
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
        
        // Join room based on user ID
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            if (decoded.id) {
              socket.emit('join', decoded.id);
              console.log('Joined socket room:', decoded.id);
              
              // Also join a borrower-specific room if we have the borrower ID
              if (decoded.role === 'borrower') {
                socket.emit('join', `borrower-${decoded.id}`);
                console.log('Joined borrower-specific room:', `borrower-${decoded.id}`);
              }
            }
          } catch (error) {
            console.error('Failed to decode token for socket room:', error);
          }
        }
      });
      
      socket.on('connect_error', (error) => {
        console.log('Socket connection error:', error.message);
      });
      
      // Register all notification event types
      const eventTypes = [
        'notification', 
        'message', 
        'receive_message',
        'new_lender_message',
        'document-request', 
        'document_requested',
        'milestone-completed', 
        'milestone_updated',
        'document-status', 
        'document_status_changed',
        'loan-status',
        'loan_status_changed'
      ];
      
      // Register handler for all event types
      eventTypes.forEach(eventType => {
        socket.on(eventType, data => {
          console.log(`Socket event received (${eventType}):`, data);
          handleSocketEvent(data);
        });
      });
      
      return () => {
        console.log('Cleaning up socket connection');
        eventTypes.forEach(eventType => {
          socket.off(eventType);
        });
        socket.disconnect();
      };
    } catch (error) {
      console.error('Socket connection failed:', error);
    }
  }, [recentLoans]);
  
  // Forcefully clear default notifications on component mount
  useEffect(() => {
    // Clear any default notifications that might be showing
    const clearDefaultNotifications = () => {
      // Clear all notifications from localStorage
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      localStorage.removeItem(activitiesKey);
      
      // Reset activities state
      setActivities([]);
      
      console.log("Forcefully cleared all notifications on component mount");
    };
    
    // Run the cleanup
    clearDefaultNotifications();
    
    // Then fetch fresh data
    fetchDashboardData();
    
  }, []);
  
  // Fetch dashboard data and activities
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Extract user ID from token
      if (token) {
        const payload = token.split('.')[1];
        try {
          const decoded = JSON.parse(atob(payload));
          if (decoded.id) {
            setUserId(decoded.id);
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
        }
      }
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch recent activities
      const activitiesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/activities?limit=20&_=${Date.now()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );
      
      // Process the stats data
      const statsData = statsResponse.data.data || {};
      
      setStats({
        totalLoans: statsData.totalLoans || 0,
        activeLoans: statsData.activeLoans || 0,
        pendingApplications: statsData.pendingApplications || 0,
        totalAmount: statsData.totalAmount || 0,
        percentChanges: statsData.percentChanges || {
          loans: 0,
          applications: 0, 
          amount: 0
        }
      });
      
      // Process recent loans
      const enrichedLoans = statsData.recentLoans || [];
      setRecentLoans(enrichedLoans);
      
      // Process activities from API
      if (activitiesResponse.data && activitiesResponse.data.status === 'success') {
        const apiActivities = activitiesResponse.data.data.activities || [];
        
        // Skip processing if no activities
        if (apiActivities.length === 0) {
          console.log('No activities received from API');
          return;
        }
        
        // Map backend icons to Lucide React components
        const iconMap = {
          'FileText': FileText,
          'CheckCircle': CheckCircle, 
          'Clock': Clock,
          'AlertTriangle': AlertTriangle,
          'XCircle': XCircle,
          'Upload': Upload,
          'RefreshCw': RefreshCw,
          'Edit': Edit,
          'FileCheck': FileCheck,
          'FilePlus': FilePlus,
          'FileX': FileX,
          'FilePen': FilePen,
          'MessageSquare': MessageSquare,
          'ArrowRightCircle': ArrowRightCircle,
          'BadgeDollarSign': BadgeDollarSign,
          'Calendar': Calendar,
          'ClipboardList': ClipboardList,
          'BarChart3': BarChart3,
          'Bell': Bell,
          'Wallet': Wallet,
          'User': User
        };
        
        // Filter activities to only those related to existing loans
        const loanIds = enrichedLoans.map(loan => loan._id);
        const loanNumbers = enrichedLoans.map(loan => loan.loanNumber).filter(Boolean);
        
        let filteredActivities = apiActivities;
        
        if (enrichedLoans.length > 0) {
          filteredActivities = apiActivities.filter(activity => {
            // Keep activities without loan association
            if (!activity.entityId && !activity.loanNumber) return true;
            
            // Keep activities related to our loans
            const hasMatchingLoanId = activity.entityId && loanIds.some(id => id === activity.entityId);
            const hasMatchingLoanNumber = activity.loanNumber && loanNumbers.some(number => 
              activity.loanNumber.includes(number)
            );
            
            return hasMatchingLoanId || hasMatchingLoanNumber;
          });
        } else {
          // If there are no loans, don't show any document or loan-related notifications
          filteredActivities = apiActivities.filter(activity => {
            return activity.entityType !== 'document' && 
                   activity.entityType !== 'loan' && 
                   activity.entityType !== 'milestone';
          });
        }
        
        // Process each activity
        const processedActivities = filteredActivities.map(activity => {
          // Get icon
          const iconName = activity.icon || 'FileText';
          const icon = iconMap[iconName] || FileText;
          
          // Format status color
          let statusColor = activity.statusColor || 'blue';
          
          // Create notification object
          return {
            id: activity.id || generateNotificationId(activity.entityType || 'notification', activity),
            icon: icon,
            title: activity.title || 'Activity update',
            time: formatRelativeTime(activity.timestamp || activity.date),
            status: activity.status || 'Info',
            statusColor: statusColor,
            entityId: activity.entityId,
            entityType: activity.entityType || 'notification',
            description: activity.description,
            url: activity.url,
            loanNumber: activity.loanNumber,
            timestamp: activity.timestamp || new Date().toISOString()
          };
        });
        
        // Merge with existing activities
        setActivities(prevActivities => {
          // Create a map of existing activities by ID
          const existingMap = {};
          prevActivities.forEach(activity => {
            if (activity.id) {
              existingMap[activity.id] = true;
            }
          });
          
          // Filter out duplicates
          const newActivities = processedActivities.filter(activity => !existingMap[activity.id]);
          
          // Combine and sort by timestamp
          const combined = [...prevActivities, ...newActivities].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB - dateA; // Most recent first
          });
          
          // Save to localStorage
          saveNotifications(combined);
          
          return combined;
        });
      }
      
      // Process payment summary
      const paymentSummary = {
        totalPaid: statsData.paymentSummary?.totalPaid || 0,
        upcomingPayment: statsData.paymentSummary?.upcomingPayment || 0,
        nextDueDate: statsData.paymentSummary?.nextDueDate || null
      };
      
      setPaymentSummary(paymentSummary);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewLoan = (loanId) => {
    router.push(`/borrower/loans/${loanId}`);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Render notifications section
  const renderActivities = () => {
    // If no activities, show empty state
    if (!activities || activities.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      );
    }
    
    // First, ensure all activities have proper formatting and sort by timestamp (newest first)
    const formattedActivities = activities.map(activity => {
      // Ensure icon is a valid component
      const icon = typeof activity.icon === 'function' ? activity.icon : FileText;
      
      // Normalize statusColor (remove bg- prefix if present)
      let statusColor = activity.statusColor;
      if (statusColor && statusColor.startsWith('bg-')) {
        statusColor = statusColor.replace('bg-', '');
        if (statusColor.endsWith('-500')) {
          statusColor = statusColor.replace('-500', '');
        }
      }
      
      return {
        ...activity,
        icon,
        statusColor,
        time: formatRelativeTime(activity.timestamp || activity.date)
      };
    }).sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA; // Most recent first
    });
    
    // Limit to 10 notifications to avoid overwhelming the UI
    const displayActivities = formattedActivities.slice(0, 10);
    
    return (
      <ul className="divide-y divide-gray-100">
        {displayActivities.map((activity) => (
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
            url={activity.url}
          />
        ))}
      </ul>
    );
  };
  
  // Function for the refresh button to directly fetch new activities
  const handleRefreshActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      toast.loading('Refreshing notifications...');
      
      console.log('Manually refreshing activities...');
      
      // Make a direct API call to get the latest activities
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/activities?limit=20&_=${Date.now()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000 // 15 second timeout
        }
      );
      
      if (response.data && response.data.status === 'success') {
        console.log('Refresh successful - activities received:', response.data.data.activities.length);
        
        // Map backend icons to Lucide React components
        const iconMap = {
          'FileText': FileText,
          'CheckCircle': CheckCircle, 
          'Clock': Clock,
          'AlertTriangle': AlertTriangle,
          'XCircle': XCircle,
          'Upload': Upload,
          'RefreshCw': RefreshCw,
          'Edit': Edit,
          'FileCheck': FileCheck,
          'FilePlus': FilePlus,
          'FileX': FileX,
          'FilePen': FilePen,
          'MessageSquare': MessageSquare,
          'ArrowRightCircle': ArrowRightCircle,
          'BadgeDollarSign': BadgeDollarSign,
          'Calendar': Calendar,
          'ClipboardList': ClipboardList,
          'BarChart3': BarChart3,
          'Bell': Bell,
          'Wallet': Wallet
        };
        
        // Process the activities
        const receivedActivities = response.data.data.activities || [];
        
        if (receivedActivities.length === 0) {
          console.log('No activities received from refresh');
          toast.dismiss();
          toast.success('No new notifications');
          return;
        }
        
        const processedActivities = receivedActivities.map(activity => {
          // Determine icon
          const iconName = activity.icon || 'FileText';
          const icon = iconMap[iconName] || FileText;
          
          // Format time
          const formattedTime = activity.time || 
            (activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recently');
          
          // Normalize statusColor
          let statusColor = activity.statusColor || 'blue';
          if (statusColor && statusColor.startsWith('bg-')) {
            statusColor = statusColor.replace('bg-', '');
            if (statusColor.endsWith('-500')) {
              statusColor = statusColor.replace('-500', '');
            }
          }
          
          // Fix sender name for messages to prevent "Object" display
          let title = activity.title || 'Activity update';
          if (activity.entityType === 'message' && title.includes('from')) {
            // Extract sender info if it's an object
            if (activity.sender && typeof activity.sender === 'object') {
              const senderName = activity.sender.firstName || 
                                activity.sender.name || 
                                activity.sender.companyName || 
                                'Lender';
              title = `New message from ${senderName}`;
            } else if (title.includes('from [object Object]')) {
              title = title.replace('[object Object]', 'Lender');
            }
          }
          
          console.log(`Processing activity: ${title} (${activity.entityType})`);
          
          return {
            icon,
            title,
            time: formattedTime,
            status: activity.status || 'Info',
            statusColor,
            id: activity.id || generateActivityId(activity),
            entityId: activity.entityId,
            entityType: activity.entityType || 'notification',
            description: activity.description,
            url: activity.url,
            loanNumber: activity.loanNumber,
            timestamp: activity.timestamp || new Date().toISOString(),
            persistent: activity.persistent || 
                      activity.entityType === 'milestone' || 
                      activity.entityType === 'document' ||
                      (activity.title && (
                        activity.title.toLowerCase().includes('document') || 
                        activity.title.toLowerCase().includes('milestone')
                      ))
          };
        });
        
        // Merge with existing activities
        setActivities(prevActivities => {
          console.log(`Merging ${processedActivities.length} new activities with ${prevActivities.length} existing activities`);
          
          // Check if we have milestone or document activities (which are higher priority)
          const hasMilestones = processedActivities.some(a => 
            a.entityType === 'milestone' || (a.title && a.title.toLowerCase().includes('milestone'))
          );
          
          const hasDocuments = processedActivities.some(a => 
            a.entityType === 'document' || (a.title && a.title.toLowerCase().includes('document'))
          );
          
          if (hasMilestones) {
            console.log('Found milestone notifications in refresh data');
          }
          
          if (hasDocuments) {
            console.log('Found document notifications in refresh data');
          }
          
          const mergedActivities = mergeActivities(prevActivities, processedActivities);
          
          // Save to localStorage
          try {
            localStorage.setItem(activitiesKey, JSON.stringify(mergedActivities.slice(0, 50)));
          } catch (error) {
            console.error('Failed to save activities to localStorage:', error);
          }
          
          return mergedActivities;
        });
        
        toast.dismiss();
        toast.success('Notifications refreshed');
      } else {
        console.error('Error refreshing activities - invalid response:', response.data);
        toast.dismiss();
        toast.error('Failed to refresh notifications');
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
      toast.dismiss();
      toast.error('Could not refresh notifications');
    }
  };
  
  return (
    <MainLayout title="Borrower Dashboard">
      {/* Activity Manager for real-time updates */}
      {userId && <ActivityManager userId={userId} updateActivities={setActivities} />}
      
      <div className="py-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your loans and applications
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/borrower/apply"
              className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              Apply for a Loan
            </Link>
            <Link href="/borrower/documents" 
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              My Documents
            </Link>
          </div>
        </div>
        
        {loading ? (
          <>
    {/* Stats Grid Loading Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
      ))}
    </div>

    {/* Main Content Layout Loading Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Loans Section Loading Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg border border-gray-50 p-4 animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j}>
                    <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 w-1/3 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-1">
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Activity Feed Loading Skeleton */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map(i => (
              <li key={i} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Resources Card - keeping this commented as requested */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Resources</h2>
          </div>
          
          <div className="space-y-3">
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Loan Requirements</p>
                <p className="text-xs text-gray-500">Learn about eligibility criteria</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
            
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <LineChart className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Financial Education</p>
                <p className="text-xs text-gray-500">Tips for managing your finances</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
            
            <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Reminders</p>
                <p className="text-xs text-gray-500">Set up alerts for upcoming payments</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard 
                title="Total Loans" 
                value={stats?.totalLoans || 0} 
                icon={FileText} 
                trend={true}
                trendValue={stats?.percentChanges?.loans || 0}
                bgClass="bg-gradient-to-br from-blue-600 to-blue-800"
              />
              <StatCard 
                title="Approved Loans" 
                value={stats?.activeLoans || 0} 
                icon={CheckCircle}
                trend={false}
                bgClass="bg-gradient-to-br from-green-600 to-green-800"
              />
              <StatCard 
                title="Pending Applications" 
                value={stats?.pendingApplications || 0} 
                icon={Clock}
                trend={true}
                trendValue={stats?.percentChanges?.applications || 0} 
                bgClass="bg-gradient-to-br from-yellow-500 to-yellow-700"
              />
              <StatCard 
                title="Total Borrowed" 
                value={formatCurrency(stats?.totalAmount)} 
                icon={BadgeDollarSign}
                trend={true}
                trendValue={stats?.percentChanges?.amount || 0}
                bgClass="bg-gradient-to-br from-indigo-600 to-indigo-800"
              />
            </div>

            {/* Quick Actions Row */}
            {/* <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <QuickActionButton 
                  icon={Plus} 
                  label="New Loan Application" 
                  onClick={() => router.push('/borrower/apply')}
                  bgColor="bg-gradient-to-r from-blue-600 to-blue-800" 
                />
                <QuickActionButton 
                  icon={Wallet} 
                  label="Make a Payment" 
                  onClick={() => router.push('/borrower/payments')}
                  bgColor="bg-gradient-to-r from-green-600 to-green-800" 
                />
                <QuickActionButton 
                  icon={FileCheck} 
                  label="Upload Documents" 
                  onClick={() => router.push('/borrower/documents')}
                  bgColor="bg-gradient-to-r from-purple-600 to-purple-800" 
                />
                <QuickActionButton 
                  icon={Download} 
                  label="Download Statements" 
                  onClick={() => toast('Statement download coming soon!')}
                  bgColor="bg-gradient-to-r from-indigo-600 to-indigo-800" 
                />
              </div>
            </div> */}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Loans Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900">My Loans</h2>
                  <Link href="/borrower/loans" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                {recentLoans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentLoans.map((loan) => (
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No loans yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by applying for your first loan</p>
                    <Link href="/borrower/apply" className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      Apply Now
                    </Link>
                  </div>
                )}

                {/* Payment Summary */}
                {/* {recentLoans.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Payment Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SummaryCard
                        title="Total Paid"
                        value={formatCurrency(paymentSummary.totalPaid)}
                        subtitle="to date"
                        icon={BadgeDollarSign}
                        iconColor="bg-green-500"
                      />
                      <SummaryCard
                        title="Next Payment"
                        value={formatCurrency(paymentSummary.upcomingPayment)}
                        subtitle="due"
                        icon={Calendar}
                        iconColor="bg-blue-500"
                      />
                      <SummaryCard
                        title="Due Date"
                        value={formatDate(paymentSummary.nextDueDate)}
                        subtitle=""
                        icon={Clock}
                        iconColor="bg-yellow-500"
                      />
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      <Link href="/borrower/payments" className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center">
                        View Payment History <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Right Column: Activity and Resources */}
              <div className="space-y-6">
                {/* Activity Feed */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRefreshActivities}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {renderActivities()}
                </div>

                {/* Resources Card */}
                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Resources</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Loan Requirements</p>
                        <p className="text-xs text-gray-500">Learn about eligibility criteria</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                    
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <LineChart className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Financial Education</p>
                        <p className="text-xs text-gray-500">Tips for managing your finances</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                    
                    <Link href="#" className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Bell className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment Reminders</p>
                        <p className="text-xs text-gray-500">Set up alerts for upcoming payments</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                    </Link>
                  </div>
                </div> */}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default BorrowerDashboard;