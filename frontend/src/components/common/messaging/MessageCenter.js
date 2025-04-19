import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';
import MessageInput from './MessageInput';
import { MessageService } from '../../../services';

/**
 * MessageCenter Component
 * 
 * Main container for the messaging system that integrates all messaging components.
 * Handles conversation selection, message sending, and overall messaging UI.
 */
const MessageCenter = ({ 
  userId, 
  userRole, 

  initialConversationId = null,
  showSidebar = true,
  sidebarWidth = 320
}) => {
  // State for conversations
  const [conversations, setConversations] = useState([]);
  
  // State for loading conversations
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  // State for active conversation
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  
  // State for active conversation messages
  const [messages, setMessages] = useState([]);
  
  // State for loading messages
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // State for mobile view (responsive layout)
  const [isMobileView, setIsMobileView] = useState(false);
  
  // State for showing conversation list on mobile
  const [showConversationList, setShowConversationList] = useState(!initialConversationId);
  
  // Load conversations when component mounts
  useEffect(() => {
    fetchConversations();
    
    // Set up responsive layout
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize(); // Call once to set initial state
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      
      // On mobile, hide conversation list when a conversation is selected
      if (isMobileView) {
        setShowConversationList(false);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);
  
  // Fetch all conversations
  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await MessageService.getConversations();
      
      if (response.success) {
        // Format the conversations for our UI
        const formattedConversations = response.data.map(conv => ({
          id: conv._id,
          participant: {
            id: conv.participants.find(p => p._id !== userId)?._id || '',
            name: formatParticipantName(conv.participants.find(p => p._id !== userId)),
            role: conv.participants.find(p => p._id !== userId)?.role || '',
            isOnline: false, // Would need a separate online status service
            profilePicture: conv.participants.find(p => p._id !== userId)?.profilePicture
          },
          lastMessage: {
            content: conv.lastMessage?.content || 'Start a conversation',
            timestamp: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
            attachments: conv.lastMessage?.attachments || []
          },
          unreadCount: conv.unreadCountByUser.find(u => u.user === userId)?.count || 0,
          subject: getConversationSubject(conv)
        }));
        
        setConversations(formattedConversations);
        
        // If there's an initial conversation ID, select it
        if (initialConversationId) {
          const exists = formattedConversations.some(conv => conv.id === initialConversationId);
          if (exists) {
            setActiveConversationId(initialConversationId);
          }
        }
      } else {
        toast.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };
  
  // Helper to format participant name
  const formatParticipantName = (participant) => {
    if (!participant) return 'Unknown User';
    return `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email || 'Unknown User';
  };
  
  // Helper to get conversation subject
  const getConversationSubject = (conversation) => {
    if (conversation.title) return conversation.title;
    if (conversation.loan) {
      return `${conversation.loan.loanType || 'Loan'} #${conversation.loan.loanNumber || conversation.loan._id}`;
    }
    return 'New Conversation';
  };
  
  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    setIsLoadingMessages(true);
    try {
      const response = await MessageService.getMessages(conversationId);
      
      if (response.success) {
        // Format the messages for our UI
        const formattedMessages = response.data.map(msg => ({
          id: msg._id,
          senderId: msg.sender._id,
          senderName: `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() || msg.sender.email || 'Unknown User',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          attachments: msg.attachments.map(att => ({
            id: att._id,
            name: att.fileName,
            size: formatFileSize(att.fileSize),
            type: att.fileType,
            url: att.fileUrl
          }))
        }));
        
        // Mark conversation as read
        await MessageService.markAsRead(conversationId);
        
        // Update unread count in conversations list
        const updatedConversations = conversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        });
        setConversations(updatedConversations);
        
        setMessages(formattedMessages);
      } else {
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
  };
  
  // Handle sending a message
  const handleSendMessage = async (messageData) => {
    try {
      const response = await MessageService.sendMessage(
        activeConversationId,
        messageData.content,
        messageData.attachments || []
      );
      
      if (response.success) {
        // Format the new message for UI
        const newMessage = {
          id: response.data._id,
          senderId: response.data.sender._id,
          senderName: `${response.data.sender.firstName || ''} ${response.data.sender.lastName || ''}`.trim() || response.data.sender.email || 'You',
          content: response.data.content,
          timestamp: new Date(response.data.createdAt),
          attachments: response.data.attachments.map(att => ({
            id: att._id,
            name: att.fileName,
            size: formatFileSize(att.fileSize),
            type: att.fileType,
            url: att.fileUrl
          }))
        };
        
        // Add to messages
        setMessages([...messages, newMessage]);
        
        // Update last message in conversation list
        const updatedConversations = conversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv, 
              lastMessage: {
                content: messageData.content,
                timestamp: new Date(),
                attachments: messageData.attachments || []
              }
            };
          }
          return conv;
        });
        setConversations(updatedConversations);
        
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  // Handle deleting a message (currently not supported by the API)
  const handleDeleteMessage = async (messageId) => {
    toast.error('Message deletion is not yet supported');
    // If we implement message deletion in the future, we would call the API here
  };
  
  // Toggle conversation list on mobile
  const toggleConversationList = () => {
    setShowConversationList(prev => !prev);
  };
  
  // Find the active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId);
  
  return (
    <div className="h-full flex overflow-hidden">
      {/* Conversation list sidebar (hidden on mobile when viewing a conversation) */}
      {(showSidebar && (!isMobileView || showConversationList)) && (
        <div 
          className={`flex flex-col border-r border-gray-200 bg-white ${
            isMobileView ? 'w-full absolute inset-0 z-10' : `w-${sidebarWidth}px flex-shrink-0`
          }`}
        >
          {/* Mobile header with back button */}
          {isMobileView && activeConversationId && (
            <div className="px-4 py-3 border-b border-gray-200 flex items-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={toggleConversationList}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="ml-3 text-lg font-medium text-gray-900">Messages</h2>
            </div>
          )}
          
          {/* Conversation list */}
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>
      )}
      
      {/* Message area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Conversation header */}
        {activeConversation ? (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            {/* Mobile back button */}
            {isMobileView && showSidebar && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 mr-2"
                onClick={toggleConversationList}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            )}
            
            {/* Conversation participant info */}
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                activeConversation.participant.role === 'lender' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {activeConversation.participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">
                  {activeConversation.participant.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeConversation.subject || 
                   `${activeConversation.participant.role.charAt(0).toUpperCase()}${activeConversation.participant.role.slice(1)}`}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center">
              {activeConversation.participant.role === 'borrower' && userRole === 'lender' && (
                <a
                  href={`/lender/applications?borrower=${activeConversation.participant.id}`}
                  className="text-gray-500 hover:text-gray-700 mr-3"
                  title="View applications"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
              )}
              
              {activeConversation.participant.role === 'lender' && userRole === 'borrower' && (
                <a
                  href="/borrower/milestones"
                  className="text-gray-500 hover:text-gray-700 mr-3"
                  title="View milestones"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
            {/* Mobile menu button */}
            {isMobileView && showSidebar && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 mr-2"
                onClick={toggleConversationList}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            )}
            
            <h2 className="text-lg font-medium text-gray-900">Messages</h2>
          </div>
        )}
        
        {/* Messages container */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {!activeConversationId || (!showConversationList && isMobileView) ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              <p className="mt-4 text-gray-500 text-center">
                {!activeConversationId 
                  ? 'Select a conversation to view messages' 
                  : 'No messages to display'}
              </p>
            </div>
          ) : (
            <>
              {/* Message thread */}
              <ConversationThread
                messages={messages}
                currentUserId={userId}
                isLoading={isLoadingMessages}
                onDeleteMessage={handleDeleteMessage}
              />
              
              {/* Message input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isLoadingMessages}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

MessageCenter.propTypes = {
  userId: PropTypes.string.isRequired,
  userRole: PropTypes.oneOf(['borrower', 'lender', 'admin']).isRequired,

  initialConversationId: PropTypes.string,
  showSidebar: PropTypes.bool,
  sidebarWidth: PropTypes.number
};

export default MessageCenter;
