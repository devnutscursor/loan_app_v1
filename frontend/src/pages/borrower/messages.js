import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import MessageCenter from '../../components/common/messaging/MessageCenter';
import { borrowerService } from '../../services/api';

/**
 * Borrower Messages Page
 * 
 * A dedicated interface for borrowers to communicate with loan officers and other lenders.
 * Provides conversation management and messaging capabilities.
 */
const BorrowerMessages = () => {
  // State for user data
  const [userData, setUserData] = useState(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  
  // URL parameters
  const [initialConversationId, setInitialConversationId] = useState(null);
  
  // Load user data when component mounts
  useEffect(() => {
    // Get query parameters from URL
    const queryParams = new URLSearchParams(window.location.search);
    const conversationId = queryParams.get('conversation');
    
    if (conversationId) {
      setInitialConversationId(conversationId);
    }
    
    fetchUserData();
  }, []);
  
  // Fetch user data
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await borrowerService.getUserProfile();
      
      // For demo purposes, use mock data
      setTimeout(() => {
        const mockUserData = {
          id: 'user-1',
          name: 'Alex Rodriguez',
          email: 'alex.rodriguez@example.com',
          role: 'borrower'
        };
        
        setUserData(mockUserData);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Create a mock API service for the MessageCenter component
  const messagingApi = {
    getConversations: () => borrowerService.getConversations(),
    getMessages: (conversationId) => borrowerService.getMessages(conversationId),
    sendMessage: (conversationId, message) => borrowerService.sendMessage(conversationId, message),
    deleteMessage: (messageId) => borrowerService.deleteMessage(messageId)
  };
  
  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Communicate with your loan officer and other lending team members
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
                  userRole="borrower"
                  api={messagingApi}
                  initialConversationId={initialConversationId}
                />
              </div>
            )}
            
            {/* Help section */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Help & Support</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      If you have any questions about your loan application or need assistance, message your loan officer directly through this interface. They typically respond within 24 hours on business days.
                    </p>
                    <p className="mt-2">
                      For urgent matters, please call our customer support at <a href="tel:+18005551234" className="font-medium">1-800-555-1234</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default BorrowerMessages;
