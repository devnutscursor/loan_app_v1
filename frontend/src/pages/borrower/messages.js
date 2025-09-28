import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LenderHeader from '../../components/borrower/messages/LenderHeader';
import MessageList from '../../components/borrower/messages/MessageList';
import MessageInput from '../../components/borrower/messages/MessageInput';
import HelpSection from '../../components/borrower/messages/HelpSection';
import { useMessages } from '../../hooks/useMessages';

/**
 * Borrower Messages Page
 *
 * A dedicated interface for borrowers to communicate with loan officers and other lenders.
 * Provides conversation management and messaging capabilities.
 */
const BorrowerMessages = () => {
  const {
    // State
    userData,
    isLoading,
    lender,
    messages,
    loadingMessages,
    messageInput,
    setMessageInput,
    sendingMessage,
    attachments,
    uploading,
    
    // Refs
    messageContainerRef,
    fileInputRef,
    
    // Handlers
    handleFileChange,
    removeAttachment,
    openFileSelector,
    sendMessage,
    
    // Utility functions
    getSenderName,
    formatMessageTime,
    hasImageAttachment,
    getImageUrl
  } = useMessages();

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Communicate with your loan officer and other lending team members
            </p>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex-grow flex flex-col">
            {/* Loading state */}
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100vh-120px)] flex flex-col">
                {/* Lender information */}
                <LenderHeader lender={lender} />

                {/* Messages container */}
                <div ref={messageContainerRef} className="flex-grow overflow-y-auto p-4">
                  <MessageList
                    messages={messages}
                    loadingMessages={loadingMessages}
                    userData={userData}
                    getSenderName={getSenderName}
                    formatMessageTime={formatMessageTime}
                    getImageUrl={getImageUrl}
                  />
                </div>

                {/* Message input */}
                <MessageInput
                  messageInput={messageInput}
                  setMessageInput={setMessageInput}
                  attachments={attachments}
                  removeAttachment={removeAttachment}
                  openFileSelector={openFileSelector}
                  sendMessage={sendMessage}
                  sendingMessage={sendingMessage}
                  lender={lender}
                  fileInputRef={fileInputRef}
                  handleFileChange={handleFileChange}
                />
              </div>
            )}

            {/* Help section */}
            <HelpSection />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default BorrowerMessages;