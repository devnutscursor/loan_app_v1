import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import { useRouter } from 'next/router';
import { LoanRateService, LoanProgramService } from '../../services';
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
  FileEdit,
  MessageSquare,
  RefreshCw,
  Edit,
  User
} from 'lucide-react';

// Component for stat cards with gradient backgrounds
const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgClass }) => (
  <div className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${bgClass}`}>
    <div className="px-2 py-3 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
          <Icon className="sm:h-6 sm:w-6 h-3 w-3 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl className='sm:text-end text-center'>
            <dt className="sm:text-sm text-[9px] font-medium text-white text-opacity-80 truncate text-center sm:text-end  xl:text-start">{title}</dt>
            <dd className="flex items-baseline xl:justify-start sm:justify-end justify-center min-w-24 xl:min-w-0">
              <div className="sm:text-2xl text-lg font-semibold text-white">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline sm:text-xs text-xs font-medium ${
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
  // State for interest rate and loan term
  const [interestRate, setInterestRate] = useState(null);
  const [loanTerm, setLoanTerm] = useState(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  
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
  
  // Function to fetch interest rate and loan term
  useEffect(() => {
    const fetchLoanData = async () => {
      // Always attempt to fetch, even if loan type isn't explicitly available
      // This ensures we try to get data in all cases
      try {
        // Extract lender ID from loan object if available
        let lenderId = null;
        
        if (loan?.lender && typeof loan.lender === 'string') {
          lenderId = loan.lender;
        } else if (loan?.lender?._id) {
          lenderId = loan.lender._id;
        } else if (loan?.lenderDetails?.id) {
          lenderId = loan.lenderDetails.id;
        }
        
        // Get the loan type from wherever it might be, with more fallbacks
        const loanType = loan.loanDetails?.loanType || 
                        loan.loanType || 
                        loan.type || 
                        loan.summary?.loanType || 
                        'Purchase';
        console.log('Using loan type for rate/term lookup:', loanType);
        
        // Get interest rate from loanRates collection with lender ID
        try {
          // First check if we already have an interest rate in the loan object with expanded search
          const existingRate = loan.interestRate || 
                      loan.loanParameters?.interestRate || 
                      loan.loanDetails?.interestRate ||
                      (loan.loanParameters?.rate ? loan.loanParameters.rate : null) ||
                      loan.terms?.interestRate ||
                      loan.interest ||
                      loan.summary?.interestRate ||
                      loan.rate ||
                      loan.interest_rate || // Check additional possible field names
                      loan.interest_Rate || 
                      loan.interestrate || 
                      loan.data?.interestRate || 
                      loan.loanInfo?.interestRate;
          
          if (existingRate || existingRate === 0) {
            setInterestRate(existingRate);
          } else if (lenderId) {
            // If no existing rate but we have a lender ID, fetch from API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan-rates/${loanType}?lender=${lenderId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data && typeof data.rate === 'number') {
                setInterestRate(data.rate);
              } else {
                // Fallback to default
                setInterestRate(6.5);
              }
            } else {
              // API call failed, use default
              setInterestRate(6.5);
            }
          } else {
            // No lender ID, use default
            setInterestRate(6.5);
          }
        } catch (rateError) {
          console.error('Rate fetch failed', rateError);
          // Set a reasonable default rate
          setInterestRate(7.0);
        }
        
        // Check if we already have a loan term in the loan object with expanded search
        const existingTerm = loan.loanDetails?.loanTerm || 
                   loan.loanParameters?.loanTerm ||
                   loan.terms?.loanTerm ||
                   loan.term ||
                   loan.summary?.term ||
                   loan.summary?.loanTerm ||
                   loan.loanTerm ||
                   loan.loan_term || // Check additional possible field names
                   loan.loanterm || 
                   loan.data?.loanTerm ||
                   loan.loanInfo?.loanTerm;
        
        if (existingTerm || existingTerm === 0) {
          setLoanTerm(existingTerm);
        } else if (lenderId) {
          // If no existing term but we have a lender ID and loan type, fetch from API
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan-programs?loanType=${loanType}&lender=${lenderId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data && data[0] && typeof data[0].term === 'number') {
                setLoanTerm(data[0].term);
              } else {
                // Fallback to default term
                setLoanTerm(30);
              }
            } else {
              // API call failed, use default
              setLoanTerm(30);
            }
          } catch (programError) {
            console.error('Program fetch failed', programError);
            // Set a reasonable default term
            setLoanTerm(30);
          }
        } else {
          // No lender ID or loan type, use default
          setLoanTerm(30);
        }
      } catch (error) {
        console.error('Error fetching loan data:', error);
      }
    };
    
    // Only fetch if data hasn't been fetched yet or if the loan changes
    if (!isDataFetched || loan) {
      console.log('Fetching loan data for interest/term for loan ID:', loan?._id);
      fetchLoanData()
        .then(() => setIsDataFetched(true))
        .catch(err => {
          console.error('Error in fetchLoanData:', err);
          setIsDataFetched(true); // Mark as fetched even on error to prevent infinite retries
        });
    }
  }, [loan, isDataFetched]);
  
  // Format interest rate for display
  const getInterestRate = () => {
    // Add debug logging to see the value
    console.log(`LoanCard (${loan._id}) interestRate value:`, interestRate);
    
    if (interestRate || interestRate === 0) {
      return `${interestRate}%`;
    }
    return 'N/A';
  };

  // Format loan term for display
  const getLoanTerm = () => {
    // Add debug logging to see the value
    console.log(`LoanCard (${loan._id}) loanTerm value:`, loanTerm);
    
    if (loanTerm || loanTerm === 0) {
      return `${loanTerm} years`;
    }
    return 'N/A';
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
            {loan.status?.toLowerCase() === 'conditional approval'
              ? 'Approved'
              : loan.status?.toLowerCase() === 'declined'
                ? 'Denied'
                : loan.status?.toLowerCase() === 'underwriting'
                  ? 'Processing'
                  : loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1) || "Status"}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs mb-4">
          <div>
            <p className="text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(loan.loanDetails?.loanAmount || loan.amount || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Interest Rate</p>
            <p className="font-semibold text-gray-900">{getInterestRate()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Term</p>
            <p className="font-semibold text-gray-900">{getLoanTerm()}</p>
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
    // Normalize status for comparison
    const normalizedStatus = status?.toLowerCase() || '';
    const normalizedTitle = title?.toLowerCase() || '';
    
    if (normalizedStatus === 'approved' || normalizedStatus === 'conditional approval' || 
        normalizedTitle.includes('approved') || normalizedTitle.includes('conditional approval')) {
      iconBgColor = 'bg-green-100';
      iconTextColor = 'text-green-600';
    } else if (normalizedStatus === 'rejected' || normalizedStatus === 'declined' || 
              normalizedTitle.includes('rejected') || normalizedTitle.includes('declined')) {
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
    completedLoans: 0,
    totalAmount: 0
  });
  const [loans, setLoans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Storage key for notifications
  const NOTIFICATIONS_STORAGE_KEY = 'borrower_notifications';
  
  // Generate unique ID for notifications
  const generateNotificationId = (type, data) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${type}-${timestamp}-${random}`;
  };
  
  // Add a dedicated function to strip all formatting from document descriptions for comparison
  const normalizeDocumentDescription = (description) => {
    if (!description) return '';
    
    // Remove all "#" symbols
    let normalized = description.replace(/#/g, '');
    
    // Remove all spaces
    normalized = normalized.replace(/\s+/g, '');
    
    // Extract just the loan number and document type for comparison
    // Look for patterns like "X for loan 123456"
    const match = normalized.match(/(.+)forloan(\d+)/i);
    if (match) {
      const docType = match[1];
      const loanNum = match[2];
      return `${docType}-${loanNum}`;
    }
    
    return normalized.toLowerCase();
  };
  
  // Add this improved deduplication function after the generateActivityId function
  
  // Function for robust deduplication of activities
  const isDuplicateNotification = (activity, existingActivities) => {
    if (!activity) return false;
    
    // Simple ID-based check
    if (activity.id && existingActivities.some(a => a.id === activity.id)) {
      return true;
    }
    
    // For message notifications - check by content and sender
    if (activity.entityType === 'message' || activity.title?.toLowerCase().includes('message')) {
      // Create a content signature for comparison
      const messageSignature = `${activity.title || ''}-${activity.description || ''}`.toLowerCase().trim();
      
      // Skip empty signatures
      if (messageSignature.length < 5) return false;
      
      return existingActivities.some(existing => {
        // Check if it's a message notification
        if (existing.entityType === 'message' || existing.title?.toLowerCase().includes('message')) {
          // Create signature for existing message
          const existingSignature = `${existing.title || ''}-${existing.description || ''}`.toLowerCase().trim();
          
          // Compare signatures
          return messageSignature === existingSignature;
        }
        return false;
      });
    }
    
    // For document notifications
    if (activity.entityType === 'document' && activity.title?.toLowerCase().includes('document') && activity.description) {
      const normalizedNew = normalizeDocumentDescription(activity.description);
      
      // If this is very short or couldn't be parsed properly, skip the check
      if (normalizedNew.length < 5) return false;
      
      return existingActivities.some(existing => {
        if (existing.entityType === 'document' && existing.description) {
          const normalizedExisting = normalizeDocumentDescription(existing.description);
          return normalizedNew === normalizedExisting;
        }
        return false;
      });
    }
    
    return false;
  };
  
  // Clean up invalid notifications that don't belong to this user's loans
  const cleanupInvalidNotifications = () => {
    // First restore any saved messages from localStorage
    let storedMessages = [];
    try {
      storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
      if (storedMessages.length > 0) {
        console.log('Restoring stored messages:', storedMessages.length);
      }
    } catch (e) {
      console.error('Failed to restore messages from localStorage', e);
    }
    
    if (!loans || loans.length === 0) {
      // If user has no loans, clear all notifications except messages
      setActivities(prevActivities => {
        // Combine existing message notifications with stored ones
        const existingMessages = prevActivities.filter(activity => 
          activity.entityType === 'message' || 
          activity.title?.toLowerCase().includes('message') || 
          activity.persistent === true
        );
        
        // Merge existing messages with stored ones
        const allMessages = [...existingMessages];
        
        // Add stored messages that aren't already in the list
        storedMessages.forEach(message => {
          if (!allMessages.some(m => m.id === message.id)) {
            allMessages.push(message);
          }
        });
        
        if (allMessages.length > 0) {
          localStorage.setItem(activitiesKey, JSON.stringify(allMessages));
          localStorage.setItem('borrower_messages', JSON.stringify(allMessages));
          return allMessages;
        } else {
          localStorage.removeItem(activitiesKey);
          return [];
        }
      });
      return;
    }

    // Extract loan IDs and numbers for validation
    const loanIds = loans.map(loan => loan._id);
    const loanNumbers = loans.map(loan => loan.loanNumber).filter(Boolean);
    
    console.log(`Cleaning up notifications based on ${loanIds.length} loans with numbers:`, loanNumbers);
    
    // Filter out notifications that don't match the user's loans, but keep all messages
    setActivities(prevActivities => {
      // Always keep all message notifications
      const existingMessages = prevActivities.filter(activity => 
        activity.entityType === 'message' || 
        activity.title?.toLowerCase().includes('message') || 
        activity.persistent === true
      );
      
      // Combine with stored messages
      const allMessages = [...existingMessages];
      storedMessages.forEach(message => {
        if (!allMessages.some(m => m.id === message.id)) {
          allMessages.push(message);
        }
      });
      
      // For non-messages, validate against borrower loans
      const nonMessages = prevActivities.filter(activity => 
        activity.entityType !== 'message' && 
        !activity.title?.toLowerCase().includes('message') && 
        activity.persistent !== true
      );
      
      const validNonMessages = nonMessages.filter(activity => {
        // Validate by entityId (loan ID)
        if (activity.entityId && loanIds.some(id => id === activity.entityId)) return true;
        
        // Validate by loanNumber
        if (activity.loanNumber) {
          const cleanNumber = activity.loanNumber.replace(/[#\s]/g, '');
          if (loanNumbers.some(num => {
            const cleanBorrowerNum = num.replace(/[#\s]/g, '');
            return cleanNumber === cleanBorrowerNum;
          })) return true;
        }
        
        // Validate by description
        if (activity.description) {
          if (loanNumbers.some(num => {
            const cleanBorrowerNum = num.replace(/[#\s]/g, '');
            const cleanDesc = activity.description.replace(/[#\s]/g, '');
            return cleanDesc.includes(cleanBorrowerNum);
          })) return true;
        }
        
        return false;
      });
      
      // Combine and deduplicate
      let combined = [...allMessages, ...validNonMessages];
      
      // Deduplicate document notifications using our normalizer
      const uniqueDocuments = {};
      combined = combined.filter(activity => {
        if (activity.entityType === 'document' && activity.description) {
          const key = normalizeDocumentDescription(activity.description);
          if (uniqueDocuments[key]) return false;
          uniqueDocuments[key] = true;
        }
        return true;
      });
      
      console.log(`Filtered notifications: ${allMessages.length} messages, ${validNonMessages.length} valid activities, ${combined.length} total after deduplication`);
      
      // Save the valid activities to localStorage
      try {
        if (combined.length > 0) {
          localStorage.setItem(activitiesKey, JSON.stringify(combined.slice(0, 50)));
          
          // Also update the messages storage
          const updatedMessages = combined.filter(activity => 
            activity.entityType === 'message' || 
            activity.title?.toLowerCase().includes('message')
          );
          if (updatedMessages.length > 0) {
            localStorage.setItem('borrower_messages', JSON.stringify(updatedMessages));
          }
        } else {
          localStorage.removeItem(activitiesKey);
        }
      } catch (error) {
        console.error('Failed to save cleaned activities to localStorage:', error);
      }
      
      return combined;
    });
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
      // Ensure notification has an ID
      if (!notification.id) {
        notification.id = generateNotificationId(notification.entityType || 'notification', notification);
      }
      
      // Mark document and message notifications as persistent
      if (notification.entityType === 'message' || 
          notification.title?.toLowerCase().includes('message') ||
          notification.description?.toLowerCase().includes('message')) {
        notification.persistent = true;
        
        // Ensure it has the message entityType for consistent filtering
        if (!notification.entityType) {
          notification.entityType = 'message';
        }
        
        // Save to message-specific storage
        try {
          const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
          if (!storedMessages.some(msg => msg.id === notification.id)) {
            storedMessages.push(notification);
            localStorage.setItem('borrower_messages', JSON.stringify(storedMessages));
            console.log('[DEBUG] Saved message notification to borrower_messages:', notification.title);
          }
        } catch (error) {
          console.error('Failed to save message to localStorage:', error);
        }
      } else if (notification.entityType === 'document') {
        notification.persistent = true;
      }
      
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
      
      // Save to localStorage in multiple places to ensure persistence
      try {
        // Save to main activities key
        localStorage.setItem(activitiesKey, JSON.stringify(limitedActivities));
        
        // Also save to notifications storage key
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limitedActivities));
        
        // For document notifications, also save to document-specific storage
        if (notification.entityType === 'document') {
          const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
          if (!storedDocuments.some(doc => doc.id === notification.id)) {
            storedDocuments.push(notification);
            localStorage.setItem('borrower_documents', JSON.stringify(storedDocuments));
          }
        }
        
        console.log('[DEBUG] Saved notification to localStorage:', notification.title);
      } catch (error) {
        console.error('Failed to save notification to localStorage:', error);
      }
      
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

  // Validate an activity – keep if it belongs to a loan/entity OR is a message
  const isValidActivity = (activity) => {
    // Always allow messages (they may not have loan info)
    if (activity.entityType === 'message') return true;

    // Otherwise require at least loanNumber or entityId
    return Boolean(activity.loanNumber || activity.entityId);
  };

  // Add a unique ID to each activity if it doesn't have one
  const processActivities = (activityList) => {
    return activityList
    .filter(isValidActivity)
    .map(activity => {
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
    // Create a new array for the merged result
    const mergedActivities = [...existingActivities];
    
    // Create a set of existing message signatures for better deduplication
    const existingMessageSignatures = new Set();
    mergedActivities.forEach(activity => {
      if (activity.entityType === 'message' || activity.title?.toLowerCase().includes('message')) {
        const signature = `${activity.title || ''}-${activity.description || ''}`.toLowerCase().trim();
        if (signature.length >= 5) {
          existingMessageSignatures.add(signature);
        }
      }
    });
    
    // Process new activities
    newActivities.forEach(activity => {
      // Add ID if missing
      if (!activity.id) {
        activity.id = generateActivityId(activity);
      }
      
      // Mark messages as persistent
      if (activity.entityType === 'message' || activity.title?.toLowerCase().includes('message')) {
        activity.persistent = true;
        
        // Check for duplicate message by content before storing
        const messageSignature = `${activity.title || ''}-${activity.description || ''}`.toLowerCase().trim();
        if (messageSignature.length >= 5 && existingMessageSignatures.has(messageSignature)) {
          console.log('Skipping duplicate message by content:', activity.title, activity.description);
          return;
        }
        
        // Add to signature set to prevent future duplicates
        if (messageSignature.length >= 5) {
          existingMessageSignatures.add(messageSignature);
        }
        
        // Store messages in localStorage separately
        try {
          const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
          
          // Check for duplicate in localStorage by content
          const isDuplicateInStorage = storedMessages.some(msg => {
            const storedSignature = `${msg.title || ''}-${msg.description || ''}`.toLowerCase().trim();
            return storedSignature === messageSignature;
          });
          
          if (!isDuplicateInStorage) {
            storedMessages.push(activity);
            localStorage.setItem('borrower_messages', JSON.stringify(storedMessages));
            console.log('Stored new message in localStorage:', activity.title);
          }
        } catch (e) {
          console.error('Failed to store message in localStorage', e);
        }
      }
      
      // Skip if it's a duplicate
      if (isDuplicateNotification(activity, mergedActivities)) {
        console.log('Skipping duplicate activity:', activity.title, activity.description);
        return;
      }
      
      // Add to result
      mergedActivities.push({
        ...activity,
        timestamp: activity.timestamp || new Date().toISOString()
      });
    });
    
    // Sort by timestamp (most recent first)
    return mergedActivities.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });
  };
  
  // Quick loan count check to clear notifications if borrower has no loans
async function checkForNoLoans() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Quick check just for loan count only
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // If there are no loans, clear notifications + localStorage
    if (response.data?.data?.totalLoans === 0) {
      console.log('Quick check found no loans. Clearing notifications.');
      setActivities([]);
      localStorage.removeItem(activitiesKey);
    }
  } catch (error) {
    console.error('Error in quick loan check:', error);
  }
}

// Load notifications from localStorage on initial mount
useEffect(() => {
  console.log('[DEBUG] Loading notifications from localStorage');
  try {
    // Load from both storage locations for compatibility
    const storedActivities = localStorage.getItem(activitiesKey);
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const storedDocuments = localStorage.getItem('borrower_documents');
    const storedMessages = localStorage.getItem('borrower_messages');
    
    // Collect all notifications from various sources
    const allSources = [];
    
    // Process stored activities
    if (storedActivities) {
      try {
        const parsed = JSON.parse(storedActivities);
        if (Array.isArray(parsed)) {
          console.log(`[DEBUG] Found ${parsed.length} activities in localStorage`);
          allSources.push(...parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored activities:', e);
      }
    }
    
    // Process stored notifications
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        if (Array.isArray(parsed)) {
          console.log(`[DEBUG] Found ${parsed.length} notifications in localStorage`);
          allSources.push(...parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored notifications:', e);
      }
    }
    
    // Process stored documents
    if (storedDocuments) {
      try {
        const parsed = JSON.parse(storedDocuments);
        if (Array.isArray(parsed)) {
          console.log(`[DEBUG] Found ${parsed.length} document notifications in localStorage`);
          allSources.push(...parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored documents:', e);
      }
    }
    
    // Process stored messages
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          console.log(`[DEBUG] Found ${parsed.length} message notifications in localStorage`);
          allSources.push(...parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
      }
    }
    
    // Deduplicate notifications
    const uniqueNotifications = [];
    const seenIds = new Set();
    const seenDescriptions = new Set();
    
    // First pass - process by ID
    allSources.forEach(notification => {
      // Skip if no ID or already seen
      if (!notification || !notification.id || seenIds.has(notification.id)) {
        return;
      }
      
      // Fix icon if it's a string
      if (typeof notification.icon === 'string') {
        // Keep the string - we'll convert it to a component in renderActivities
      }
      
      // Add to unique list
      seenIds.add(notification.id);
      
      // Add a normalized description key for document notifications
      if (notification.entityType === 'document' && notification.description) {
        const normalizedDesc = normalizeDocumentDescription(notification.description);
        if (normalizedDesc && normalizedDesc.length > 5) {
          notification.normalizedDescription = normalizedDesc;
          seenDescriptions.add(normalizedDesc);
        }
      }
      
      uniqueNotifications.push({
        ...notification,
        // Make sure document and message notifications are marked as persistent
        persistent: notification.persistent || 
                   notification.entityType === 'document' || 
                   notification.entityType === 'message'
      });
    });
    
    // Second pass - check for duplicate document descriptions
    allSources.forEach(notification => {
      // Skip if already processed by ID
      if (!notification || notification.id && seenIds.has(notification.id)) {
        return;
      }
      
      // Check for duplicate document notifications by description
      if (notification.entityType === 'document' && notification.description) {
        const normalizedDesc = normalizeDocumentDescription(notification.description);
        if (normalizedDesc && normalizedDesc.length > 5) {
          if (seenDescriptions.has(normalizedDesc)) {
            // Skip this duplicate
            return;
          }
          seenDescriptions.add(normalizedDesc);
        }
      }
      
      // If we get here, it's a new unique notification without an ID
      // Generate an ID for it
      notification.id = generateNotificationId(notification.entityType || 'notification', notification);
      
      uniqueNotifications.push({
        ...notification,
        persistent: notification.persistent || 
                   notification.entityType === 'document' || 
                   notification.entityType === 'message'
      });
    });
    
    console.log(`[DEBUG] Combined ${uniqueNotifications.length} unique notifications`);
    
    // Sort by timestamp (newest first)
    uniqueNotifications.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA;
    });
    
    // Set the activities
    if (uniqueNotifications.length > 0) {
      setActivities(uniqueNotifications);
      
      // Save to both storage locations for compatibility
      localStorage.setItem(activitiesKey, JSON.stringify(uniqueNotifications));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(uniqueNotifications));
      
      // Also save document and message notifications to their specific storage
      const documentNotifications = uniqueNotifications.filter(n => n.entityType === 'document');
      if (documentNotifications.length > 0) {
        localStorage.setItem('borrower_documents', JSON.stringify(documentNotifications));
      }
      
      const messageNotifications = uniqueNotifications.filter(n => n.entityType === 'message');
      if (messageNotifications.length > 0) {
        localStorage.setItem('borrower_messages', JSON.stringify(messageNotifications));
      }
    }
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
  }

  // Fetch fresh data from the backend so we stay up-to-date
  fetchDashboardData();
}, []);

// Extract userId from token when component mounts
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      if (decoded.id) {
        setUserId(decoded.id);
        console.log('[DEBUG] User ID set from token:', decoded.id);
      }
    } catch (error) {
      console.error('Failed to decode token for userId:', error);
    }
  }
}, []);
  
  // Call cleanup on initial mount
  useEffect(() => {
    cleanupDuplicateMessages();
    cleanupDuplicateDocuments();
}, []);
  
  // Fetch dashboard data and activities
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Check if we should use cached data
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION && loans.length > 0) {
      console.log('Using cached borrower dashboard data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[DEBUG] Starting dashboard data fetch...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      // Extract user ID from token
      let userId = null;
      if (token) {
        const payload = token.split('.')[1];
        try {
          const decoded = JSON.parse(atob(payload));
          if (decoded.id) {
            userId = decoded.id;
            setUserId(decoded.id); // Set the userId state
            console.log('[DEBUG] User ID from token:', decoded.id);
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
        }
      }
      
      // Fetch dashboard stats
      console.log('[DEBUG] Fetching dashboard stats from:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`);
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      // Process the stats data
      const statsData = statsResponse.data.data || {};
      console.log('[DEBUG] Dashboard stats received:', statsData);
      
      setStats({
        totalLoans: statsData.totalLoans || 0,
        activeLoans: statsData.activeLoans || 0,
        completedLoans: statsData.completedLoans || 0,
        totalAmount: statsData.totalAmount || 0,
        percentChanges: statsData.percentChanges || {
          loans: 0,
          applications: 0, 
          amount: 0
        }
      });
      
      // Process recent loans
      const enrichedLoans = statsData.recentLoans || [];
      console.log('[DEBUG] Recent loans:', enrichedLoans.length);
      setLoans(enrichedLoans);
      setLastFetchTime(now);
      setLoading(false); // Stop loading after successful data fetch
      console.log('[DEBUG] Dashboard data fetch completed successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Set default data even if API fails
      setStats({
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        totalAmount: 0,
        percentChanges: {
          loans: 0,
          applications: 0,
          amount: 0
        }
      });
      setLoans([]);
      setLoading(false);
      
      if (error.response?.status === 401) {
        toast.error('Please log in again');
        router.push('/login');
      } else {
        toast.error('Failed to load dashboard data. Showing empty dashboard.');
      }
    }
  }, [lastFetchTime, loans, router]);

  // Fetch fresh data from the backend so we stay up-to-date
  useEffect(() => {
    fetchDashboardData();
  }, []); // Remove fetchDashboardData from dependencies to prevent infinite loops
  
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
      // Ensure icon is a valid component - use string name to look up component or default to FileText
      let icon = FileText;
      if (typeof activity.icon === 'function') {
        icon = activity.icon;
      } else if (typeof activity.icon === 'string') {
        // Map string icon names to components
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
          'FilePen': FileEdit,
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
        icon = iconMap[activity.icon] || FileText;
      }
      
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
    
    // Log the activities for debugging
    console.log('[DEBUG] Displaying activities:', formattedActivities.length);
    
    // Limit to 10 notifications to avoid overwhelming the UI
    const displayActivities = formattedActivities.slice(0, 10);
    
    return (
      <ul className="divide-y divide-gray-100">
        {displayActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id || `activity-${index}-${Date.now()}`}
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
      
      // First, restore any saved messages from localStorage
      try {
        const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
        if (storedMessages.length > 0) {
          console.log('Restoring stored messages before refresh:', storedMessages.length);
          setActivities(prevActivities => {
            // Create a set of existing message signatures for better deduplication
            const existingSignatures = new Set();
            prevActivities.forEach(activity => {
              if (activity.entityType === 'message' || activity.title?.toLowerCase().includes('message')) {
                const signature = `${activity.title || ''}-${activity.description || ''}`.toLowerCase().trim();
                if (signature.length >= 5) {
                  existingSignatures.add(signature);
                }
              }
            });
            
            // Filter out messages that already exist in the activities based on content
            const newMsgs = storedMessages.filter(msg => {
              const signature = `${msg.title || ''}-${msg.description || ''}`.toLowerCase().trim();
              if (signature.length < 5) return true; // Keep messages with short/empty signatures
              return !existingSignatures.has(signature);
            });
            
            if (newMsgs.length > 0) {
              console.log(`Adding ${newMsgs.length} unique stored messages during refresh`);
              return [...prevActivities, ...newMsgs];
            }
            return prevActivities;
          });
        }
      } catch (e) {
        console.error('Failed to restore messages before refresh', e);
      }
      
      // Get current loans to ensure proper filtering
      const statsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Process loan data from the stats response
      const statsData = statsResponse.data.data || {};
      const enrichedLoans = statsData.recentLoans || [];
      
      // Update the loans state
      setLoans(enrichedLoans);
      
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
          'FilePen': FileEdit,
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
                      activity.entityType === 'message' ||
                      (activity.title && (
                        activity.title.toLowerCase().includes('document') || 
                        activity.title.toLowerCase().includes('milestone') ||
                        activity.title.toLowerCase().includes('message')
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
  
  // Run cleanup on loans change
  useEffect(() => {
    if (loans && loans.length > 0) {
      console.log('Running notification cleanup after loans loaded');
      // Slight delay to ensure loans are fully processed
      setTimeout(cleanupInvalidNotifications, 500);
    }
  }, [loans]);
  
  // Add this to useEffect for initialization to load messages on startup
  useEffect(() => {
    // Restore saved messages from localStorage on initial load
    try {
      const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
      if (storedMessages.length > 0) {
        console.log('Restoring stored messages on startup:', storedMessages.length);
        setActivities(prevActivities => {
          const existingIds = new Set(prevActivities.map(a => a.id));
          const newMessages = storedMessages.filter(msg => !existingIds.has(msg.id));
          return [...prevActivities, ...newMessages];
        });
      }
    } catch (e) {
      console.error('Failed to restore messages from localStorage on startup', e);
    }
    
    // Restore saved document notifications from localStorage on initial load
    try {
      const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
      if (storedDocuments.length > 0) {
        console.log('Restoring stored document notifications on startup:', storedDocuments.length);
        
        // Prioritize document approval/rejection notifications
        const importantDocs = storedDocuments.filter(doc => 
          doc.title?.toLowerCase().includes('approved') || 
          doc.title?.toLowerCase().includes('rejected')
        );
        
        const otherDocs = storedDocuments.filter(doc => 
          !doc.title?.toLowerCase().includes('approved') && 
          !doc.title?.toLowerCase().includes('rejected')
        );
        
        console.log(`Found ${importantDocs.length} important document notifications`);
        
        // Add all notifications to activities state
        setActivities(prevActivities => {
          const existingIds = new Set(prevActivities.map(a => a.id));
          const newDocNotifications = [...importantDocs, ...otherDocs].filter(doc => !existingIds.has(doc.id));
          return [...prevActivities, ...newDocNotifications];
        });
      }
    } catch (e) {
      console.error('Failed to restore document notifications from localStorage on startup', e);
    }
    
    // Restore saved milestone notifications from localStorage on initial load
    try {
      const storedMilestones = JSON.parse(localStorage.getItem('borrower_milestones') || '[]');
      if (storedMilestones.length > 0) {
        console.log('Restoring stored milestone notifications on startup:', storedMilestones.length);
        setActivities(prevActivities => {
          const existingIds = new Set(prevActivities.map(a => a.id));
          const newMilestoneNotifications = storedMilestones.filter(ms => !existingIds.has(ms.id));
          return [...prevActivities, ...newMilestoneNotifications];
        });
      }
    } catch (e) {
      console.error('Failed to restore milestone notifications from localStorage on startup', e);
    }
  }, []);
  
  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      // First try to load from localStorage
      const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
      if (storedMessages && storedMessages.length > 0) {
        console.log('Found stored messages in localStorage:', storedMessages.length);
        
        // Add these messages to the activities state
        setActivities(prevActivities => {
          // Create a set of existing message signatures to avoid duplicates
          const existingSignatures = new Set();
          prevActivities.forEach(activity => {
            if (activity.entityType === 'message' || activity.title?.toLowerCase().includes('message')) {
              const signature = `${activity.title || ''}-${activity.description || ''}`.toLowerCase().trim();
              if (signature.length >= 5) {
                existingSignatures.add(signature);
              }
            }
          });
          
          // Filter out messages that already exist in the activities based on content
          const newMessages = storedMessages.filter(msg => {
            const signature = `${msg.title || ''}-${msg.description || ''}`.toLowerCase().trim();
            if (signature.length < 5) return true; // Keep messages with short/empty signatures
            return !existingSignatures.has(signature);
          });
          
          if (newMessages.length > 0) {
            console.log(`Adding ${newMessages.length} stored messages to activities`);
            return [...prevActivities, ...newMessages];
          }
          return prevActivities;
        });
      }
    } catch (e) {
      console.error('Failed to load messages from localStorage:', e);
    }
  }, []);
  
  // Function to clean up duplicate messages in localStorage
  const cleanupDuplicateMessages = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
      if (storedMessages.length === 0) return;
      
      console.log(`[DEBUG] Cleaning up messages in localStorage: ${storedMessages.length} messages`);
      
      // Use a Map to deduplicate by content signature
      const uniqueMessages = new Map();
      
      // Process each message
      storedMessages.forEach(message => {
        if (!message || !message.title) return;
        
        // Create a content signature for comparison
        const signature = `${message.title || ''}-${message.description || ''}`.toLowerCase().trim();
        if (signature.length < 5) {
          // For very short signatures, use ID-based deduplication
          if (message.id) {
            uniqueMessages.set(message.id, message);
          }
          return;
        }
        
        // If this signature already exists, keep the newer message
        if (uniqueMessages.has(signature)) {
          const existing = uniqueMessages.get(signature);
          const existingTime = existing.timestamp ? new Date(existing.timestamp) : new Date(0);
          const newTime = message.timestamp ? new Date(message.timestamp) : new Date(0);
          
          // Replace only if this message is newer
          if (newTime > existingTime) {
            uniqueMessages.set(signature, message);
          }
        } else {
          // Add new signature
          uniqueMessages.set(signature, message);
        }
      });
      
      // Convert back to array
      const cleanedMessages = Array.from(uniqueMessages.values());
      
      console.log(`[DEBUG] Cleaned up messages: ${storedMessages.length} -> ${cleanedMessages.length}`);
      
      // Save back to localStorage
      localStorage.setItem('borrower_messages', JSON.stringify(cleanedMessages));
      
      return cleanedMessages;
    } catch (e) {
      console.error('Failed to clean up duplicate messages:', e);
      return null;
    }
  };
  
  // Function to clean up duplicate document notifications in localStorage
  const cleanupDuplicateDocuments = () => {
    try {
      const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
      if (storedDocuments.length === 0) return;
      
      console.log(`[DEBUG] Cleaning up document notifications in localStorage: ${storedDocuments.length} notifications`);
      
      // Separate important notifications (approvals/rejections) from others
      const importantDocs = storedDocuments.filter(doc => 
        doc.title?.toLowerCase().includes('approved') || 
        doc.title?.toLowerCase().includes('rejected')
      );
      
      const regularDocs = storedDocuments.filter(doc => 
        !doc.title?.toLowerCase().includes('approved') && 
        !doc.title?.toLowerCase().includes('rejected')
      );
      
      console.log(`[DEBUG] Found ${importantDocs.length} important document notifications`);
      
      // Use a Map to deduplicate regular documents by content signature
      const uniqueRegularDocs = new Map();
      
      // Process each regular document notification
      regularDocs.forEach(document => {
        if (!document || !document.title) return;
        
        // Create a content signature for comparison
        const signature = `${document.title || ''}-${document.description || ''}`.toLowerCase().trim();
        if (signature.length < 5) {
          // For very short signatures, use ID-based deduplication
          if (document.id) {
            uniqueRegularDocs.set(document.id, document);
          }
          return;
        }
        
        // If this signature already exists, keep the newer document
        if (uniqueRegularDocs.has(signature)) {
          const existing = uniqueRegularDocs.get(signature);
          const existingTime = existing.timestamp ? new Date(existing.timestamp) : new Date(0);
          const newTime = document.timestamp ? new Date(document.timestamp) : new Date(0);
          
          // Replace only if this document is newer
          if (newTime > existingTime) {
            uniqueRegularDocs.set(signature, document);
          }
        } else {
          // Add new signature
          uniqueRegularDocs.set(signature, document);
        }
      });
      
      // Use a Map to deduplicate important documents by document ID
      const uniqueImportantDocs = new Map();
      
      // Process each important document notification
      importantDocs.forEach(document => {
        if (!document || !document.title) return;
        
        // Use document ID or content as key
        const key = document.documentId || 
                   `${document.title || ''}-${document.description || ''}`.toLowerCase().trim();
        
        // If this document already exists, keep the newer one
        if (uniqueImportantDocs.has(key)) {
          const existing = uniqueImportantDocs.get(key);
          const existingTime = existing.timestamp ? new Date(existing.timestamp) : new Date(0);
          const newTime = document.timestamp ? new Date(document.timestamp) : new Date(0);
          
          // Replace only if this document is newer
          if (newTime > existingTime) {
            uniqueImportantDocs.set(key, document);
          }
        } else {
          // Add new document
          uniqueImportantDocs.set(key, document);
        }
      });
      
      // Convert back to array
      const cleanedRegularDocs = Array.from(uniqueRegularDocs.values());
      const cleanedImportantDocs = Array.from(uniqueImportantDocs.values());
      const cleanedDocuments = [...cleanedImportantDocs, ...cleanedRegularDocs];
      
      console.log(`[DEBUG] Cleaned up document notifications: ${storedDocuments.length} -> ${cleanedDocuments.length}`);
      console.log(`[DEBUG] Important documents: ${cleanedImportantDocs.length}, Regular documents: ${cleanedRegularDocs.length}`);
      
      // Save back to localStorage
      localStorage.setItem('borrower_documents', JSON.stringify(cleanedDocuments));
      
      return cleanedDocuments;
    } catch (e) {
      console.error('Failed to clean up duplicate document notifications:', e);
      return null;
    }
  };
  
  return (
    <MainLayout title="Borrower Dashboard">
      {/* Activity Manager for real-time updates - ensure it's loaded first */}
      {userId && <ActivityManager key={userId} userId={userId} updateActivities={setActivities} />}
      
      <div className="py-6">
        <div className="flex flex-col space-y-4 md:space-y-0 lg:flex-row lg:items-center md:justify-between mb-6">
          <div className='lg:mb-0 mb-3'>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your loans and applications
            </p>
          </div>
          
          <div className="flex justify-start">
            <Link href="/borrower/apply"
              className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mr-3 mt-3 sm:mt-0 md:text-base">
              Apply for a Loan
            </Link>
            <Link href="/borrower/documents" 
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3 sm:mt-0 md:text-base">
              My Documents
            </Link>
          </div>
        </div>
        
        {loading ? (
          <>
    {/* Stats Grid Loading Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-6">
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

                {loans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loans.map((loan) => {
                      // Debug: log the loan object structure to see what fields are available
                      console.log('Loan object for card:', JSON.stringify(loan, null, 2));
                      
                      // Additional debug: log available interest rate and term fields
                      console.log('Potential interest rate fields for loan ' + loan._id + ':', {
                        interestRate: loan.interestRate, 
                        loanParametersInterestRate: loan.loanParameters?.interestRate,
                        loanDetailsInterestRate: loan.loanDetails?.interestRate,
                        loanParametersRate: loan.loanParameters?.rate,
                        termsInterestRate: loan.terms?.interestRate,
                        interest: loan.interest,
                        summaryInterestRate: loan.summary?.interestRate,
                        rate: loan.rate
                      });
                      
                      console.log('Potential term fields for loan ' + loan._id + ':', {
                        loanDetailsLoanTerm: loan.loanDetails?.loanTerm,
                        loanParametersLoanTerm: loan.loanParameters?.loanTerm,
                        termsLoanTerm: loan.terms?.loanTerm,
                        term: loan.term,
                        summaryTerm: loan.summary?.term,
                        summaryLoanTerm: loan.summary?.loanTerm,
                        loanTerm: loan.loanTerm
                      });
                      
                      return (
                        <LoanCard
                          key={loan._id}
                          loan={loan}
                          onView={handleViewLoan}
                        />
                      );
                    })}
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
                {/* {loans.length > 0 && (
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
                      <button
                        onClick={cleanupInvalidNotifications}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                        title="Remove invalid notifications"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Clean
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