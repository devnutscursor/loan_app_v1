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
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill text-success" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          </div>
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
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-x-circle-fill text-danger" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        </div>
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
