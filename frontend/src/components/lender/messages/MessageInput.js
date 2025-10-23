import React from 'react';

const MessageInput = ({
  selectedBorrower,
  messageInput,
  setMessageInput,
  attachments,
  sendingMessage,
  fileInputRef,
  onSendMessage,
  onFileChange,
  onOpenFileSelector,
  onRemoveAttachment
}) => {
  return (
    <div className="border-t p-3 lg:p-4 bg-gray-50">
      <div className="flex flex-col">
        {/* Selected attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 bg-white rounded-lg p-2 shadow-sm">
            <div className="flex overflow-x-auto space-x-2 lg:space-x-3 pb-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={attachment.preview}
                    alt="Selected"
                    className="h-12 w-12 lg:h-16 lg:w-16 object-cover rounded-md border border-gray-200"
                  />
                  <button 
                    onClick={() => onRemoveAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-sm hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-end bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 lg:p-3 focus:outline-none resize-none min-h-[56px] max-h-[120px] text-sm lg:text-base"
            style={{ minHeight: '60px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && selectedBorrower) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            disabled={!selectedBorrower || sendingMessage}
          />
          
          <div className="flex items-center h-full px-2 mb-3">
            {/* Attachment button */}
            <button
              onClick={onOpenFileSelector}
              className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none transition-colors"
              title="Attach images"
              disabled={!selectedBorrower || attachments.length >= 5 || sendingMessage}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            {/* Send button */}
            <button
              onClick={onSendMessage}
              className={`ml-2 p-2 rounded-full ${
                !messageInput.trim() && attachments.length === 0 || !selectedBorrower || sendingMessage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } focus:outline-none transition-colors`}
              disabled={(!messageInput.trim() && attachments.length === 0) || !selectedBorrower || sendingMessage}
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
          onChange={onFileChange}
          disabled={!selectedBorrower || attachments.length >= 5 || sendingMessage}
        />
      </div>
    </div>
  );
};

export default MessageInput;
