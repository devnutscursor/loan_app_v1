import React from 'react';

/**
 * MilestoneTimeline Component
 * 
 * Displays a timeline of loan application milestones with their current status
 */
export const MilestoneTimeline = ({ milestones = [] }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1;
          
          // Determine the status color
          let statusColor = 'gray';
          if (milestone.status === 'completed') statusColor = 'green';
          else if (milestone.status === 'current') statusColor = 'blue';
          else if (milestone.status === 'pending') statusColor = 'gray';
          
          return (
            <li key={milestone.id || index}>
              <div className="relative pb-8">
                {!isLast && (
                  <span 
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white bg-${statusColor}-100`}>
                      {milestone.status === 'completed' ? (
                        <svg className={`h-5 w-5 text-${statusColor}-600`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : milestone.status === 'current' ? (
                        <svg className={`h-5 w-5 text-${statusColor}-600`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className={`h-2 w-2 rounded-full bg-${statusColor}-400`} />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium text-gray-800`}>
                        {milestone.name}
                      </p>
                      {milestone.date && (
                        <p className="text-sm text-gray-500">
                          {new Date(milestone.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {milestone.status}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MilestoneTimeline;
