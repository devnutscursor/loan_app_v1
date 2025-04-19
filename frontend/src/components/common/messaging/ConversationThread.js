import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import MessageItem from './MessageItem';

/**
 * ConversationThread Component
 * 
 * Displays a scrollable list of messages in a conversation thread.
 * Automatically scrolls to newest messages and groups messages by sender.
 */
const ConversationThread = ({ 
  messages, 
  currentUserId, 
  isLoading = false,
  onDeleteMessage = null,
  emptyStateMessage = 'No messages yet. Start the conversation!'
}) => {
  // Reference to message container for auto-scrolling
  const messageEndRef = useRef(null);
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Group consecutive messages from the same sender
  const groupedMessages = messages.reduce((acc, message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isSameSender = prevMessage && prevMessage.sender.id === message.sender.id;
    
    // Determine if this message should show avatar (not consecutive from same sender)
    const showAvatar = !isSameSender;
    
    acc.push({
      ...message,
      showAvatar
    });
    
    return acc;
  }, []);
  
  // Check if user is sender of a message
  const isSender = (message) => message.sender.id === currentUserId;
  
  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  };
  
  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4 py-4">
      <div className="flex justify-start">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="ml-3 max-w-md">
          <div className="rounded-lg h-20 w-48 bg-gray-200 animate-pulse"></div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-md">
          <div className="rounded-lg h-16 w-64 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="ml-3 h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
      <div className="flex justify-start">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="ml-3 max-w-md">
          <div className="rounded-lg h-24 w-56 bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
      </svg>
      <p className="mt-4 text-gray-500 text-sm text-center">
        {emptyStateMessage}
      </p>
    </div>
  );
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {isLoading ? (
        renderLoadingSkeleton()
      ) : messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {groupedMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSender={isSender(message)}
              showAvatar={message.showAvatar}
              onDelete={isSender(message) ? handleDeleteMessage : null}
            />
          ))}
          <div ref={messageEndRef} />
        </>
      )}
    </div>
  );
};

ConversationThread.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      sender: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        role: PropTypes.string
      }).isRequired,
      attachments: PropTypes.arrayOf(PropTypes.shape({
        fileName: PropTypes.string.isRequired,
        fileUrl: PropTypes.string.isRequired,
        fileSize: PropTypes.string
      }))
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  onDeleteMessage: PropTypes.func,
  emptyStateMessage: PropTypes.string
};

export default ConversationThread;
