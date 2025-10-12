import React from 'react';
import { AlertTriangle, Mail, FileText, X } from 'lucide-react';

/**
 * ConsentRequiredModal Component
 * 
 * Displays when lender tries to pull credit report but borrower hasn't provided consent
 * Offers options: send email request, record manual consent, or cancel
 */
export default function ConsentRequiredModal({ 
  isOpen, 
  onClose, 
  borrowerName = 'this borrower',
  borrowerId,
  onSendEmailRequest,
  onRecordManualConsent,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Borrower Authorization Required
            </h2>
            <p className="text-sm text-gray-600">
              <strong>{borrowerName}</strong> has not yet authorized credit report access. 
              You must obtain authorization before you can pull their credit report.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            How would you like to proceed?
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel || onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

