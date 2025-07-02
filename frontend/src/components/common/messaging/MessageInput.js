import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * MessageInput Component
 * 
 * Input area for composing and sending messages with attachment support.
 * Features auto-expanding textarea and file upload capabilities.
 */
const MessageInput = ({ 
  onSendMessage, 
  onAddAttachment,
  onRemoveAttachment,
  placeholder = 'Type your message...',
  disabled = false,
  maxAttachments = 5,
  maxAttachmentSize = 10 // In MB
}) => {
  // State for message content
  const [messageContent, setMessageContent] = useState('');
  
  // State for attachments
  const [attachments, setAttachments] = useState([]);
  
  // State for upload progress
  const [isUploading, setIsUploading] = useState(false);
  
  // References
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Handle input change and auto-resize textarea
  const handleInputChange = (e) => {
    setMessageContent(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Check for max attachments
    if (attachments.length + files.length > maxAttachments) {
      alert(`You can only attach up to ${maxAttachments} files.`);
      return;
    }
    
    // Process each file
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxAttachmentSize * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the maximum size of ${maxAttachmentSize}MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setIsUploading(true);
    
    // In a real app, we would upload the files to a server here
    // For demo purposes, we'll create local URLs
    const newAttachments = validFiles.map(file => ({
      id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      progress: 100,
      url: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    
    // Clear the file input for future selections
    e.target.value = null;
    
    // Call the onAddAttachment callback if provided
    if (onAddAttachment) {
      newAttachments.forEach(attachment => {
        onAddAttachment(attachment);
      });
    }
  };
  
  // Handle removing an attachment
  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
    
    // Call the onRemoveAttachment callback if provided
    if (onRemoveAttachment) {
      onRemoveAttachment(attachmentId);
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle sending the message
  const handleSendMessage = () => {
    const trimmedContent = messageContent.trim();
    
    // Don't send empty messages unless there are attachments
    if (!trimmedContent && attachments.length === 0) return;
    
    // Call the onSendMessage callback
    onSendMessage({
      content: trimmedContent,
      attachments: attachments.map(attachment => attachment.file)
    });
    
    // Reset the input
    setMessageContent('');
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Send message on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Trigger file input click
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div 
              key={attachment.id} 
              className="flex items-center bg-gray-100 rounded-md p-2 pr-3"
            >
              {/* File type icon */}
              <svg className="h-5 w-5 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
              
              {/* File name and size */}
              <span className="text-xs text-gray-700 truncate max-w-[100px]">
                {attachment.name} ({attachment.size})
              </span>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Message input area */}
      <div className="flex items-end relative">
        <textarea
          ref={textareaRef}
          value={messageContent}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none min-h-[40px] max-h-[150px] pr-10"
          rows="1"
        />
        
        {/* Attachment button */}
        <button
          type="button"
          onClick={handleAttachmentClick}
          disabled={disabled || isUploading || attachments.length >= maxAttachments}
          className="absolute right-14 bottom-2.5 text-gray-400 hover:text-primary disabled:opacity-50 disabled:hover:text-gray-400"
          title="Attach file"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
          </svg>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
            disabled={disabled || isUploading || attachments.length >= maxAttachments}
          />
        </button>
        
        {/* Send button */}
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={disabled || isUploading || (!messageContent.trim() && attachments.length === 0)}
          className="ml-2 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:hover:bg-primary"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
      
      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
        {maxAttachments > 0 && (
          <span className="ml-2">
            • Max {maxAttachments} attachments ({maxAttachmentSize}MB each)
          </span>
        )}
      </div>
    </div>
  );
};

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onAddAttachment: PropTypes.func,
  onRemoveAttachment: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  maxAttachments: PropTypes.number,
  maxAttachmentSize: PropTypes.number
};

export default MessageInput;
