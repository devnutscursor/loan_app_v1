import React from 'react';
import MessageItem from './MessageItem';

/**
 * Component for displaying the list of messages in the chat
 * Handles loading states and empty states
 */
const MessageList = ({ 
  messages, 
  loadingMessages, 
  userData, 
  getSenderName, 
  formatMessageTime, 
  getImageUrl 
}) => {
  if (loadingMessages) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isSender = message.sender._id !== userData.data.user?._id;
        const senderName = getSenderName(message);

        return (
          <MessageItem
            key={message._id}
            message={message}
            isSender={isSender}
            senderName={senderName}
            formatMessageTime={formatMessageTime}
            getImageUrl={getImageUrl}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
