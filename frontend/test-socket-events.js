const { io } = require('socket.io-client');

// Create a socket client to emit test events
const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

// Test events to emit
const events = [
  {
    name: 'new_lender_message',
    data: {
      _id: 'test-msg-' + Date.now(),
      sender: 'lender',
      senderName: 'Test Lender',
      content: 'This is a test message from a lender',
      timestamp: new Date().toISOString(),
      borrower: '123456789'  // Replace with actual borrower ID
    }
  },
  {
    name: 'milestone_updated',
    data: {
      title: 'Document Verification',
      milestoneName: 'Document Verification',
      description: 'Your documents have been verified successfully',
      loanId: '609c1b9f2b068e001f5c7308',
      timestamp: new Date().toISOString(),
      type: 'milestone'
    }
  },
  {
    name: 'document_requested',
    data: {
      documentName: 'Bank Statement',
      loanId: '609c1b9f2b068e001f5c7308',
      timestamp: new Date().toISOString(),
      type: 'document_request'
    }
  },
  {
    name: 'document_status_changed',
    data: {
      documentName: 'Identity Verification',
      status: 'approved',
      loanId: '609c1b9f2b068e001f5c7308',
      loanNumber: '2025061901',
      timestamp: new Date().toISOString(),
      type: 'document_status'
    }
  }
];

// Connect to socket
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
  
  // Send test events
  const sendTestEvents = async () => {
    for (const event of events) {
      console.log(`Emitting ${event.name} event...`);
      socket.emit(event.name, event.data);
      
      // Wait 2 seconds between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('All test events sent. Closing connection...');
    socket.disconnect();
  };
  
  // Start sending events after a short delay
  setTimeout(sendTestEvents, 1000);
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

console.log('Connecting to socket server...');
