import React from 'react';

const BorrowersSidebar = ({
  conversations,
  selectedBorrower,
  loadingConversations,
  onSelectBorrower,
  getTotalUnreadCount
}) => {
  return (
    <div className="w-80 border-r overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-medium text-lg">Borrowers</h2>
        <p className="text-sm text-gray-500">
          {getTotalUnreadCount()} unread messages
        </p>
      </div>
      
      {loadingConversations ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No borrowers found
        </div>
      ) : (
        <div>
          {conversations.map((conversation) => (
            <div 
              key={conversation.borrower._id}
              onClick={() => onSelectBorrower(conversation.borrower)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedBorrower?._id === conversation.borrower._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                    {conversation.borrower.user?.firstName?.[0] || 'B'}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {conversation.borrower.user?.firstName} {conversation.borrower.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {conversation.latestMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <div className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BorrowersSidebar;
