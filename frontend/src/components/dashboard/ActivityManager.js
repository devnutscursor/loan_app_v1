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
      console.log('ActivityManager: Processing notification event:', data);
      
      // Skip if no data
      if (!data) return;
      
      // Determine notification type
      const eventType = data.type || data.eventType;
      console.log('ActivityManager: Event type:', eventType);
      
      let notification;
      
      // Process based on event type
      if (eventType === 'message' || 
          eventType === 'receive_message' || 
          eventType === 'new_lender_message') {
        notification = createMessageNotification(data);
        
        // Save message notifications to localStorage for persistence
        try {
          const storedMessages = JSON.parse(localStorage.getItem('borrower_messages') || '[]');
          if (!storedMessages.some(msg => msg.id === notification.id)) {
            storedMessages.push(notification);
            localStorage.setItem('borrower_messages', JSON.stringify(storedMessages));
            console.log('ActivityManager: Saved message notification to localStorage');
          }
        } catch (e) {
          console.error('ActivityManager: Failed to save message notification to localStorage', e);
        }
      } 
      else if (eventType === 'milestone' || 
               eventType === 'milestone-completed' || 
               eventType === 'milestone_updated') {
        notification = createMilestoneNotification(data);
        
        // Save milestone notifications to localStorage for persistence
        try {
          const storedMilestones = JSON.parse(localStorage.getItem('borrower_milestones') || '[]');
          if (!storedMilestones.some(ms => ms.id === notification.id)) {
            storedMilestones.push(notification);
            localStorage.setItem('borrower_milestones', JSON.stringify(storedMilestones));
            console.log('ActivityManager: Saved milestone notification to localStorage');
          }
        } catch (e) {
          console.error('ActivityManager: Failed to save milestone notification to localStorage', e);
        }
      }
      else if (eventType === 'document-request' || 
               eventType === 'document_requested') {
        notification = createDocumentRequestNotification(data);
        
        // Save document request notifications to localStorage for persistence
        try {
          const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
          // Check if this notification already exists by comparing content
          const documentName = data.documentName || data.title || data.documentType || 'Document';
          const signature = `${notification.title}-${documentName}`.toLowerCase().trim();
          
          if (!storedDocuments.some(doc => {
            const existingSignature = `${doc.title || ''}-${doc.description || ''}`.toLowerCase().trim();
            return existingSignature === signature;
          })) {
            storedDocuments.push(notification);
            localStorage.setItem('borrower_documents', JSON.stringify(storedDocuments));
            console.log('ActivityManager: Saved document request notification to localStorage');
          }
        } catch (e) {
          console.error('ActivityManager: Failed to save document request notification to localStorage', e);
        }
      }
      else if (eventType === 'document-status' || 
               eventType === 'document_status_changed' ||
               eventType === 'document-approved' ||
               eventType === 'document_approved' ||
               eventType === 'document-rejected' ||
               eventType === 'document_rejected' ||
               eventType === 'document_status_update') {
        notification = createDocumentStatusNotification(data);
        
        // Notification is already saved to localStorage in createDocumentStatusNotification
      }
      else {
        // Generic notification
        console.log('ActivityManager: Unknown notification type:', eventType);
        return;
      }
      
      // Update activities state via callback
      if (notification) {
        updateActivities(prevActivities => {
          // Check if this notification already exists
          if (prevActivities.some(activity => activity.id === notification.id)) {
            return prevActivities;
          }
          return [notification, ...prevActivities];
        });
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
      // Debug incoming data
      console.log('ActivityManager: Creating document status notification:', data);
      
      const documentName = data.documentName || data.title || data.documentType || 'Document';
      const loanId = data.loanId || data.entityId;
      const loanNumber = data.loanNumber || (loanId ? `#${loanId.toString().substr(-5)}` : '');
      
      // Determine status from various possible fields
      let status = 'updated';
      if (data.status) {
        status = data.status.toLowerCase();
      } else if (data.type) {
        if (data.type.includes('approved')) status = 'approved';
        else if (data.type.includes('rejected')) status = 'rejected';
      } else if (data.eventType) {
        if (data.eventType.includes('approved')) status = 'approved';
        else if (data.eventType.includes('rejected')) status = 'rejected';
      }
      
      let icon = FileText;
      let statusColor = 'blue';
      let title = `Document status updated`;
      
      // Handle different document status events
      if (status === 'approved') {
        icon = FileCheck;
        statusColor = 'green';
        title = `Document approved`;
      } else if (status === 'rejected') {
        icon = FileX;
        statusColor = 'red';
        title = `Document rejected`;
      }
      
      // Generate a unique ID that includes the status
      const notificationId = generateActivityId(`doc-${status}`, data);
      
      // Create notification object
      const notification = {
        id: notificationId,
        documentId: data._id || data.documentId,
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
      try {
        const storedDocuments = JSON.parse(localStorage.getItem('borrower_documents') || '[]');
        
        // For approval/rejection events, we want to avoid strict deduplication
        // to ensure these important notifications are shown
        if (status === 'approved' || status === 'rejected') {
          // Only check for exact duplicates by ID
          if (!storedDocuments.some(doc => doc.id === notification.id)) {
            storedDocuments.push(notification);
            localStorage.setItem('borrower_documents', JSON.stringify(storedDocuments));
            console.log(`ActivityManager: Saved document ${status} notification to localStorage`);
          } else {
            console.log(`ActivityManager: Skipping duplicate document ${status} notification (exact ID match)`);
          }
        } else {
          // For other status updates, use content-based deduplication
          const signature = `${title}-${documentName}`.toLowerCase().trim();
          
          if (!storedDocuments.some(doc => {
            const existingSignature = `${doc.title || ''}-${doc.description || ''}`.toLowerCase().trim();
            return existingSignature.includes(signature);
          })) {
            storedDocuments.push(notification);
            localStorage.setItem('borrower_documents', JSON.stringify(storedDocuments));
            console.log('ActivityManager: Saved document notification to localStorage');
          } else {
            console.log('ActivityManager: Skipping duplicate document notification');
          }
        }
      } catch (e) {
        console.error('ActivityManager: Failed to save document notification to localStorage', e);
      }
      
      return notification;
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
      'document-status', 
      'document_status_changed',
      'document-approved',
      'document_approved',
      'document-rejected',
      'document_rejected',
      'document_status_update',
      'milestone-completed', 
      'milestone_updated',
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
