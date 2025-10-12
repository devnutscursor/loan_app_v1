import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';

/**
 * ManualConsentModal Component
 * 
 * Allows lenders to record consent that was obtained offline
 * (phone call, in-person meeting, signed document, etc.)
 */
export default function ManualConsentModal({
  isOpen,
  onClose,
  borrowerName = 'this borrower',
  borrowerId,
  onSubmit,
  loading = false
}) {
  const [consentMethod, setConsentMethod] = useState('manual_agreement');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = {};
    if (!notes || notes.trim().length < 10) {
      validationErrors.notes = 'Please provide detailed notes about how consent was obtained (minimum 10 characters)';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submit
    onSubmit?.({
      borrowerId,
      consentMethod,
      notes: notes.trim()
    });
  };

  const handleClose = () => {
    setConsentMethod('manual_agreement');
    setNotes('');
    setErrors({});
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Record Manual Consent
            </h2>
            <p className="text-sm text-gray-600">
              Record credit report authorization for <strong>{borrowerName}</strong>
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            <strong className="font-semibold">⚠️ Important:</strong> Only record manual consent if you have 
            actually obtained authorization from the borrower through phone, in-person conversation, 
            or signed document. False consent recording may violate FCRA regulations.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consent Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was consent obtained? *
            </label>
            <select
              value={consentMethod}
              onChange={(e) => setConsentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="manual_agreement">Written Agreement/Form</option>
              <option value="phone_verbal">Phone Call (Verbal)</option>
              <option value="in_person">In-Person Meeting</option>
              <option value="email_confirmation">Email Confirmation</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details / Notes *
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) setErrors({ ...errors, notes: null });
              }}
              placeholder="Please provide specific details about when and how consent was obtained. For example: 'Borrower provided verbal consent via phone call on 10/12/2025 at 2:30 PM EST. Confirmed their authorization to pull credit report for loan evaluation.'"
              rows={5}
              className={`w-full border ${errors.notes ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
              minLength={10}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters. Be specific about date, time, method, and what the borrower agreed to.
            </p>
          </div>

          {/* Confirmation Checklist */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Please confirm:
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span>
                  I have personally obtained authorization from the borrower
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span>
                  The borrower understands their credit report will be pulled for loan evaluation
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span>
                  The details provided above are accurate and complete
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Recording...
                </span>
              ) : (
                'Record Consent'
              )}
            </button>
          </div>
        </form>

        {/* Legal Disclaimer */}
        <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>Legal Notice:</strong> By recording this consent, you certify that you have obtained 
            proper authorization from the borrower in compliance with federal and state laws, including 
            the Fair Credit Reporting Act (FCRA). Your name, IP address, and timestamp will be recorded 
            for audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

