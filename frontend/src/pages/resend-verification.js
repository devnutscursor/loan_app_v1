import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const ResendVerification = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get email from query params if available
  useEffect(() => {
    if (router.isReady && router.query.email) {
      setEmail(router.query.email);
    }
  }, [router.isReady, router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-verification`,
        { email }
      );

      toast.success('Verification email sent! Please check your inbox.');
      
      // Clear form
      setEmail('');
      
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error(
        error.response?.data?.message || 'Failed to resend verification email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h1 className="card-title text-center mb-4">Resend Verification Email</h1>
              
              <p className="text-center mb-4">
                Enter your email address below, and we'll send you a new verification link.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="d-grid gap-2 mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : 'Resend Verification Email'}
                  </button>
                </div>
                
                <div className="text-center mt-3">
                  <Link href="/login" className="text-decoration-none">
                    Return to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
