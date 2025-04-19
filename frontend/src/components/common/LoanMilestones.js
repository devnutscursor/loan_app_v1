import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoanMilestones component displays the progress of a loan application through predefined milestones
 * @param {Object} props - Component props
 * @param {Array} props.milestones - Array of milestone objects with name, status, date, and description
 * @param {boolean} props.interactive - Whether milestones can be updated (for admin/lender use)
 * @param {function} props.onMilestoneUpdate - Callback when milestone status is updated
 */
const LoanMilestones = ({ milestones, interactive = false, onMilestoneUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'skipped':
        return 'bg-gray-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'skipped':
        return 'Skipped';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not started';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const handleStatusChange = (milestoneId, newStatus) => {
    if (interactive && onMilestoneUpdate) {
      onMilestoneUpdate(milestoneId, newStatus);
    }
  };
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {milestones.map((milestone, index) => (
          <li key={milestone.id || index}>
            <div className="relative pb-8">
              {index !== milestones.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(milestone.status)}`}
                  >
                    {milestone.status === 'completed' ? (
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : milestone.status === 'in_progress' ? (
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    ) : milestone.status === 'failed' ? (
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                    {milestone.description && (
                      <p className="text-sm text-gray-500">{milestone.description}</p>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap">
                    <div className="text-gray-900 font-medium">{formatDate(milestone.date)}</div>
                    <div className={`text-sm ${
                      milestone.status === 'completed' ? 'text-green-600' :
                      milestone.status === 'in_progress' ? 'text-blue-600' :
                      milestone.status === 'failed' ? 'text-red-600' :
                      milestone.status === 'skipped' ? 'text-gray-600' :
                      'text-yellow-600'
                    }`}>
                      {getStatusText(milestone.status)}
                    </div>
                    
                    {/* Status update controls for interactive mode */}
                    {interactive && (
                      <div className="mt-2">
                        <select
                          value={milestone.status}
                          onChange={(e) => handleStatusChange(milestone.id || index, e.target.value)}
                          className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="skipped">Skipped</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

LoanMilestones.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'in_progress', 'completed', 'skipped', 'failed']).isRequired,
      date: PropTypes.string,
      description: PropTypes.string,
    })
  ).isRequired,
  interactive: PropTypes.bool,
  onMilestoneUpdate: PropTypes.func,
};

export default LoanMilestones;
