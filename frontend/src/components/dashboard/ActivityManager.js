// ActivityManager.js
import { useEffect, useState } from 'react';
import socketService from '../../services/socket.service';
import { toast } from 'react-hot-toast';
import { MessageSquare, CheckCircle, FilePlus, FileX, FileCheck, FileText, Bell, XCircle, AlertTriangle } from 'lucide-react';

const ActivityManager = ({ userId, updateActivities }) => {
  const [isConnected, setIsConnected] = useState(false);

  // Generate a unique ID for activities
  const generateActivityId = (type, data) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  };

  useEffect(() => {
    if (!userId) return;
    
    console.log('ActivityManager: Initializing with userId', userId);
    
    // Connect to socket
    const socket = socketService.connect();
    
    // Join user's room
    socketService.joinRoom(userId);
    console.log('ActivityManager: Joined room', userId);
    
    // Also join borrower-specific room
    socketService.joinRoom(`borrower-${userId}`);
    console.log('ActivityManager: Joined borrower-specific room', `borrower-${userId}`);
    
    // Log connection status
    socket.on('connect', () => {
      console.log('ActivityManager: Socket connected with ID', socket.id);
      setIsConnected(true);
    });
    
    // Process all notification events with a common handler
    const processNotificationEvent = (eventType, data) => {
      console.log(`ActivityManager: Received ${eventType} event:`, data);
      
      // Create a notification based on the event type
      let newActivity = null;
      
      // For message events
      if (eventType.includes('message')) {
        newActivity = createMessageNotification(data);
        if (newActivity) {
          toast.success(`New message from ${data.senderName || data.sender || 'Lender'}`);
        }
      }
      // For milestone events
      else if (eventType.includes('milestone')) {
        newActivity = createMilestoneNotification(data);
        if (newActivity) {
          const milestoneName = data.title || data.milestoneName || 'Loan milestone';
          toast.success(`Milestone completed: ${milestoneName}`);
        }
      }
      // For document request events
      else if (eventType.includes('document') && (eventType.includes('request') || data.status === 'pending')) {
        newActivity = createDocumentRequestNotification(data);
        if (newActivity) {
          const documentName = data.documentName || data.title || data.documentType || 'Document';
          toast.info(`Document requested: ${documentName}`);
        }
      }
      // For document status change events
      else if (eventType.includes('document') && eventType.includes('status')) {
        newActivity = createDocumentStatusNotification(data);
        if (newActivity && data.status) {
          const documentName = data.documentName || data.title || 'Document';
          if (data.status.toLowerCase() === 'approved') {
            toast.success(`Document approved: ${documentName}`);
          } else if (data.status.toLowerCase() === 'rejected') {
            toast.error(`Document rejected: ${documentName}`);
          } else {
            toast.info(`Document status updated: ${documentName}`);
          }
        }
      }
      // For loan status events
      else if (eventType.includes('loan') && eventType.includes('status')) {
        newActivity = createLoanStatusNotification(data);
        if (newActivity) {
          toast.info(`Loan status updated: ${data.status || 'Status changed'}`);
        }
      }
      // For generic notifications
      else if (eventType === 'notification') {
        newActivity = createGenericNotification(data);
        if (newActivity) {
          toast.info(newActivity.title);
        }
      }
      
      // Add the notification if created
      if (newActivity) {
        updateActivities(prevActivities => {
          // Check if this is a duplicate notification
          const isDuplicate = prevActivities.some(act => 
            act.id === newActivity.id || 
            (act.entityType === newActivity.entityType && 
             act.title === newActivity.title && 
             act.description === newActivity.description &&
             Date.now() - new Date(act.timestamp).getTime() < 300000) // 5 minutes
          );
          
          if (isDuplicate) {
            console.log('ActivityManager: Skipping duplicate notification');
            return prevActivities;
          }
          
          // Always add new activities at the top of the stack
          return [newActivity, ...prevActivities];
        });
      }
    };
    
    // Create notification objects for different event types
    
    // Message notifications
    const createMessageNotification = (data) => {
      // Extract sender name - if an object is provided, get the name property
      let senderName = 'Lender';
      if (data.senderName) {
        senderName = data.senderName;
      } else if (data.sender) {
        if (typeof data.sender === 'object' && data.sender !== null) {
          // If sender is an object, try to get name from it
          senderName = data.sender.firstName || data.sender.name || data.sender.companyName || 'Lender';
        } else {
          senderName = data.sender;
        }
      }
      
      return {
        id: generateActivityId('msg', data),
        icon: MessageSquare,
        title: `New message from ${senderName}`,
        description: data.content?.substring(0, 30) || 'You have a new message',
        time: 'Just now',
        status: 'New',
        statusColor: 'blue',
        entityType: 'message',
        url: '/borrower/messages',
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Milestone notifications
    const createMilestoneNotification = (data) => {
      const milestoneName = data.title || data.milestoneName || 'Loan milestone';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      return {
        id: generateActivityId('milestone', data),
        icon: CheckCircle,
        title: `Milestone completed`,
        description: `${milestoneName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        time: 'Just now',
        status: 'Completed',
        statusColor: 'green',
        entityId: loanId,
        entityType: 'milestone',
        loanNumber,
        url: loanId ? `/borrower/loans/${loanId}?tab=milestones` : '/borrower/dashboard',
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Document request notifications
    const createDocumentRequestNotification = (data) => {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      return {
        id: generateActivityId('doc-req', data),
        icon: FilePlus,
        title: `Document requested`,
        description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        time: 'Just now',
        status: 'Pending',
        statusColor: 'blue',
        entityId: loanId,
        entityType: 'document',
        loanNumber,
        url: `/borrower/documents`,
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Document status change notifications
    const createDocumentStatusNotification = (data) => {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      let status = data.status || 'Updated';
      let icon = FileText;
      let statusColor = 'blue';
      
      if (status.toLowerCase() === 'approved') {
        icon = FileCheck;
        statusColor = 'green';
      } else if (status.toLowerCase() === 'rejected') {
        icon = FileX; 
        statusColor = 'red';
      } else if (status.toLowerCase() === 'correction' || status.toLowerCase() === 'needs_correction') {
        icon = AlertTriangle;
        statusColor = 'yellow';
      }
      
      return {
        id: generateActivityId('doc-status', data),
        icon,
        title: `Document ${status}`,
        description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
        time: 'Just now',
        status,
        statusColor,
        entityId: loanId,
        entityType: 'document',
        loanNumber,
        url: `/borrower/documents`,
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Loan status notifications
    const createLoanStatusNotification = (data) => {
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      const status = data.status || data.newStatus || 'Updated';
      
      let icon = Bell;
      let statusColor = 'blue';
      
      if (status.toLowerCase().includes('approved')) {
        icon = CheckCircle;
        statusColor = 'green';
      } else if (status.toLowerCase().includes('reject')) {
        icon = XCircle;
        statusColor = 'red';
      }
      
      return {
        id: generateActivityId('loan-status', data),
        icon,
        title: `Loan status updated`,
        description: `Loan ${loanNumber} status is now ${status}`,
        time: 'Just now',
        status,
        statusColor,
        entityId: loanId,
        entityType: 'loan',
        loanNumber,
        url: loanId ? `/borrower/loans/${loanId}` : '/borrower/loans',
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Generic notifications
    const createGenericNotification = (data) => {
      // Try to determine notification type from content
      if (!data) return null;
      
      if (data.type === 'milestone' || data.eventType === 'milestone-completed' || 
          (data.title && data.title.toLowerCase().includes('milestone'))) {
        return createMilestoneNotification(data);
      } else if (data.type === 'document-request' || data.eventType === 'document-request' || 
                (data.title && data.title.toLowerCase().includes('document') && 
                 data.title.toLowerCase().includes('request'))) {
        return createDocumentRequestNotification(data);
      } else if (data.type === 'document-status' || data.eventType === 'document-status' || 
                (data.title && data.title.toLowerCase().includes('document') && 
                 data.status)) {
        return createDocumentStatusNotification(data);
      } else if (data.type === 'loan-status' || data.eventType === 'loan-status-changed' || 
                (data.title && data.title.toLowerCase().includes('loan') && 
                 data.status)) {
        return createLoanStatusNotification(data);
      }
      
      // Fallback to a generic notification
      return {
        id: generateActivityId('notification', data),
        icon: Bell,
        title: data.title || 'New notification',
        description: data.description || data.message || '',
        time: 'Just now',
        status: data.status || 'Info',
        statusColor: 'blue',
        entityId: data.entityId,
        entityType: data.entityType || 'notification',
        url: data.url,
        timestamp: new Date().toISOString(),
        persistent: true
      };
    };
    
    // Register socket event handlers for all notification types
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
    
    eventTypes.forEach(eventType => {
      socket.on(eventType, data => processNotificationEvent(eventType, data));
    });
    
    // Clean up on unmount
    return () => {
      console.log('ActivityManager: Cleaning up socket listeners');
      eventTypes.forEach(eventType => {
        socket.off(eventType);
      });
      setIsConnected(false);
    };
  }, [userId, updateActivities]);

  // For debugging, uncomment to show connection status
  /*
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: isConnected ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)', 
      padding: '5px',
      borderRadius: '3px',
      fontSize: '10px',
      zIndex: 9999
    }}>
      Socket: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
  */
  
  return null;
};

export default ActivityManager;
