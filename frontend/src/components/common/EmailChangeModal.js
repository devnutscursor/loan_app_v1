import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiMail, FiX, FiAlertCircle } from 'react-icons/fi';
import UserService from '../../services/user.service';
import EmailVerificationPending from './EmailVerificationPending';

const EmailChangeModal = ({ isOpen, onClose, currentEmail, onVerificationSent, onEmailChanged }) => {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate new email
    if (!newEmail.trim()) {
      setErrors({ newEmail: 'New email is required' });
      return;
    }
    
    if (!validateEmail(newEmail)) {
      setErrors({ newEmail: 'Please enter a valid email address' });
      return;
    }
    
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setErrors({ newEmail: 'New email must be different from current email' });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await UserService.requestEmailChange(newEmail);
      
      if (result.success) {
        toast.success('Verification email sent! Please check your email.');
        setPendingEmail(newEmail);
        setNewEmail('');
        setShowVerificationPending(true);
        if (onVerificationSent) {
          onVerificationSent(newEmail);
        }
      } else {
        if (result.message.includes('already in use')) {
          setErrors({ newEmail: 'This email is already in use by another account' });
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Email change request error:', error);
      toast.error('Failed to request email change');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail('');
    setErrors({});
    onClose();
  };

  const handleVerificationComplete = (newEmail) => {
    setShowVerificationPending(false);
    setPendingEmail('');
    
    // Call the callback to update the parent component's email state
    if (onEmailChanged) {
      onEmailChanged(newEmail);
    }
    
    // Close the modal
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Change Email Address</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Email Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Email
            </label>
            <div className="flex items-center p-3 bg-gray-50 rounded-md">
              <FiMail className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-600">{currentEmail}</span>
            </div>
          </div>

          {/* New Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.newEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your new email address"
                disabled={loading}
              />
            </div>
            {errors.newEmail && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="h-4 w-4 mr-1" />
                {errors.newEmail}
              </p>
            )}
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Email Change Process:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>A verification email will be sent to your new email address</li>
                  <li>Your current email will remain active until verification</li>
                  <li>Click the verification link to complete the change</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Email Verification Pending Modal */}
      <EmailVerificationPending
        isOpen={showVerificationPending}
        onClose={() => setShowVerificationPending(false)}
        pendingEmail={pendingEmail}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
};

export default EmailChangeModal;
