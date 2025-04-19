import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import lenderService from '../../services/api/lender.service';
import ConditionList from './ConditionList';
import ConditionForm from './ConditionForm';
import ConditionLibraryModal from './ConditionLibraryModal';

/**
 * Condition Manager Component
 * Manages loan conditions including creation, status updates, and library integration
 */
const ConditionManager = ({ loanId, loanData }) => {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  useEffect(() => {
    fetchConditions();
  }, [loanId, filterStatus, filterCategory, filterPriority]);
  
  const fetchConditions = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterPriority !== 'all') filters.priority = filterPriority;
      
      const response = await lenderService.getLoanConditions(loanId, filters);
      setConditions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast.error('Failed to load conditions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateCondition = async (conditionData) => {
    try {
      await lenderService.createCondition(loanId, conditionData);
      toast.success('Condition created successfully');
      setShowAddForm(false);
      fetchConditions();
    } catch (error) {
      console.error('Error creating condition:', error);
      toast.error('Failed to create condition');
    }
  };
  
  const handleUpdateStatus = async (conditionId, newStatus, notes) => {
    try {
      await lenderService.updateConditionStatus(conditionId, { 
        status: newStatus,
        notes
      });
      
      // Update condition in state
      setConditions(conditions.map(condition => 
        condition._id === conditionId 
          ? { ...condition, status: newStatus } 
          : condition
      ));
      
      toast.success(`Condition status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating condition status:', error);
      toast.error('Failed to update condition status');
    }
  };
  
  const handleAddNote = async (conditionId, content) => {
    try {
      await lenderService.addConditionNote(conditionId, { content });
      
      // Refresh conditions to get updated notes
      fetchConditions();
      
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };
  
  const handleDeleteCondition = async (conditionId) => {
    if (!window.confirm('Are you sure you want to delete this condition?')) {
      return;
    }
    
    try {
      await lenderService.deleteCondition(conditionId);
      
      // Remove condition from state
      setConditions(conditions.filter(condition => condition._id !== conditionId));
      
      toast.success('Condition deleted successfully');
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };
  
  const handleAddFromLibrary = async (selectedIds) => {
    try {
      await lenderService.addConditionsFromLibrary(loanId, {
        conditionIds: selectedIds
      });
      
      setShowLibraryModal(false);
      toast.success('Conditions added from library');
      fetchConditions();
    } catch (error) {
      console.error('Error adding conditions from library:', error);
      toast.error('Failed to add conditions from library');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Loan Conditions</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLibraryModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add from Library
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add New Condition
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="cleared">Cleared</option>
              <option value="waived">Waived</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="income">Income</option>
              <option value="assets">Assets</option>
              <option value="credit">Credit</option>
              <option value="property">Property</option>
              <option value="legal">Legal</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Condition List */}
      <ConditionList 
        conditions={conditions}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onDeleteCondition={handleDeleteCondition}
      />
      
      {/* Add Condition Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Add New Condition
                  </h3>
                  <div className="mt-4">
                    <ConditionForm 
                      onSubmit={handleCreateCondition}
                      onCancel={() => setShowAddForm(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Library Modal */}
      {showLibraryModal && (
        <ConditionLibraryModal 
          onClose={() => setShowLibraryModal(false)}
          onAddConditions={handleAddFromLibrary}
        />
      )}
    </div>
  );
};

export default ConditionManager;
