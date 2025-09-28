import React from 'react';
import AttachmentPreview from './AttachmentPreview';

/**
 * Component for the message input area with text input, file attachments, and send button
 * Handles message composition and sending
 */
const MessageInput = ({
  messageInput,
  setMessageInput,
  attachments,
  removeAttachment,
  openFileSelector,
  sendMessage,
  sendingMessage,
  lender,
  fileInputRef,
  handleFileChange
}) => {
  const canSend = messageInput.trim() || attachments.length > 0;
  const isDisabled = !lender || sendingMessage;

  return (
    <div className="border-t p-4 bg-gray-50">
      <div className="flex flex-col">
        {/* Selected attachments preview */}
        <AttachmentPreview 
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
        />

        <div className="flex items-end bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-3 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
            style={{ minHeight: '60px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && lender) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isDisabled}
          />

          <div className="flex items-center h-full px-2 mb-3">
            {/* Attachment button */}
            <button
              onClick={openFileSelector}
              className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none transition-colors"
              title="Attach images"
              disabled={!lender || attachments.length >= 5 || sendingMessage}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Send button */}
            <button
              onClick={sendMessage}
              className={`ml-2 p-2 rounded-full ${
                !canSend || isDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } focus:outline-none transition-colors`}
              disabled={!canSend || isDisabled}
            >
              {sendingMessage ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={!lender || attachments.length >= 5 || sendingMessage}
        />
      </div>
    </div>
  );
};

export default MessageInput;
