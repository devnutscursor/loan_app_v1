import React, { useState } from "react";
import BorrowersSidebar from "./BorrowersSidebar";
import ChatHeader from "./ChatHeader";
import MessagesContainer from "./MessagesContainer";
import MessageInput from "./MessageInput";
import useLenderMessages from "../../../hooks/lender/useLenderMessages";

const LoanMessagesPanel = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    userData,
    conversations,
    selectedBorrower,
    messages,
    messageInput,
    attachments,
    isLoading,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    messageContainerRef,
    fileInputRef,
    selectBorrower,
    setMessageInput,
    handleFileChange,
    removeAttachment,
    openFileSelector,
    sendMessage,
    getSenderName,
    formatMessageTime,
    getTotalUnreadCount,
    getImageUrl,
  } = useLenderMessages();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden flex">
      <div
        className={`lg:hidden fixed inset-0 bg-black z-40 transition-all duration-300 ${
          isMobileSidebarOpen
            ? "opacity-40 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <BorrowersSidebar
        conversations={conversations}
        selectedBorrower={selectedBorrower}
        loadingConversations={loadingConversations}
        onSelectBorrower={selectBorrower}
        getTotalUnreadCount={getTotalUnreadCount}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-grow flex flex-col min-w-0">
        <div className="lg:hidden border-b p-3 flex items-center">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Open borrowers list"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-medium text-gray-800">Borrower Communications</p>
        </div>

        {selectedBorrower ? (
          <>
            <ChatHeader selectedBorrower={selectedBorrower} />
            <MessagesContainer
              messageContainerRef={messageContainerRef}
              loadingMessages={loadingMessages}
              messages={messages}
              userData={userData}
              getSenderName={getSenderName}
              formatMessageTime={formatMessageTime}
              getImageUrl={getImageUrl}
            />
            <MessageInput
              selectedBorrower={selectedBorrower}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              attachments={attachments}
              sendingMessage={sendingMessage}
              fileInputRef={fileInputRef}
              onSendMessage={sendMessage}
              onFileChange={handleFileChange}
              onOpenFileSelector={openFileSelector}
              onRemoveAttachment={removeAttachment}
            />
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500 text-sm">
            Select a borrower to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanMessagesPanel;

