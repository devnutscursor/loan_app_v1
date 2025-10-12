import React from 'react';
import { AlertTriangle, CheckCircle, FileText, Mail } from 'lucide-react';

/**
 * ConsentStatusBanner Component
 * 
 * Displays borrower's credit report consent status in the credit report page
 * Shows warning if consent is missing, success if consent exists
 */
export default function ConsentStatusBanner({ 
  borrowerConsent,
  loading = false,
  onRecordManualConsent,
  onSendEmailRequest
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-sm text-gray-600">Checking authorization status...</span>
        </div>
      </div>
    );
  }

  // No consent data available yet
  if (!borrowerConsent) {
    return null;
  }

  // Borrower has valid consent
  if (borrowerConsent.hasConsent && !borrowerConsent.isRevoked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-900">
              ✓ Borrower Authorization Confirmed
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Consent granted on {borrowerConsent.consentDate ? new Date(borrowerConsent.consentDate).toLocaleDateString() : 'file'} 
              {borrowerConsent.consentMethod && ` via ${borrowerConsent.consentMethod.replace(/_/g, ' ')}`}.
              You are authorized to pull credit reports for this borrower.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Consent was revoked
  if (borrowerConsent.isRevoked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">
              Authorization Revoked
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Borrower revoked credit report authorization on {borrowerConsent.revokedDate ? new Date(borrowerConsent.revokedDate).toLocaleDateString() : 'file'}.
              You cannot pull new credit reports until new authorization is obtained.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No consent on file
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            Authorization Required
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            This borrower has not authorized credit report access. You cannot pull a credit report 
            until authorization is obtained.
          </p>
        </div>
      </div>
    </div>
  );
}

