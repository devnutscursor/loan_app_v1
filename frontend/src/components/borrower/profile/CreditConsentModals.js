import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Grant Consent Confirmation Modal
 */
const GrantConsentModal = ({ isOpen, onClose, onConfirm, updating }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Grant Credit Report Consent
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={updating}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              By granting consent, you authorize your lender to pull your credit report for loan processing purposes.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can revoke this consent at any time from your profile settings.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={updating}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Granting...' : 'Grant Consent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Revoke Consent Confirmation Modal
 */
const RevokeConsentModal = ({ isOpen, onClose, onConfirm, updating }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Revoke Credit Report Consent
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={updating}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to revoke your credit report consent? This will prevent your lender from pulling new credit reports.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Revoking consent may affect your loan processing and approval timeline.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={updating}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Revoking...' : 'Revoke Consent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Combined Credit Consent Modals Component
 */
const CreditConsentModals = ({ 
  showGrantModal, 
  showRevokeModal, 
  onCloseGrantModal, 
  onCloseRevokeModal, 
  onGrantConsent, 
  onRevokeConsent, 
  updating 
}) => {
  return (
    <>
      <GrantConsentModal
        isOpen={showGrantModal}
        onClose={onCloseGrantModal}
        onConfirm={onGrantConsent}
        updating={updating}
      />
      <RevokeConsentModal
        isOpen={showRevokeModal}
        onClose={onCloseRevokeModal}
        onConfirm={onRevokeConsent}
        updating={updating}
      />
    </>
  );
};

export default CreditConsentModals;
