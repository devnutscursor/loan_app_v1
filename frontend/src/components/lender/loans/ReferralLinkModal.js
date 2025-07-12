import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReferralLinkModal = ({ isOpen, onClose, lenderId }) => {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && lenderId) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/register/borrower?lenderId=${lenderId}`;
      setReferralLink(link);
    }
  }, [isOpen, lenderId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invite Borrower</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Share this link with your borrower to invite them to register and complete their loan application:
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 break-all">
                <div className="flex items-center">
                  <LinkIcon size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{referralLink}</span>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-2 rounded-md ${
                  copied
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              The borrower will be automatically linked to your account when they register.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralLinkModal; 