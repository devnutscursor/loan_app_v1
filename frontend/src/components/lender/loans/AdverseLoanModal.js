import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * AdverseLoanModal — Shown when lender changes loan status to Withdrawn or Denied.
 * Collects adverse action details required for NMLS MCR reporting.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void  (cancel / close without saving)
 *  - onConfirm: (adverseData) => void  (proceed with status change + adverse data)
 *  - targetStatus: 'Withdrawn' | 'Denied'
 */

const ADVERSE_REASONS = [
  'App Withdrawn By Borrower',
  'App Denied',
  'Preapproval Request Denied',
  'Preapproval Accepted - Not Converted',
];

const WITHDRAWN_REASONS = [
  'Competitor Offered Lower Rate Or Better Terms',
  'Home For Sale',
  'No Reason Provided',
  'Other',
  'Purchased Agreement Cancelled',
  'Service Unsatisfactory',
  'Unexpected Life Event',
];

const DENIED_REASONS = [
  'Credit History',
  'Debt-to-Income Ratio',
  'Insufficient Cash',
  'Unverifiable Information',
  'Employment History',
  'Collateral',
  'Incomplete Application',
  'Other',
];

const AdverseLoanModal = ({ isOpen, onClose, onConfirm, targetStatus }) => {
  const isWithdrawn = targetStatus === 'Withdrawn';
  const isDenied = targetStatus === 'Denied' || targetStatus === 'Rejected';

  const [adverseDate, setAdverseDate] = useState('');
  const [adverseReason, setAdverseReason] = useState(
    isWithdrawn ? 'App Withdrawn By Borrower' : 'App Denied'
  );
  const [selectedReason, setSelectedReason] = useState('');
  const [creditDecision, setCreditDecision] = useState({
    basedOnCreditReport: false,
    basedOnOutsideSource: false,
    basedOnOther: false,
    basedOnOtherText: '',
  });
  const [deliveryType, setDeliveryType] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setAdverseDate(today);
      setAdverseReason(isWithdrawn ? 'App Withdrawn By Borrower' : 'App Denied');
      setSelectedReason('');
      setCreditDecision({
        basedOnCreditReport: false,
        basedOnOutsideSource: false,
        basedOnOther: false,
        basedOnOtherText: '',
      });
      setDeliveryType('');
      setDeliveryDate('');
      setSendNotification(true);
      setSaving(false);
    }
  }, [isOpen, isWithdrawn]);

  const handleConfirm = () => {
    setSaving(true);
    onConfirm({
      adverseDate: adverseDate || new Date().toISOString().split('T')[0],
      adverseReason,
      withdrawnReason: isWithdrawn ? selectedReason : undefined,
      deniedReason: isDenied ? selectedReason : undefined,
      creditDecision,
      deliveryType: deliveryType || undefined,
      deliveryDate: deliveryDate || undefined,
      sendNotification,
    });
  };

  if (!isOpen) return null;

  const reasons = isWithdrawn ? WITHDRAWN_REASONS : DENIED_REASONS;
  const reasonLabel = isWithdrawn ? 'Select withdrawn reason' : 'Select denial reason';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden transform transition-all">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Adverse Loan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-5">
            {/* Warning note */}
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">Note:</span> You are Adversing the loan, which is reported in Call Reports.
              </p>
            </div>

            {/* Adverse Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adverse Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={adverseDate}
                onChange={(e) => setAdverseDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Adverse Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adverse Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={adverseReason}
                onChange={(e) => setAdverseReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ADVERSE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Specific Reason radio buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{reasonLabel}</p>
              <div className="space-y-2">
                {reasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="specificReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Credit Decision checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditDecision.basedOnCreditReport}
                  onChange={(e) => setCreditDecision(prev => ({ ...prev, basedOnCreditReport: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Our credit decision is based on the credit report</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditDecision.basedOnOutsideSource}
                  onChange={(e) => setCreditDecision(prev => ({ ...prev, basedOnOutsideSource: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Our credit decision is based on an outside source</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditDecision.basedOnOther}
                  onChange={(e) => setCreditDecision(prev => ({ ...prev, basedOnOther: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Our credit decision is based on:</span>
              </label>
              {creditDecision.basedOnOther && (
                <input
                  type="text"
                  value={creditDecision.basedOnOtherText}
                  onChange={(e) => setCreditDecision(prev => ({ ...prev, basedOnOtherText: e.target.value }))}
                  placeholder="Specify reason..."
                  className="ml-6 w-[calc(100%-1.5rem)] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Delivery Type & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Mail">Mail</option>
                  <option value="Email">Email</option>
                  <option value="In Person">In Person</option>
                  <option value="Phone">Phone</option>
                  <option value="Fax">Fax</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Send notification */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send notification to the loan contacts</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !adverseDate}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : `Confirm ${isWithdrawn ? 'Withdrawal' : 'Denial'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdverseLoanModal;
