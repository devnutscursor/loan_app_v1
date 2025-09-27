import React from 'react';

const ChatHeader = ({ selectedBorrower }) => {
  if (!selectedBorrower) return null;

  return (
    <div className="border-b p-4 flex items-center">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
        {selectedBorrower.user?.firstName?.[0] || 'B'}
      </div>
      <div className="ml-3">
        <p className="font-medium text-gray-900">
          {selectedBorrower.user?.firstName} {selectedBorrower.user?.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {selectedBorrower.user?.email}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
