import React from 'react';
import { useRouter } from 'next/router';
import { ChevronRight } from 'lucide-react';

const ActivityItem = ({ icon: Icon, title, time, status, statusColor, entityId, entityType, loanNumber, description, borrowerId }) => {
  const router = useRouter();
  
  // Handle click on activity item to navigate to related entity
  const handleActivityClick = () => {
    if (entityType === 'loan' && entityId) {
      if (status === 'Approved' || status === 'Rejected' || status === 'Correction') {
        // For document status changes, navigate to the documents tab
        router.push(`/lender/loans/${entityId}?tab=documents`);
      } else {
        router.push(`/lender/loans/${entityId}`);
      }
    } else if (entityType === 'borrower' && borrowerId) {
      // For message activities, navigate to the messages page with the specific borrower
      router.push(`/lender/messages?borrowerId=${borrowerId}`);
    }
  };
  
  return (
    <li className="py-3">
      <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${statusColor} bg-opacity-20`}>
          <Icon className={`h-4 w-4 ${statusColor.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500">{time}</p>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
        <div>
          <button
            onClick={handleActivityClick}
            className="flex items-center justify-center py-1 px-3 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            disabled={!entityId && !borrowerId}
          >
            View
            <ChevronRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
