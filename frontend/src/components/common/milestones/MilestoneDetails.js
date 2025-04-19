import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../../utils/formatters';

/**
 * MilestoneDetails Component
 * 
 * Displays detailed information about a selected milestone including
 * requirements, documents, tasks, and responsible parties.
 */
const MilestoneDetails = ({ 
  milestone, 
  onComplete, 
  onMarkRequired, 
  userRole,
  onClose
}) => {
  if (!milestone) return null;

  // Determine if user has permission to mark milestone as complete
  const canMarkComplete = 
    userRole === 'lender' || 
    (userRole === 'borrower' && milestone.borrowerCanComplete);

  // Determine if all required items are completed
  const allRequiredCompleted = 
    milestone.requirements?.every(req => req.completed) && 
    milestone.documents?.every(doc => doc.received);

  // Get appropriate styling based on status
  const getStatusStyles = () => {
    switch (milestone.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'current':
        return 'bg-blue-50 border-blue-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'waiting':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusStyles()}`}>
      {/* Header with close button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {milestone.title}
          </h3>
          <div className="mt-1 flex items-center">
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
              milestone.status === 'current' ? 'bg-blue-100 text-blue-800' :
              milestone.status === 'overdue' ? 'bg-red-100 text-red-800' :
              milestone.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
            </span>
            {milestone.date && (
              <span className="ml-2 text-sm text-gray-500">
                {formatDate(milestone.date)}
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Description */}
      {milestone.description && (
        <div className="mb-6">
          <p className="text-gray-700">{milestone.description}</p>
        </div>
      )}

      {/* Requirements */}
      {milestone.requirements && milestone.requirements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Requirements</h4>
          <ul className="space-y-2">
            {milestone.requirements.map((req, idx) => (
              <li key={`req-${idx}`} className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 mr-2">
                  {req.completed ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className={`font-medium ${req.completed ? 'text-green-600' : 'text-gray-700'}`}>
                    {req.name}
                  </span>
                  {req.description && (
                    <p className="text-sm text-gray-500">{req.description}</p>
                  )}
                </div>
                {userRole === 'lender' && (
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={() => onMarkRequired && onMarkRequired(idx, !req.completed)}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      {req.completed ? (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      )}
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Required Documents */}
      {milestone.documents && milestone.documents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Required Documents</h4>
          <ul className="space-y-3">
            {milestone.documents.map((doc, idx) => (
              <li key={`doc-${idx}`} className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 mr-2">
                  {doc.received ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${doc.received ? 'text-green-600' : 'text-gray-700'}`}>
                    {doc.name}
                  </span>
                  {doc.description && (
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  )}
                </div>
                {userRole === 'borrower' && (
                  <a
                    href={userRole === 'borrower' ? '/borrower/documents' : '/lender/documents'}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    {doc.received ? 'View' : 'Upload'}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Responsible Parties */}
      {milestone.responsible && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Responsible</h4>
          <div className="flex space-x-2">
            {milestone.responsible.map((person, idx) => (
              <div key={`person-${idx}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {person.role === 'borrower' ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                )}
                {person.name || person.role.charAt(0).toUpperCase() + person.role.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps / Actions */}
      {milestone.nextSteps && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Next Steps</h4>
          <div className="text-gray-700">
            {typeof milestone.nextSteps === 'string' ? (
              <p>{milestone.nextSteps}</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {milestone.nextSteps.map((step, idx) => (
                  <li key={`step-${idx}`}>{step}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {milestone.status !== 'completed' && canMarkComplete && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onComplete && onComplete(milestone)}
            disabled={!allRequiredCompleted && userRole === 'borrower'}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              allRequiredCompleted || userRole === 'lender'
                ? 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {allRequiredCompleted || userRole === 'lender' 
              ? 'Mark as Completed'
              : 'Complete All Requirements'}
          </button>
        </div>
      )}
    </div>
  );
};

MilestoneDetails.propTypes = {
  milestone: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['completed', 'current', 'pending', 'overdue', 'waiting']).isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    requirements: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        completed: PropTypes.bool.isRequired
      })
    ),
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        received: PropTypes.bool.isRequired
      })
    ),
    responsible: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        role: PropTypes.string.isRequired
      })
    ),
    nextSteps: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    borrowerCanComplete: PropTypes.bool
  }),
  onComplete: PropTypes.func,
  onMarkRequired: PropTypes.func,
  userRole: PropTypes.oneOf(['borrower', 'lender', 'admin']).isRequired,
  onClose: PropTypes.func
};

export default MilestoneDetails;
