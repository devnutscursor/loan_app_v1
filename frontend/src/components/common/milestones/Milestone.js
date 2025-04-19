import React from 'react';
import PropTypes from 'prop-types';

/**
 * Milestone Component
 * 
 * A reusable component to display a single milestone in a loan process
 * with visual indicators for current, completed, and upcoming milestones.
 */
const Milestone = ({ 
  title, 
  description, 
  status, 
  date, 
  index, 
  isActive, 
  isLast,
  onClick
}) => {
  // Determine styling based on milestone status
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          icon: 'bg-green-500',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800',
          connector: 'border-green-500'
        };
      case 'current':
        return {
          icon: 'bg-blue-500',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800',
          connector: 'border-gray-300'
        };
      case 'overdue':
        return {
          icon: 'bg-red-500',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
          connector: 'border-gray-300'
        };
      case 'waiting':
        return {
          icon: 'bg-yellow-500',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800',
          connector: 'border-gray-300'
        };
      default:
        return {
          icon: 'bg-gray-300',
          text: 'text-gray-500',
          badge: 'bg-gray-100 text-gray-800',
          connector: 'border-gray-300'
        };
    }
  };

  const styles = getStatusStyles();
  
  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div 
      className={`relative ${isActive ? 'mb-8 sm:mb-0' : 'mb-0'}`}
      data-testid={`milestone-${index}`}
    >
      <div className="flex items-center">
        {/* Milestone dot */}
        <div className={`z-10 flex items-center justify-center w-6 h-6 rounded-full ${styles.icon} ring-0 sm:ring-8 ring-white shrink-0`}>
          {status === 'completed' ? (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          ) : (
            <span className="w-3.5 h-3.5 bg-white rounded-full"></span>
          )}
        </div>
        
        {/* Connecting line */}
        {!isLast && (
          <div className={`hidden sm:flex w-full bg-transparent h-0.5 border-t-2 ${styles.connector}`}></div>
        )}
      </div>
      
      {/* Content */}
      <div 
        className={`${isActive ? 'mt-3 sm:pr-8' : 'hidden'} cursor-pointer`} 
        onClick={() => onClick && onClick(index)}
      >
        <div className="flex items-center mb-1">
          <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
          {status && (
            <span className={`ml-2 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${styles.badge}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {date && (
          <time className="block mb-3 text-xs font-normal leading-none text-gray-400">
            {typeof date === 'string' ? formatDate(date) : date}
          </time>
        )}
      </div>
    </div>
  );
};

Milestone.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.oneOf(['completed', 'current', 'pending', 'overdue', 'waiting']),
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  isLast: PropTypes.bool,
  onClick: PropTypes.func
};

Milestone.defaultProps = {
  description: '',
  status: 'pending',
  date: null,
  isActive: true,
  isLast: false
};

export default Milestone;
