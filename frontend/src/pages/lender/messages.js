import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import MessageCenter from '../../components/common/messaging/MessageCenter';
import { lenderService } from '../../services/api';

/**
 * Lender Messages Page
 * 
 * A dedicated interface for lenders to communicate with borrowers and other team members.
 * Provides conversation management, messaging capabilities, and integration with loan information.
 */
const LenderMessages = () => {
  // State for user data
  const [userData, setUserData] = useState(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  
  // URL parameters
  const [initialConversationId, setInitialConversationId] = useState(null);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  
  // Load user data when component mounts
  useEffect(() => {
    // Get query parameters from URL
    const queryParams = new URLSearchParams(window.location.search);
    const conversationId = queryParams.get('conversation');
    const borrowerId = queryParams.get('borrowerId');
    
    if (conversationId) {
      setInitialConversationId(conversationId);
    }
    
    if (borrowerId) {
      setSelectedBorrowerId(borrowerId);
    }
    
    fetchUserData();
  }, []);
  
  // Fetch user data
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await lenderService.getUserProfile();
      
      // For demo purposes, use mock data
      setTimeout(() => {
        const mockUserData = {
          id: 'user-4',
          name: 'Michael Chen',
          email: 'michael.chen@lendingcompany.com',
          role: 'lender',
          title: 'Senior Loan Officer'
        };
        
        setUserData(mockUserData);
        setIsLoading(false);
        
        // If borrowerId is set but no conversation, find or create one
        if (selectedBorrowerId && !initialConversationId) {
          findOrCreateConversation(selectedBorrowerId);
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Find or create a conversation with a borrower
  const findOrCreateConversation = async (borrowerId) => {
    try {
      // In a real app, this would be an API call
      // const response = await lenderService.findOrCreateConversation(borrowerId);
      // setInitialConversationId(response.conversationId);
      
      // For demo purposes, simulate finding a conversation
      // This would typically search existing conversations or create a new one
      console.log(`Finding or creating conversation with borrower ${borrowerId}`);
      
      // Simulate finding conversation ID for borrower ID user-2
      if (borrowerId === 'user-2') {
        setInitialConversationId('conv-1');
      } else if (borrowerId === 'user-3') {
        setInitialConversationId('conv-2');
      }
      
      // In a real app, if no conversation exists, you would create one
    } catch (error) {
      console.error('Error finding or creating conversation:', error);
      toast.error('Failed to initiate conversation. Please try again later.');
    }
  };
  
  // Create a mock API service for the MessageCenter component
  const messagingApi = {
    getConversations: () => lenderService.getConversations(),
    getMessages: (conversationId) => lenderService.getMessages(conversationId),
    sendMessage: (conversationId, message) => lenderService.sendMessage(conversationId, message),
    deleteMessage: (messageId) => lenderService.deleteMessage(messageId)
  };
  
  return (
    <ProtectedRoute allowedRoles={['lender', 'admin']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Borrower Communications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage communications with loan applicants and borrowers
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex-grow flex flex-col">
            {/* Loading state */}
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100vh-220px)]">
                <MessageCenter
                  userId={userData?.id}
                  userRole="lender"
                  api={messagingApi}
                  initialConversationId={initialConversationId}
                />
              </div>
            )}
            
            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Communication guidelines */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Guidelines</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Respond to all borrower messages within 24 business hours</li>
                  <li>Use templates for common responses to maintain consistency</li>
                  <li>Inform borrowers about document requirements with detailed instructions</li>
                  <li>Update borrowers on status changes promptly</li>
                  <li>Maintain professional tone in all communications</li>
                </ul>
              </div>
              
              {/* Message templates */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Templates</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // In a real app, this would insert the template into the message input
                      toast.success('Template copied to clipboard');
                    }}
                    className="text-left px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    <span className="block font-medium text-gray-700">Application Received</span>
                    <span className="block text-xs text-gray-500 truncate">Thank you for your application. I'll be your dedicated loan officer...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Template copied to clipboard');
                    }}
                    className="text-left px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    <span className="block font-medium text-gray-700">Document Request</span>
                    <span className="block text-xs text-gray-500 truncate">To proceed with your application, we need the following documents...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Template copied to clipboard');
                    }}
                    className="text-left px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    <span className="block font-medium text-gray-700">Application Approved</span>
                    <span className="block text-xs text-gray-500 truncate">Great news! Your loan application has been approved...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderMessages;
