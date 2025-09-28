import React from 'react';
import { ImageViewer } from '../../common';

/**
 * Component for displaying individual messages in the chat
 * Handles both text and image attachments with proper styling
 */
const MessageItem = ({ 
  message, 
  isSender, 
  senderName, 
  formatMessageTime, 
  getImageUrl 
}) => {
  return (
    <div
      className={`flex w-full ${isSender ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex flex-col max-w-[75%] ${isSender ? 'items-start' : 'items-end'}`}>
        {/* Sender name */}
        <div className={`text-xs text-gray-500 mb-1 ${isSender ? 'text-left' : 'text-right'}`}>
          {senderName}
        </div>

        {/* Message content */}
        <div
          className={`rounded-lg px-4 py-2 break-words ${
            isSender 
              ? 'bg-gray-200 text-black rounded-tl-none' 
              : 'bg-blue-500 text-white rounded-tr-none'
          }`}
        >
          {message.content && <p>{message.content}</p>}

          {/* Image attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 grid gap-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  {attachment.fileType.startsWith('image/') ? (
                    <ImageViewer
                      src={getImageUrl(attachment)}
                      alt={attachment.fileName}
                      className="max-w-[250px] rounded"
                    />
                  ) : (
                    <div className="p-2 border rounded bg-gray-50 text-sm flex items-center">
                      <svg className="h-5 w-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <a
                        href={getImageUrl(attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {attachment.fileName}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className={`text-xs mt-1 ${isSender ? 'text-gray-500' : 'text-gray-200'}`}>
            {formatMessageTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
