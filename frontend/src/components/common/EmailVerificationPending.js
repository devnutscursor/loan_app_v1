import React, { useState, useEffect } from 'react';
import { FiMail, FiClock, FiRefreshCw, FiCheckCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import UserService from '../../services/user.service';

const EmailVerificationPending = ({ isOpen, onClose, pendingEmail, onVerificationComplete }) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [isResending, setIsResending] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await UserService.requestEmailChange(pendingEmail);
      if (result.success) {
        toast.success('Verification email resent successfully');
        setTimeLeft(24 * 60 * 60); // Reset timer
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      // Check if user's email has been updated by fetching current profile
      const profile = await UserService.getUserProfile();
      if (profile.success) {
        if (profile.data.user.email === pendingEmail) {
          toast.success('Email verification completed!');
          onVerificationComplete(pendingEmail);
          onClose();
        } else {
          toast.info('Email verification is still pending. Please check your email and click the verification link.');
        }
      } else {
        toast.error(profile.message || 'Unable to check verification status. Please try again.');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast.error('Unable to check verification status. Please try again or contact support if the issue persists.');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Email Verification Pending</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FiMail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Verification Email Sent
            </h4>
            <p className="text-gray-600 mb-4">
              We've sent a verification email to:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="font-medium text-blue-900">{pendingEmail}</p>
            </div>
            <p className="text-sm text-gray-500">
              Please check your email and click the verification link to complete the email change.
            </p>
          </div>

          {/* Timer */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Time remaining:</span>
              <span className="text-sm font-mono text-gray-900">{formatTime(timeLeft)}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / (24 * 60 * 60)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-yellow-800 mb-2">Next Steps:</h5>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Your email will be updated automatically</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingStatus ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-2 h-4 w-4" />
                  Check Verification Status
                </>
              )}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isResending || timeLeft > 23 * 60 * 60} // Allow resend after 1 hour
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resending...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Resend Email
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;
