import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiMail, FiArrowRight } from 'react-icons/fi';
import MainLayout from '../components/layout/MainLayout';
import UserService from '../services/user.service';

const VerifyEmailChangePage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmailChange();
    }
  }, [token]);

  const verifyEmailChange = async () => {
    try {
      const result = await UserService.verifyEmailChange(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred during verification.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email Change</h2>
            <p className="text-gray-600">Please wait while we verify your new email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Successfully Updated!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <FiMail className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">What's Next:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You can now use your new email address to log in</li>
                    <li>All future notifications will be sent to your new email</li>
                    <li>Your account security has been maintained throughout this process</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/login" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Go to Login
                <FiArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <div>
                <Link href="/borrower/profile" className="text-blue-600 hover:text-blue-500 font-medium">
                  Return to Profile
                </Link>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <FiXCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <FiXCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Common Issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The verification link may have expired (links are valid for 24 hours)</li>
                    <li>The link may have been used already</li>
                    <li>The link may be invalid or corrupted</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/borrower/profile" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Try Again from Profile
                <FiArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <div>
                <Link href="/contact" className="text-blue-600 hover:text-blue-500 font-medium">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!router.isReady) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Verify Email Change">
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VerifyEmailChangePage;
