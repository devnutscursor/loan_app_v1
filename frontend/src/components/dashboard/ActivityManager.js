// ActivityManager.js
import { useEffect, useState } from 'react';
import socketService from '../../services/socket.service';
import { toast } from 'react-hot-toast';
import { MessageSquare, CheckCircle, FilePlus, FileX, FileCheck } from 'lucide-react';

const ActivityManager = ({ userId, updateActivities }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    console.log('ActivityManager: Initializing with userId', userId);
    
    // Connect to socket
    const socket = socketService.connect();
    
    // Join user's room
    socketService.joinRoom(userId);
    console.log('ActivityManager: Joined room', userId);
    
    // Log connection status
    socket.on('connect', () => {
      console.log('ActivityManager: Socket connected with ID', socket.id);
      setIsConnected(true);
    });
    
    // Handle direct message events
    const handleReceiveMessage = (message) => {
      console.log('ActivityManager: Received direct message', message);
      
      const newActivity = {
        id: `msg-${Date.now()}`,
        icon: MessageSquare,
        title: `New message from ${message.senderName || 'Lender'}`,
        description: message.content?.substring(0, 30) || 'You have a new message',
        time: 'Just now',
        status: 'New',
        statusColor: 'bg-blue-500',
        entityType: 'message',
        url: '/borrower/messages'
      };
      
      updateActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 4)]);
      toast.success('New message from lender');
    };
    
    // Handle milestone updates
    const handleMilestoneUpdate = (data) => {
      console.log('ActivityManager: Milestone updated', data);
      
      const newActivity = {
        id: `milestone-${Date.now()}`,
        icon: CheckCircle,
        title: `Milestone completed: ${data.title || data.milestoneName || 'Loan milestone'}`,
        description: data.description || 'A loan milestone has been updated',
        time: 'Just now',
        status: 'Completed',
        statusColor: 'bg-green-500',
        entityId: data.loanId,
        entityType: 'loan',
        url: `/borrower/loans/${data.loanId}?tab=milestones`
      };
      
      updateActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 4)]);
      toast.success('Milestone completed');
    };
    
    // Handle document requests
    const handleDocumentRequest = (data) => {
      console.log('ActivityManager: Document requested', data);
      
      const newActivity = {
        id: `doc-${Date.now()}`,
        icon: FilePlus,
        title: `New document requested`,
        description: data.documentName || 'A document has been requested',
        time: 'Just now',
        status: 'Required',
        statusColor: 'bg-yellow-500',
        entityId: data.loanId,
        entityType: 'loan',
        url: `/borrower/loans/${data.loanId}?tab=documents`
      };
      
      updateActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 4)]);
      toast.success('New document requested');
    };
    
    // Handle document statuses
    const handleDocumentStatus = (data) => {
      console.log('ActivityManager: Document status changed', data);
      
      const isApproved = data.status?.toLowerCase() === 'approved';
      
      const newActivity = {
        id: `doc-status-${Date.now()}`,
        icon: isApproved ? FileCheck : FileX,
        title: `Document ${isApproved ? 'approved' : 'rejected'} for loan #${data.loanNumber || data.id}`,
        description: data.documentName || 'Document status updated',
        time: 'Just now',
        status: isApproved ? 'Approved' : 'Rejected',
        statusColor: isApproved ? 'bg-green-500' : 'bg-red-500',
        entityId: data.loanId,
        entityType: 'loan',
        url: `/borrower/loans/${data.loanId}?tab=documents`
      };
      
      updateActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 4)]);
      toast.success(`Document ${isApproved ? 'approved' : 'rejected'}`);
    };
    
    // Register direct event listeners to be more specific than the general message listener
    socket.on('receive_message', handleReceiveMessage);
    socket.on('milestone_updated', handleMilestoneUpdate);
    socket.on('document_requested', handleDocumentRequest);
    socket.on('document_status_changed', handleDocumentStatus);
    socket.on('new_lender_message', handleReceiveMessage);
    
    // Clean up on unmount
    return () => {
      console.log('ActivityManager: Cleaning up socket listeners');
      if (socket) {
        socket.off('connect');
        socket.off('receive_message', handleReceiveMessage);
        socket.off('milestone_updated', handleMilestoneUpdate);
        socket.off('document_requested', handleDocumentRequest);
        socket.off('document_status_changed', handleDocumentStatus);
        socket.off('new_lender_message', handleReceiveMessage);
      }
      setIsConnected(false);
    };
  }, [userId, updateActivities]);

  // For production, return null as this is a non-UI component
  // For debugging, uncomment the following to see connection status:
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
