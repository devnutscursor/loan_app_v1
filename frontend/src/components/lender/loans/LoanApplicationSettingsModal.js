import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../common/Modal';
import AdverseLoanModal from './AdverseLoanModal';
import api from '../../../services/api';

const LoanApplicationSettingsModal = ({
  isOpen,
  onClose,
  loan,
  loanId,
  onUpdateLoan
}) => {
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdverseModal, setShowAdverseModal] = useState(false);
  const [pendingAdverseStatus, setPendingAdverseStatus] = useState('');

  // Status options for the dropdown
  const statusOptions = [
    'Application Submitted',
    'Processing',
    'Underwriting',
    'Approved',
    'Approved but not Accepted',
    'Clear to Close',
    'Closed',
    'Funded',
    'Rejected',
    'Withdrawn',
    'Closed-Incomplete'
  ];

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && loan) {
      setEditingEnabled(loan.editingEnabled !== false);
      
      // Map backend status to user-friendly display status
      const displayStatus = mapBackendToDisplayStatus(loan?.status || 'Application Submitted');
      setCurrentStatus(displayStatus);
    }
  }, [isOpen, loan]);

  // Map backend status to user-friendly display status
  const mapBackendToDisplayStatus = (backendStatus) => {
    const map = {
      'Application Started': 'Application Submitted',
      'Application Submitted': 'Application Submitted',
      'Processing': 'Processing',
      'Underwriting': 'Underwriting',
      'Conditional Approval': 'Approved',
      'Approved': 'Approved',
      'Approved-Not-Accepted': 'Approved but not Accepted',
      'Clear to Close': 'Clear to Close',
      'Closed': 'Closed',
      'Funded': 'Funded',
      'Declined': 'Rejected',
      'Rejected': 'Rejected',
      'Withdrawn': 'Withdrawn',
      'Closed-Incomplete': 'Closed-Incomplete',
    };
    return map[backendStatus] || 'Application Submitted';
  };

  // Map between frontend display status and backend status values
  const mapDisplayToBackendStatus = (displayStatus) => {
    const map = {
      'Application Submitted': 'Application Submitted',
      'Processing': 'Processing',
      'Underwriting': 'Underwriting',
      'Approved': 'Approved',
      'Approved but not Accepted': 'Approved-Not-Accepted',
      'Clear to Close': 'Clear to Close',
      'Closed': 'Closed',
      'Funded': 'Funded',
      'Rejected': 'Rejected',
      'Withdrawn': 'Withdrawn',
      'Closed-Incomplete': 'Closed-Incomplete',
    };
    return map[displayStatus] || 'Application Submitted';
  };

  // Check if the selected status requires an adverse action modal
  const isAdverseStatus = (status) => status === 'Withdrawn' || status === 'Rejected';

  // Handle both edit permission toggle and status change
  const handleSaveSettings = async (adverseAction = null) => {
    try {
      setSaving(true);
      
      // Get the current backend status from the loan
      const currentBackendStatus = loan?.status;
      
      // Map the frontend status to backend status
      const newBackendStatus = mapDisplayToBackendStatus(currentStatus);
      
      // Check if edit permission or status has changed
      const newEditingState = editingEnabled !== (loan?.editingEnabled !== false);
      const statusChanged = newBackendStatus !== currentBackendStatus;
      
      // If nothing changed, just close the modal
      if (!newEditingState && !statusChanged) {
        onClose();
        setSaving(false);
        return;
      }
      
      // If status changed to an adverse status and we don't have adverse data yet, show the modal
      if (statusChanged && isAdverseStatus(currentStatus) && !adverseAction) {
        setPendingAdverseStatus(currentStatus);
        setShowAdverseModal(true);
        setSaving(false);
        return;
      }
      
      // Update edit permission if changed
      if (newEditingState) {
        try {
          // Use direct API call for toggle-editing endpoint
          const editPermissionResponse = await api.patch(`/loans/${loanId}/toggle-editing`, { editingEnabled: editingEnabled });
          console.log('Edit permission response:', editPermissionResponse);
          
          if (editPermissionResponse.data?.status === 'success') {
            toast.success(`Edit permission ${editingEnabled ? 'enabled' : 'disabled'} successfully`);
            
            // Update frontend state directly
            if (onUpdateLoan) {
              onUpdateLoan(prev => ({
                ...prev,
                editingEnabled: editingEnabled
              }));
            }
          }
        } catch (error) {
          console.error('Edit permission API call failed:', error);
          throw new Error(`Edit permission API call failed: ${error.response?.status || 'Unknown error'} ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      }
      
      // Update status if changed
      if (statusChanged) {
        try {
          // Build request body — include adverse action data if present
          // Backend expects the *display* status value (e.g. "Approved but not Accepted")
          const requestBody = { status: currentStatus };
          if (adverseAction) {
            requestBody.adverseAction = adverseAction;
          }
          
          // Use direct API call for status endpoint
          const statusResponse = await api.patch(`/loans/${loanId}/status`, requestBody);
          console.log('Status update response:', statusResponse);
          
          if (statusResponse.data?.status === 'success') {
            // Show the user-friendly status name in the toast message
            const displayStatus = mapBackendToDisplayStatus(statusResponse.data.data?.status || newBackendStatus);
            toast.success(`Loan status updated to ${displayStatus} successfully`);
            
            // Update frontend state directly
            if (onUpdateLoan) {
              onUpdateLoan(prev => ({
                ...prev,
                status: newBackendStatus
              }));
            }
          }
        } catch (error) {
          console.error('Status update API call failed:', error);
          throw new Error(`Status update API call failed: ${error.response?.status || 'Unknown error'} ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      }
      
      onClose();
      setSaving(false);
      
    } catch (error) {
      console.error('Error updating loan settings:', error);
      setSaving(false);
      
      // More detailed error message based on the error
      if (error.response) {
        if (error.response.status === 403) {
          toast.error(`Permission denied (403). Your current role may not be 'lender' or 'admin'. Please check your login credentials.`);
        } else {
          toast.error(`Failed to update loan settings: ${error.response?.data?.message || error.message || 'Server error'}`);
        }
      } else {
        toast.error(`Failed to connect to the server: ${error.message}`);
      }
    }
  };

  // Called when user confirms the adverse action modal
  const handleAdverseConfirm = (adverseData) => {
    setShowAdverseModal(false);
    handleSaveSettings(adverseData);
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Loan Application Settings"
    >
      <div className="p-4">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Borrower Edit Permission</h3>
          <p className="text-sm text-gray-500 mb-4">
            Allow or restrict the borrower's ability to edit this loan application.
          </p>
          
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={editingEnabled}
                onChange={() => setEditingEnabled(!editingEnabled)}
              />
              <div className={`relative w-11 h-6 rounded-full transition ${editingEnabled ? 'bg-primary' : 'bg-gray-200'}`}>
                <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${editingEnabled ? 'translate-x-6' : 'translate-x-1'} top-1`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {editingEnabled ? 'Editing Enabled' : 'Editing Disabled'}
              </span>
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loan Status</h3>
          <p className="text-sm text-gray-500 mb-4">
            Change the status of this loan application.
          </p>
          
          <div className="mt-2 relative">
            <select
              id="status"
              name="status"
              className={`block w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none font-medium ${
                currentStatus === 'Application Submitted' ? 'bg-yellow-50 text-yellow-800' :
                currentStatus === 'Processing' ? 'bg-blue-50 text-blue-800' :
                currentStatus === 'Underwriting' ? 'bg-indigo-50 text-indigo-800' :
                currentStatus === 'Approved' ? 'bg-green-50 text-green-800' :
                currentStatus === 'Clear to Close' ? 'bg-emerald-50 text-emerald-800' :
                currentStatus === 'Funded' ? 'bg-green-100 text-green-900' :
                currentStatus === 'Rejected' ? 'bg-red-50 text-red-800' :
                currentStatus === 'Withdrawn' ? 'bg-orange-50 text-orange-800' :
                currentStatus === 'Closed-Incomplete' ? 'bg-amber-50 text-amber-800' :
                currentStatus === 'Closed' ? 'bg-gray-50 text-gray-800' :
                'bg-white text-gray-800'
              }`}
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option 
                  key={option} 
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow transition-all duration-200"
            onClick={() => handleSaveSettings()}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>

    {/* Adverse Loan Modal — shown when changing to Withdrawn or Rejected */}
    <AdverseLoanModal
      isOpen={showAdverseModal}
      onClose={() => { setShowAdverseModal(false); setSaving(false); }}
      onConfirm={handleAdverseConfirm}
      targetStatus={pendingAdverseStatus}
    />
    </>
  );
};

export default LoanApplicationSettingsModal;
