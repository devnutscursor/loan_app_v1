// ActivityManager.js
import { useEffect, useState } from 'react';
import socketService from '../../services/socket.service';
import { toast } from 'react-hot-toast';
import { MessageSquare, CheckCircle, FilePlus, FileX, FileCheck, FileText, Bell, XCircle, AlertTriangle } from 'lucide-react';

const ActivityManager = ({ userId, updateActivities }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [existingActivities, setExistingActivities] = useState([]);

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
    
    // Process notification events from socket
    const processNotificationEvent = (data) => {
      console.log(`ActivityManager: Received event:`, data);
      
      // Skip notifications without proper data
      if (!data) {
        console.log('ActivityManager: Skipping empty notification data');
        return;
      }
      
      // Validate notification belongs to current user
      if (data.borrowerId && data.borrowerId !== userId) {
        console.log(`ActivityManager: Skipping notification - borrowerId ${data.borrowerId} doesn't match current user ${userId}`);
        return;
      }
      
      // For document notifications, ensure they have a valid loan association
      if ((data.type === 'document-request' || data.type === 'document-status') && 
          !data.loanId && !data.loanNumber) {
        console.log('ActivityManager: Skipping document notification - missing loan association');
        return;
      }
      
      let newActivity = null;
      
      // For message events
      if (data.type && data.type.includes('message')) {
        newActivity = createMessageNotification(data);
      }
      // For milestone events
      else if (data.type && data.type.includes('milestone')) {
        newActivity = createMilestoneNotification(data);
      }
      // For document request events
      else if (data.type && data.type === 'document-request') {
        console.log('ActivityManager: Creating document request notification:', data);
        newActivity = createDocumentRequestNotification(data);
      }
      // For document status change events
      else if (data.type && data.type === 'document-status') {
        console.log('ActivityManager: Creating document status notification:', data);
        newActivity = createDocumentStatusNotification(data);
      }
      
      // If we have a new activity, update the state
      if (newActivity) {
        console.log('ActivityManager: New activity created:', newActivity);
        
        // Call the parent component's update function
        if (updateActivities) {
          updateActivities(prevActivities => {
            // Check for duplicates before adding
            const isDuplicate = prevActivities.some(activity => {
              return (
                activity.id === newActivity.id || 
                (activity.title === newActivity.title && 
                 activity.description === newActivity.description &&
                 Math.abs(new Date(activity.timestamp) - new Date(newActivity.timestamp)) < 60000)
              );
            });
            
            if (isDuplicate) {
              console.log('ActivityManager: Skipping duplicate notification');
              return prevActivities;
            }
            
            // Add the new activity to the state (at the top)
            return [newActivity, ...prevActivities];
          });
        }
      }
    };
    
    // Create message notification
    const createMessageNotification = (data) => {
      const messageId = data.id || generateActivityId('msg', data);
      const senderName = data.senderName || 
                        (data.sender?.firstName ? `${data.sender.firstName} ${data.sender.lastName || ''}` : 'Lender');
      const messageContent = data.content?.substring(0, 40) + (data.content?.length > 40 ? '...' : '') || 'You have a new message';
      
      const notification = {
        id: messageId,
        icon: MessageSquare,
        title: `New message from ${senderName}`,
        description: messageContent,
        time: 'Just now',
        status: 'New',
        statusColor: 'blue',
        entityType: 'message',
        url: '/borrower/messages',
        timestamp: data.timestamp || new Date().toISOString(),
        persistent: true
      };
      
      // Also save this notification to localStorage directly to ensure persistence
      try {
        const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
        
        // Generate a content signature for deduplication
        const newSignature = `${notification.title || ''}-${notification.description || ''}`.toLowerCase().trim();
        
        // Check if a similar message already exists
        const isDuplicate = storedMessages.some(msg => {
          const existingSignature = `${msg.title || ''}-${msg.description || ''}`.toLowerCase().trim();
          return newSignature === existingSignature;
        });
        
        if (!isDuplicate) {
          storedMessages.push(notification);
          localStorage.setItem('borrower_messages', JSON.stringify(storedMessages));
          console.log('ActivityManager: Saved message notification to localStorage');
        } else {
          console.log('ActivityManager: Skipped duplicate message notification');
        }
      } catch (e) {
        console.error('ActivityManager: Failed to save message notification to localStorage', e);
      }
      
      return notification;
    };
    
    // Create milestone notification
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
        timestamp: data.timestamp || new Date().toISOString(),
        persistent: true
      };
    };
    
    // Document request notifications
    const createDocumentRequestNotification = (data) => {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      // Handle batch requests
      if (data.isBatch && data.documents && Array.isArray(data.documents)) {
        const documentList = data.documents.map(doc => doc.title || doc.documentType).join(', ');
        return {
          id: generateActivityId('doc-req-batch', data),
          icon: FilePlus,
          title: `Multiple documents requested`,
          description: `${documentList}${loanNumber ? ` for loan ${loanNumber}` : ''}`,
          time: 'Just now',
          status: 'Pending',
          statusColor: 'blue',
          entityId: loanId,
          entityType: 'document',
          loanNumber,
          url: `/borrower/documents`,
          timestamp: data.timestamp || new Date().toISOString(),
          persistent: true
        };
      }
      
      // Single document request
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
        timestamp: data.timestamp || new Date().toISOString(),
        persistent: true
      };
    };
    
    // Document status notification
    const createDocumentStatusNotification = (data) => {
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      const status = data.status ? data.status.toLowerCase() : 'updated';
      
      let icon = FileText;
      let statusColor = 'blue';
      let title = `Document status updated`;
      
      if (status === 'approved') {
        icon = FileCheck;
        statusColor = 'green';
        title = `Document approved`;
      } else if (status === 'rejected') {
        icon = FileX;
        statusColor = 'red';
        title = `Document rejected`;
      }
      
      // Also save this notification to localStorage directly to ensure persistence
      try {
        const notification = {
          id: generateActivityId('doc-status', data),
          icon: icon,
          title: title,
          description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}${data.notes ? `: ${data.notes}` : ''}`,
          time: 'Just now',
          status: status.charAt(0).toUpperCase() + status.slice(1),
          statusColor: statusColor,
          entityId: loanId,
          entityType: 'document',
          loanNumber,
          url: `/borrower/documents`,
          timestamp: data.timestamp || new Date().toISOString(),
          persistent: true
        };
        
        // Save to document-specific storage
        const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
        if (!storedDocuments.some(doc => doc.id === notification.id)) {
          storedDocuments.push(notification);
          localStorage.setItem('borrower_documents', JSON.stringify(storedDocuments));
          console.log('ActivityManager: Saved document notification to localStorage');
        }
        
        return notification;
      } catch (e) {
        console.error('ActivityManager: Failed to save document notification to localStorage', e);
        
        // Return the notification even if saving to localStorage failed
        return {
          id: generateActivityId('doc-status', data),
          icon: icon,
          title: title,
          description: `${documentName}${loanNumber ? ` for loan ${loanNumber}` : ''}${data.notes ? `: ${data.notes}` : ''}`,
          time: 'Just now',
          status: status.charAt(0).toUpperCase() + status.slice(1),
          statusColor: statusColor,
          entityId: loanId,
          entityType: 'document',
          loanNumber,
          url: `/borrower/documents`,
          timestamp: data.timestamp || new Date().toISOString(),
          persistent: true
        };
      }
    };
    
    // Register socket event listeners
    const listenerKey = `borrower-${userId}`;
    socketService.addMessageListener(listenerKey, processNotificationEvent);
    
    // Register event handlers for all notification types
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
      'document-approved',
      'document-rejected',
      'document_approved',
      'document_rejected',
      'document_status_update',
      'loan-status',
      'loan_status_changed'
    ];

    // Register all event types
    eventTypes.forEach(eventType => {
      // Instead of using socketService.on directly, we'll use the socket instance
      const socket = socketService.getSocket();
      if (socket) {
        socket.on(eventType, processNotificationEvent);
        console.log(`ActivityManager: Registered listener for ${eventType}`);
      }
    });
    
    // Cleanup function
    return () => {
      console.log('ActivityManager: Cleaning up socket listeners');
      socketService.removeMessageListener(listenerKey);
      
      // Remove all event listeners
      eventTypes.forEach(eventType => {
        const socket = socketService.getSocket();
        if (socket) {
          socket.off(eventType);
        }
      });
      
      // Disconnect socket
      socketService.disconnect();
    };
  }, [userId, updateActivities]);

  // For debugging, show connection status
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
      {/* Socket: {isConnected ? 'Connected' : 'Disconnected'} */}
    </div>
  );
};

export default ActivityManager;
