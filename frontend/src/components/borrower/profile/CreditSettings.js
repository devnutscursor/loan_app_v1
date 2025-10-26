import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Clock,
  Calendar 
} from 'lucide-react';
import { useCreditConsent } from '../../../hooks/useCreditConsent';
import CreditConsentModals from './CreditConsentModals';

/**
 * Credit Settings Section Component
 * Allows borrower to manage their credit report consent
 */
const CreditSettings = () => {
  const {
    loading,
    updating,
    consentData,
    showGrantModal,
    showRevokeModal,
    handleGrantConsent,
    handleRevokeConsent,
    setShowGrantModal,
    setShowRevokeModal,
    formatDate,
    getConsentStatusText
  } = useCreditConsent();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getConsentStatusText();
  const canGrantConsent = !consentData.hasConsent || consentData.isRevoked;
  const canRevokeConsent = consentData.hasConsent && !consentData.isRevoked;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Credit Settings</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage your credit report consent and permissions
          </p>
        </div>

        <div className="p-6">
          {/* Current Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-900">
                Credit Report Consent Status
              </h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                {consentData.hasConsent && !consentData.isRevoked ? (
                  <Shield className="h-4 w-4 mr-1" />
                ) : (
                  <ShieldAlert className="h-4 w-4 mr-1" />
                )}
                {statusInfo.text}
              </div>
            </div>

            {/* Status Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {consentData.hasConsent && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 mr-2">Consent granted:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(consentData.consentDate)}
                  </span>
                </div>
              )}

              {consentData.consentMethod && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 mr-2">Method:</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {consentData.consentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {consentData.isRevoked && consentData.revokedDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-red-600 mr-2">Revoked on:</span>
                  <span className="text-red-900 font-medium">
                    {formatDate(consentData.revokedDate)}
                  </span>
                </div>
              )}

              {!consentData.hasConsent && (
                <div className="text-sm text-gray-600">
                  You have not granted credit report consent yet.
                </div>
              )}
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  About Credit Report Consent
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  This consent allows your lender to pull your credit report for loan processing, 
                  underwriting, and approval purposes. You can grant or revoke this consent at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canGrantConsent && (
              <button
                onClick={() => setShowGrantModal(true)}
                disabled={updating}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Shield className="h-4 w-4 mr-2" />
                {updating ? 'Processing...' : 'Grant Consent'}
              </button>
            )}

            {canRevokeConsent && (
              <button
                onClick={() => setShowRevokeModal(true)}
                disabled={updating}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                {updating ? 'Processing...' : 'Revoke Consent'}
              </button>
            )}
          </div>

          {/* Helper Text */}
          <div className="mt-4 text-xs text-gray-500">
            {canGrantConsent && (
              <p>
                Granting consent will allow your lender to access your credit report for loan processing.
              </p>
            )}
            {canRevokeConsent && (
              <p>
                Revoking consent will prevent future credit report pulls, but may affect your loan processing.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <CreditConsentModals
        showGrantModal={showGrantModal}
        showRevokeModal={showRevokeModal}
        onCloseGrantModal={() => setShowGrantModal(false)}
        onCloseRevokeModal={() => setShowRevokeModal(false)}
        onGrantConsent={handleGrantConsent}
        onRevokeConsent={handleRevokeConsent}
        updating={updating}
      />
    </>
  );
};

export default CreditSettings;
