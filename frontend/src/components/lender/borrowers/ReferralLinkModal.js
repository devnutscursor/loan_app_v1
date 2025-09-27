import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, CheckCircle2, Copy } from 'lucide-react';

const ReferralLinkModal = ({ isOpen, onClose, lenderId, borrowerId }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = borrowerId
    ? `${window.location.origin}/register/borrower?lenderId=${lenderId}&ref=${borrowerId}`
    : `${window.location.origin}/register/borrower?lenderId=${lenderId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {borrowerId ? 'Borrower Referral Link' : 'New Borrower Registration Link'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            {borrowerId
              ? 'Share this link to allow this borrower to continue their application process:'
              : 'Share this link to invite a new borrower to register:'}
          </p>
          <div className="mt-2 flex rounded-md shadow-sm">
            <input
              type="text"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={referralLink}
              readOnly
            />
            <button
              onClick={copyToClipboard}
              className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md text-sm font-medium ${copied
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2 text-gray-500" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm text-blue-700">
              <p>
                The borrower will be automatically linked to your account when they register using this link.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralLinkModal;
