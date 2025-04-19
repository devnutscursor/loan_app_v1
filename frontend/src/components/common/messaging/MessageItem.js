import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../../utils/formatters';

/**
 * MessageItem Component
 * 
 * Displays an individual message in a conversation thread.
 * Handles both sent and received messages with appropriate styling.
 */
const MessageItem = ({ 
  message, 
  isSender = false, 
  showAvatar = true,
  onDelete = null
}) => {
  // Determine message position and styling based on sender
  const messagePosition = isSender ? 'justify-end' : 'justify-start';
  const messageBg = isSender ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800';
  const messageArrow = isSender ? 'right-0' : 'left-0';
  
  // Format timestamp for display
  const formattedTime = formatDate(message.timestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get avatar initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format display for attachments if any
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, idx) => (
          <div 
            key={`attach-${idx}`} 
            className="flex items-center p-2 rounded bg-white border border-gray-200"
          >
            {/* File type icon */}
            {getFileIcon(attachment.fileName)}
            
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {attachment.fileSize}
              </p>
            </div>
            
            <a 
              href={attachment.fileUrl} 
              download
              className="ml-2 p-1 text-primary hover:text-primary-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    );
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="h-6 w-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <div className={`flex ${messagePosition} mb-4 group`}>
      {/* Avatar for sender (only shown if not the current user) */}
      {!isSender && showAvatar && (
        <div className="flex-shrink-0 mr-3">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            {getInitials(message.sender.name)}
          </div>
        </div>
      )}
      
      {/* Message content */}
      <div className="relative max-w-md">
        {/* Delete button (only visible on hover and for sender's messages) */}
        {isSender && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="absolute top-0 right-0 -mt-2 -mr-2 hidden group-hover:block bg-white rounded-full p-1 shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 focus:outline-none"
            aria-label="Delete message"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Main message bubble */}
        <div 
          className={`relative rounded-lg px-4 py-2 ${messageBg} shadow-sm`}
          style={{borderRadius: isSender ? '0.75rem 0.75rem 0.25rem 0.75rem' : '0.75rem 0.75rem 0.75rem 0.25rem'}}
        >
          {/* Sender name - only show for received messages */}
          {!isSender && (
            <div className="font-medium text-xs text-gray-600 mb-1">
              {message.sender.name}
            </div>
          )}
          
          {/* Message content */}
          <div className="text-sm break-words">{message.content}</div>
          
          {/* Attachments if any */}
          {renderAttachments()}
          
          {/* Message timestamp */}
          <div className="text-xs text-gray-500 mt-1 text-right">
            {formattedTime}
          </div>
        </div>
      </div>
      
      {/* Avatar for current user (only shown at end of message) */}
      {isSender && showAvatar && (
        <div className="flex-shrink-0 ml-3">
          <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-sm font-medium text-primary-800">
            {getInitials(message.sender.name)}
          </div>
        </div>
      )}
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
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
  }).isRequired,
  isSender: PropTypes.bool,
  showAvatar: PropTypes.bool,
  onDelete: PropTypes.func
};

export default MessageItem;
