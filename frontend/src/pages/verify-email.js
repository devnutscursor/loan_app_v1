import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const VerifyEmail = () => {
  const router = useRouter();
  const { token } = router.query;
  
  const [verificationState, setVerificationState] = useState({
    loading: true,
    verified: false,
    error: null
  });

  useEffect(() => {
    const verifyEmail = async () => {
      // Only verify if token is available (after router is ready)
      if (!token) return;

      setVerificationState({ loading: true, verified: false, error: null });

      try {
        // Call API endpoint to verify email
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email/${token}`
        );

        setVerificationState({
          loading: false,
          verified: true,
          error: null
        });

        // Show success message
        toast.success('Email verified successfully! You can now log in.');
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationState({
          loading: false,
          verified: false,
          error: error.response?.data?.message || 'Verification failed. Please try again.'
        });

        toast.error(
          error.response?.data?.message || 'Verification failed. Please try again.'
        );
      }
    };

    verifyEmail();
  }, [token]);

  const renderContent = () => {
    if (verificationState.loading) {
      return (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying your email address...</p>
        </div>
      );
    }

    if (verificationState.verified) {
      return (
        <div className="text-center">
          <h2>Email Verified!</h2>
          <p className="mb-4">Your email has been successfully verified.</p>
          <Link href="/login" passHref>
            <button className="btn btn-primary">Log in to your account</button>
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2>Verification Failed</h2>
        <p className="mb-4">
          {verificationState.error || 'The verification link may be invalid or expired.'}
        </p>
        <Link href="/login" passHref>
          <button className="btn btn-outline-primary me-2">Go to Login</button>
        </Link>
        <Link href="/resend-verification" passHref>
          <button className="btn btn-primary">Resend Verification</button>
        </Link>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h1 className="card-title text-center mb-4">Email Verification</h1>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
