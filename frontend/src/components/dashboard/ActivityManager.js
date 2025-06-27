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
      return {
        id: generateActivityId('msg', data),
        icon: MessageSquare,
        title: `New message from ${data.senderName || data.sender?.firstName || 'Lender'}`,
        description: data.content?.substring(0, 40) + (data.content?.length > 40 ? '...' : '') || 'You have a new message',
        time: 'Just now',
        status: 'New',
        statusColor: 'blue',
        entityType: 'message',
        url: '/borrower/messages',
        timestamp: data.timestamp || new Date().toISOString(),
        persistent: true
      };
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
    };
    
    // Register socket event listeners
    const listenerKey = `borrower-${userId}`;
    socketService.addMessageListener(listenerKey, processNotificationEvent);
    
    // Test function to manually trigger document notifications
    const testDocumentNotifications = () => {
      console.log('ActivityManager: Testing document notifications...');
      
      // Test document request notification
      const documentRequestData = {
        type: 'document-request',
        documentName: 'Bank Statement',
        documentType: 'Bank Statement',
        category: 'Financial',
        description: 'Please upload your most recent bank statement',
        loanId: '609c1b9f2b068e001f5c7308',
        loanNumber: '2025061901',
        borrowerId: userId,
        requestedBy: 'lender-123',
        timestamp: new Date().toISOString()
      };
      
      // Test document status notification
      const documentStatusData = {
        type: 'document-status',
        documentName: 'Driver License',
        documentType: 'Driver License',
        status: 'approved',
        previousStatus: 'pending',
        loanId: '609c1b9f2b068e001f5c7308',
        loanNumber: '2025061901',
        borrowerId: userId,
        reviewedBy: 'lender-123',
        notes: 'Document approved successfully',
        timestamp: new Date().toISOString()
      };
      
      // Process the test notifications
      processNotificationEvent(documentRequestData);
      
      // Wait 1 second before sending the second notification
      setTimeout(() => {
        processNotificationEvent(documentStatusData);
      }, 1000);
    };
    
    // Wait 2 seconds after component mount to trigger the test
    const timer = setTimeout(() => {
      testDocumentNotifications();
    }, 2000);
    
    // Clean up on unmount
    return () => {
      console.log('ActivityManager: Cleaning up socket listeners');
      socketService.removeMessageListener(listenerKey);
      clearTimeout(timer);
      setIsConnected(false);
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
