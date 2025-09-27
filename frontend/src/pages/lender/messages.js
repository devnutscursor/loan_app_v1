import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import BorrowersSidebar from '../../components/lender/messages/BorrowersSidebar';
import ChatHeader from '../../components/lender/messages/ChatHeader';
import MessagesContainer from '../../components/lender/messages/MessagesContainer';
import MessageInput from '../../components/lender/messages/MessageInput';
import TemplatesSection from '../../components/lender/messages/TemplatesSection';
import GuidelinesSection from '../../components/lender/messages/GuidelinesSection';
import useLenderMessages from '../../hooks/lender/useLenderMessages';

/**
 * Lender Messages Page
 * 
 * A dedicated interface for lenders to communicate with borrowers and other team members.
 * Provides conversation management, messaging capabilities, and integration with loan information.
 */
const LenderMessages = () => {
  const {
    // Data
    userData,
    conversations,
    selectedBorrower,
    messages,
    messageInput,
    attachments,
    customTemplates,
    editingTemplate,
    selectedTemplateCategory,
    showCustomTemplateForm,
    
    // Loading states
    isLoading,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    uploading,
    
    // Refs
    messageContainerRef,
    fileInputRef,
    
    // Event handlers
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
    handleTemplateSelect,
    handleCustomTemplateSave,
    handleCustomTemplateCancel,
    handleCustomTemplateEdit,
    handleCustomTemplateDelete,
    getAllTemplatesGroupedByCategory,
    
    // Template state handlers
    setSelectedTemplateCategory,
    setShowCustomTemplateForm
  } = useLenderMessages();
  
  return (
    <ProtectedRoute allowedRoles={['lender', 'admin']}>
      <MainLayout>
        <div className="py-6 h-full flex flex-col">
          <div className="px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Borrower Communications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage communications with loan applicants and borrowers
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex-grow flex flex-col">
            {/* Loading state */}
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100vh-10px)] flex">
                <BorrowersSidebar
                  conversations={conversations}
                  selectedBorrower={selectedBorrower}
                  loadingConversations={loadingConversations}
                  onSelectBorrower={selectBorrower}
                  getTotalUnreadCount={getTotalUnreadCount}
                />
                
                {/* Chat area */}
                <div className="flex-grow flex flex-col">
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
                    <div className="flex-grow flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p>Select a borrower to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <GuidelinesSection />
              
              <TemplatesSection
                selectedBorrower={selectedBorrower}
                showCustomTemplateForm={showCustomTemplateForm}
                setShowCustomTemplateForm={setShowCustomTemplateForm}
                editingTemplate={editingTemplate}
                selectedTemplateCategory={selectedTemplateCategory}
                setSelectedTemplateCategory={setSelectedTemplateCategory}
                getAllTemplatesGroupedByCategory={getAllTemplatesGroupedByCategory}
                handleTemplateSelect={handleTemplateSelect}
                handleCustomTemplateSave={handleCustomTemplateSave}
                handleCustomTemplateCancel={handleCustomTemplateCancel}
                handleCustomTemplateEdit={handleCustomTemplateEdit}
                handleCustomTemplateDelete={handleCustomTemplateDelete}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderMessages;
