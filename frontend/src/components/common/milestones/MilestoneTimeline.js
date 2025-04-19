import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Milestone from './Milestone';

/**
 * MilestoneTimeline Component
 * 
 * Displays a series of milestones in a timeline format with
 * visual connections between milestones and responsive behavior.
 */
const MilestoneTimeline = ({ 
  milestones, 
  orientation = 'horizontal',
  expandedByDefault = false,
  onMilestoneClick
}) => {
  // Track which milestone is expanded (for mobile/vertical view)
  const [expandedIndex, setExpandedIndex] = useState(
    expandedByDefault ? 
      milestones.findIndex(m => m.status === 'current') || 0 
      : -1
  );

  // Calculate various states about the timeline
  const currentIndex = milestones.findIndex(m => m.status === 'current');
  const hasCurrentMilestone = currentIndex !== -1;
  const allCompleted = milestones.every(m => m.status === 'completed');

  // Handle milestone click to expand/collapse details
  const handleMilestoneClick = (index) => {
    // For handler from parent
    if (onMilestoneClick) {
      onMilestoneClick(milestones[index], index);
    }
    
    // For internal state (mobile/vertical expand/collapse)
    if (orientation === 'vertical') {
      setExpandedIndex(expandedIndex === index ? -1 : index);
    }
  };

  return (
    <div className="w-full">
      {/* Progress summary - shown at the top */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan Progress</h3>
          <p className="text-sm text-gray-500">
            {allCompleted 
              ? 'All milestones completed' 
              : hasCurrentMilestone 
                ? `Currently at step ${currentIndex + 1} of ${milestones.length}` 
                : 'Not started'}
          </p>
        </div>
        
        {/* Progress percentage */}
        <div className="text-right">
          <span className="text-xl font-bold text-primary">
            {Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)}%
          </span>
          <p className="text-sm text-gray-500">Complete</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)}%` }}
        ></div>
      </div>
      
      {/* Timeline content */}
      <div className={`${orientation === 'horizontal' ? 'hidden sm:flex' : 'flex flex-col'} items-start justify-between w-full`}>
        {milestones.map((milestone, index) => (
          <Milestone
            key={`milestone-${index}`}
            title={milestone.title}
            description={milestone.description}
            status={milestone.status}
            date={milestone.date}
            index={index}
            isActive={orientation === 'horizontal' ? true : expandedIndex === index}
            isLast={index === milestones.length - 1}
            onClick={() => handleMilestoneClick(index)}
          />
        ))}
      </div>
      
      {/* Mobile timeline view (only shown on smaller screens when in horizontal mode) */}
      {orientation === 'horizontal' && (
        <div className="sm:hidden">
          <ol className="relative border-l border-gray-300">
            {milestones.map((milestone, index) => (
              <li key={`mobile-milestone-${index}`} className="mb-6 ml-4">
                <div className={`absolute w-3 h-3 rounded-full -left-1.5 mt-1.5 border border-white ${
                  milestone.status === 'completed' ? 'bg-green-500' :
                  milestone.status === 'current' ? 'bg-blue-500' :
                  milestone.status === 'overdue' ? 'bg-red-500' :
                  milestone.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-300'
                }`}></div>
                <div 
                  className="cursor-pointer" 
                  onClick={() => handleMilestoneClick(index)}
                >
                  <div className="flex items-center mb-1">
                    <h3 className={`text-lg font-semibold ${
                      milestone.status === 'completed' ? 'text-green-800' :
                      milestone.status === 'current' ? 'text-blue-800' :
                      milestone.status === 'overdue' ? 'text-red-800' :
                      milestone.status === 'waiting' ? 'text-yellow-800' : 'text-gray-500'
                    }`}>{milestone.title}</h3>
                    {milestone.status && (
                      <span className={`ml-2 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'current' ? 'bg-blue-100 text-blue-800' :
                        milestone.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        milestone.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </span>
                    )}
                  </div>
                  {milestone.description && <p className="text-sm text-gray-500">{milestone.description}</p>}
                  {milestone.date && (
                    <time className="block mb-3 text-xs font-normal leading-none text-gray-400">
                      {typeof milestone.date === 'string' 
                        ? new Date(milestone.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : milestone.date
                      }
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

MilestoneTimeline.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.oneOf(['completed', 'current', 'pending', 'overdue', 'waiting']),
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    })
  ).isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  expandedByDefault: PropTypes.bool,
  onMilestoneClick: PropTypes.func
};

export default MilestoneTimeline;
