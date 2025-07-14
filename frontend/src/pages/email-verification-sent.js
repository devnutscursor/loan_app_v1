import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';

const EmailVerificationSent = () => {
  const router = useRouter();
  const { email } = router.query;
  const [userEmail, setUserEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Set email from query params when router is ready
  useEffect(() => {
    if (router.isReady && email) {
      setUserEmail(email);
    }
  }, [router.isReady, email]);

  // Cooldown timer for resend button
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error('Email address not found. Please try registering again.');
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-verification`,
        { email: userEmail }
      );

      toast.success('Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 second cooldown
      
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error(
        error.response?.data?.message || 'Failed to resend verification email. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10">
            {/* Email icon */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100">
                <svg
                  className="h-10 w-10 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Main heading */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-sm text-gray-600">
                A verification email has been sent to:
              </p>
              {userEmail && (
                <p className="text-sm font-medium text-blue-600 mt-1">
                  {userEmail}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                What's next?
              </h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return to the login page to access your account</li>
              </ol>
            </div>
            {/* Action buttons */}
            <div>
              {/* Resend verification button */}
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  resendLoading || resendCooldown > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                } transition-colors`}
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  "Resend Verification Email"
                )}
              </button>

              {/* Go to login button with added top margin for spacing */}
              <div className="mt-4">
                <Link href="/login">
                  <button className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Go to Login Page
                  </button>
                </Link>
              </div>
            </div>

            {/* Help text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-500"
                >
                  contact support
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Additional help section */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Need Help?
                </h3>
                <div className="mt-1 text-sm text-gray-600">
                  <p>
                    If you continue to have issues with email verification,
                    please{" "}
                    <Link
                      href="/contact"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      contact our support team
                    </Link>{" "}
                    for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmailVerificationSent;
