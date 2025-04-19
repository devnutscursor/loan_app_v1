import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../../utils/formatters';

/**
 * ConversationList Component
 * 
 * Displays a list of user conversations with search and filtering capabilities.
 * Shows conversation preview with last message and unread indicators.
 */
const ConversationList = ({ 
  conversations, 
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  searchPlaceholder = 'Search conversations...'
}) => {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conversation.participant.name.toLowerCase().includes(query) ||
      conversation.lastMessage?.content.toLowerCase().includes(query) ||
      conversation.subject?.toLowerCase().includes(query)
    );
  });
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversationId) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId);
    }
  };
  
  // Format the date/time for display (relative time if recent)
  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // If today, show time
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday"
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    // If within the last week, show day name
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return formatDate(messageDate, { month: 'short', day: 'numeric' });
  };
  
  // Get avatar initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center space-x-3">
          <div className="rounded-full h-10 w-10 bg-gray-200 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mt-2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
      </svg>
      <p className="mt-4 text-gray-500 text-sm text-center">
        {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          renderLoadingSkeleton()
        ) : filteredConversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map(conversation => (
              <li
                key={conversation.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  activeConversationId === conversation.id ? 'bg-primary-50' : ''
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="px-4 py-4 flex items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mr-3 relative">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      conversation.participant.role === 'lender' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {getInitials(conversation.participant.name)}
                    </div>
                    
                    {/* Online status indicator */}
                    {conversation.participant.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                    )}
                  </div>
                  
                  {/* Conversation preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conversation.participant.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessage && formatMessageTime(conversation.lastMessage.timestamp)}
                      </p>
                    </div>
                    
                    {/* Loan subject or role */}
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.subject || conversation.participant.role.charAt(0).toUpperCase() + conversation.participant.role.slice(1)}
                    </p>
                    
                    {/* Last message preview */}
                    <div className="flex items-center">
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                      }`}>
                        {conversation.lastMessage 
                          ? (conversation.lastMessage.attachments?.length > 0 
                              ? `📎 ${conversation.lastMessage.content || 'Attachment'}`
                              : conversation.lastMessage.content)
                          : 'Start a conversation'}
                      </p>
                      
                      {/* Unread count badge */}
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-xs font-medium text-white">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      participant: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        isOnline: PropTypes.bool
      }).isRequired,
      lastMessage: PropTypes.shape({
        content: PropTypes.string,
        timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        attachments: PropTypes.array
      }),
      unreadCount: PropTypes.number,
      subject: PropTypes.string
    })
  ).isRequired,
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func,
  isLoading: PropTypes.bool,
  searchPlaceholder: PropTypes.string
};

export default ConversationList;
