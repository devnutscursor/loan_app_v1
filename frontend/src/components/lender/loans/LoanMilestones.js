import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Edit, Trash2, Plus,
  Clock // Added for deadline indicators
} from 'lucide-react';
import milestoneService from '../../../services/api/milestone.service';
import MilestoneForm from './MilestoneForm';

// Utility function to check if a milestone's deadline is approaching or passed
const getDeadlineStatus = (deadlineDate) => {
  if (!deadlineDate) return null;
  
  const now = new Date();
  const deadline = new Date(deadlineDate);
  
  // Calculate hours difference using full date/time
  const diffTime = deadline.getTime() - now.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  
  if (diffHours < 0) return 'overdue';
  if (diffHours <= 24) return 'approaching'; // 24 hours or less
  return 'normal';
};

const MilestoneStatusIcon = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-green-500 h-5 w-5" />;
    case 'in_progress':
      return <Edit className="text-blue-500 h-5 w-5" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>;
  }
};

const LoanMilestones = ({ loanId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch milestones for the loan
  const fetchMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await milestoneService.getLoanMilestones(loanId);
      console.log("response milestone", response);
      if (response.status === 'success') {
        setMilestones(response.data.milestones || []);
      } else {
        setError('Failed to load milestones');
      }
    } catch (err) {
      console.log(err.message);
      setError(err.message || 'Error loading milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchMilestones();
    }
  }, [loanId]);

  // Handle form submission for create/edit
  const handleSubmitMilestone = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Submitting milestone with data:', formData);

      if (editingMilestone) {
        // Update existing milestone
        const updateResponse = await milestoneService.updateMilestone(editingMilestone._id, formData);
        console.log('Update response:', updateResponse);
      } else {
        // Create new milestone
        formData.loan = loanId;
        formData.order = milestones.length + 1;
        const createResponse = await milestoneService.createMilestone(formData);
        console.log('Create response:', createResponse);
      }

      // Reset form state
      setShowForm(false);
      setEditingMilestone(null);

      // Refresh milestones
      fetchMilestones();
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError(err.message || 'Failed to save milestone');
      setLoading(false);
    }
  };

  // Handle edit milestone
  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setShowForm(true);
  };

  // Handle delete milestone
  const handleDeleteMilestone = async (milestoneId) => {
    try {
      setLoading(true);
      await milestoneService.deleteMilestone(milestoneId);
      setConfirmDelete(null);
      fetchMilestones();
    } catch (err) {
      setError(err.message || 'Failed to delete milestone');
      setLoading(false);
    }
  };

  // Handle updating milestone status
  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      setLoading(true);
      await milestoneService.updateMilestoneStatus(milestoneId, newStatus);
      
      // If we're marking a milestone as completed, set its completion date to today
      if (newStatus === 'completed') {
        const currentDate = new Date().toISOString();
        await milestoneService.updateMilestone(milestoneId, { completedAt: currentDate });
      }
      
      fetchMilestones();
    } catch (err) {
      setError(err.message || 'Failed to update milestone status');
      setLoading(false);
    }
  };

  // Replace the existing loading spinner with this skeleton loader
if (loading && milestones.length === 0) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Skeleton Milestones */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden shadow-sm border-gray-200 sm:border-l-4 sm:border-l-gray-200 sm:border-t-0 border-t-4 border-t-gray-200">
            <div className="flex items-center justify-between py-2 px-3">
              <div className="flex items-center flex-1">
                <div className="mr-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded mt-2 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-100 flex justify-end">
              <div className="flex space-x-2">
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="ml-2 pl-2 flex space-x-1">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

  if (error && milestones.length === 0) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchMilestones}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg py-6 px-3 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Loan Milestones</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingMilestone(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-2">
        {milestones.map((milestone, index) => (
          <div
            key={milestone._id}
            className={`w-full border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 ${milestone.status === 'completed' 
              ? 'sm:border-l-4 sm:border-l-green-500 sm:border-t-0 border-t-4 border-t-green-500' 
              : milestone.status === 'in_progress' 
                ? 'sm:border-l-4 sm:border-l-blue-500 sm:border-t-0 border-t-4 border-t-blue-500 bg-blue-100' 
                : 'sm:border-l-4 sm:border-l-gray-300 sm:border-t-0 border-t-4 border-t-gray-300'}`}
          >
            <div className="flex items-center justify-between py-2 px-3">
              <div className="flex items-center flex-1 min-w-0">
                <div className="mr-2 flex-shrink-0">
                  <MilestoneStatusIcon status={milestone.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="text-base font-medium text-gray-900 truncate">{milestone.name}</h4>
                    <div className="flex-shrink-0">
                      {milestone.status === 'completed' ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Mark Completed
                        </span>
                      ) : milestone.status === 'in_progress' ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Mark In Progress
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Mark Pending
                        </span>
                      )}
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-gray-600 mt-1 break-words">{milestone.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Timeline and Action buttons */}
            <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
              {/* Timeline - Always visible */}
              {(milestone.startDate || milestone.deadlineDate) && (
                <div className="flex items-start mb-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600 min-w-0 flex-1">
                    <span className="font-medium">Timeline:</span> 
                    {milestone.startDate && 
                      <> {new Date(milestone.startDate).toLocaleDateString()}</>
                    }
                    {milestone.deadlineDate && milestone.startDate && <> - </>}
                    
                    {milestone.deadlineDate && (() => {
                      const deadlineStatus = getDeadlineStatus(milestone.deadlineDate);
                      return (
                        <span className={`font-medium inline-flex items-center flex-wrap ${
                          deadlineStatus === 'overdue' 
                            ? 'text-red-600' 
                            : deadlineStatus === 'approaching' 
                              ? 'text-orange-600' 
                              : 'text-blue-600'
                        }`}>
                          {new Date(milestone.deadlineDate).toLocaleDateString()}
                          {deadlineStatus === 'overdue' && (
                            <span className="ml-1 px-1.5 py-0.5 text-xxs bg-red-100 text-red-800 rounded-sm shadow-sm">
                              Overdue
                            </span>
                          )}
                          {deadlineStatus === 'approaching' && (
                            <span className="ml-1 px-1.5 py-0.5 text-xxs bg-orange-100 text-orange-800 rounded-sm shadow-sm">
                              Due Soon
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {/* Desktop: Horizontal layout */}
                <div className="hidden sm:flex items-center space-x-2">
                  {/* Status buttons */}
                  <div className="flex space-x-2">
                  {milestone.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'completed')}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium border border-green-300 rounded-md text-green-700  hover:bg-green-100 transition-colors duration-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark Complete
                    </button>
                  )}
                  
                  {milestone.status !== 'in_progress' && milestone.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'in_progress')}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium border border-blue-300 rounded-md text-blue-700  hover:bg-blue-100 transition-colors duration-200"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Mark In Progress
                    </button>
                  )}
                  
                  {milestone.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'pending')}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="h-3 w-3 mr-1 rounded-full border-2 border-gray-400"></div> Mark Pending
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-1 ml-2 border-l border-gray-200 pl-2">
                  {/* Edit button */}
                  <button
                    onClick={() => handleEditMilestone(milestone)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDelete(milestone._id)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium border border-red-200 rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </button>
                </div>
                </div>

                {/* Mobile: 2x2 Grid Layout */}
                <div className="sm:hidden grid grid-cols-2 gap-2 w-full">
                  {/* Button 1: Complete or In Progress */}
                  {milestone.status !== 'completed' ? (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'completed')}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-green-300 rounded-md text-green-700 hover:bg-green-100 transition-colors duration-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark Complete
                    </button>
                  ) : milestone.status !== 'in_progress' ? (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'in_progress')}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-blue-300 rounded-md text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Mark In Progress
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'pending')}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="h-3 w-3 mr-1 rounded-full border-2 border-gray-400"></div>Mark Pending
                    </button>
                  )}

                  {/* Button 2: Pending or In Progress */}
                  {milestone.status === 'pending' ? (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'in_progress')}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-blue-300 rounded-md text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <Edit className="h-3 w-3 mr-1" />Mark In Progress
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(milestone._id, 'pending')}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="h-3 w-3 mr-1 rounded-full border-2 border-gray-400"></div> Mark Pending
                    </button>
                  )}

                  {/* Button 3: Edit */}
                  <button
                    onClick={() => handleEditMilestone(milestone)}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </button>

                  {/* Button 4: Delete */}
                  <button
                    onClick={() => setConfirmDelete(milestone._id)}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium border border-red-200 rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {milestones.length === 0 && !loading && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No milestones have been created for this loan yet.</p>
          <button
            onClick={() => {
              setEditingMilestone(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Milestone
          </button>
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 ">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-3 sm:mx-0">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h2>
              <MilestoneForm
                milestone={editingMilestone}
                onSubmit={handleSubmitMilestone}
                onCancel={() => {
                  setShowForm(false);
                  setEditingMilestone(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 ">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-3 sm:mx-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this milestone? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMilestone(confirmDelete)}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanMilestones;
