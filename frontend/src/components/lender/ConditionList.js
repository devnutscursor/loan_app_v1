import React, { useState } from 'react';

/**
 * Condition List Component
 * Displays a list of loan conditions with filtering and interaction capabilities
 */
const ConditionList = ({ conditions, loading, onUpdateStatus, onAddNote, onDeleteCondition }) => {
  const [expandedCondition, setExpandedCondition] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [changeStatusId, setChangeStatusId] = useState(null);
  const [changeStatusValue, setChangeStatusValue] = useState('');
  
  const toggleExpand = (conditionId) => {
    if (expandedCondition === conditionId) {
      setExpandedCondition(null);
    } else {
      setExpandedCondition(conditionId);
    }
  };
  
  const handleStatusChangeClick = (conditionId, status) => {
    setChangeStatusId(conditionId);
    setChangeStatusValue(status);
    setStatusChangeNotes('');
  };
  
  const confirmStatusChange = () => {
    onUpdateStatus(changeStatusId, changeStatusValue, statusChangeNotes);
    setChangeStatusId(null);
    setStatusChangeNotes('');
  };
  
  const cancelStatusChange = () => {
    setChangeStatusId(null);
    setChangeStatusValue('');
    setStatusChangeNotes('');
  };
  
  const handleAddNote = (conditionId) => {
    if (!noteContent.trim()) return;
    
    onAddNote(conditionId, noteContent);
    setNoteContent('');
  };
  
  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-50 text-yellow-800',
      'in_progress': 'bg-blue-50 text-blue-800',
      'submitted': 'bg-purple-50 text-purple-800',
      'cleared': 'bg-green-50 text-green-800',
      'waived': 'bg-gray-50 text-gray-800',
      'expired': 'bg-red-50 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </span>
    );
  };
  
  const getCategoryBadge = (category) => {
    const categoryColors = {
      'income': 'bg-indigo-50 text-indigo-800',
      'assets': 'bg-blue-50 text-blue-800',
      'credit': 'bg-purple-50 text-purple-800',
      'property': 'bg-green-50 text-green-800',
      'legal': 'bg-yellow-50 text-yellow-800',
      'insurance': 'bg-orange-50 text-orange-800',
      'other': 'bg-gray-50 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category?.charAt(0).toUpperCase() + category?.slice(1)}
      </span>
    );
  };
  
  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'low': 'bg-blue-50 text-blue-800',
      'medium': 'bg-yellow-50 text-yellow-800',
      'high': 'bg-orange-50 text-orange-800',
      'critical': 'bg-red-50 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  if (conditions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-center text-gray-500">No conditions found for this loan.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {conditions.map((condition) => (
          <li key={condition._id} className="hover:bg-gray-50">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="sm:flex sm:justify-between sm:w-full">
                  <div>
                    <p className="font-medium text-primary truncate">{condition.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getStatusBadge(condition.status)}
                      {getCategoryBadge(condition.category)}
                      {getPriorityBadge(condition.priority)}
                      {condition.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 sm:ml-6 sm:flex-shrink-0 flex sm:flex-col justify-end">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleExpand(condition._id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        {expandedCondition === condition._id ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => onDeleteCondition(condition._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                    {condition.dueDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {formatDate(condition.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {expandedCondition === condition._id && (
                <div className="mt-4">
                  {condition.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Description</h4>
                      <p className="mt-1 text-sm text-gray-500">{condition.description}</p>
                    </div>
                  )}
                  
                  {/* Status Update */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Update Status</h4>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {changeStatusId === condition._id ? (
                        <div className="col-span-3 space-y-3">
                          <div>
                            <label htmlFor="status-notes" className="block text-sm font-medium text-gray-700">
                              Notes (optional)
                            </label>
                            <textarea
                              id="status-notes"
                              rows="2"
                              className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Add notes about this status change"
                              value={statusChangeNotes}
                              onChange={(e) => setStatusChangeNotes(e.target.value)}
                            ></textarea>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={cancelStatusChange}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={confirmStatusChange}
                              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'pending')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'in_progress')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'submitted')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Submitted
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'cleared')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Cleared
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'waived')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Waived
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeClick(condition._id, 'expired')}
                            className="inline-flex justify-center items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Expired
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                    <div className="mt-1">
                      <div className="flex space-x-2">
                        <textarea
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          rows="2"
                          placeholder="Add a note"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                        ></textarea>
                        <button
                          type="button"
                          onClick={() => handleAddNote(condition._id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          Add
                        </button>
                      </div>
                      
                      {condition.notes && condition.notes.length > 0 ? (
                        <ul className="mt-3 space-y-3">
                          {condition.notes.map((note, index) => (
                            <li key={index} className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{note.content}</p>
                              <div className="mt-1 flex justify-between">
                                <span className="text-xs text-gray-500">
                                  By: {note.createdBy?.firstName || 'User'} {note.createdBy?.lastName || ''}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No notes yet</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status History */}
                  {condition.statusHistory && condition.statusHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Status History</h4>
                      <div className="mt-1 flow-root">
                        <ul className="-mb-8">
                          {condition.statusHistory.map((history, index) => (
                            <li key={index}>
                              <div className="relative pb-8">
                                {index !== condition.statusHistory.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Status changed to <span className="font-medium text-gray-900">{history.status}</span>
                                        {history.notes && <span> - {history.notes}</span>}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      {formatDate(history.changedAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConditionList;
