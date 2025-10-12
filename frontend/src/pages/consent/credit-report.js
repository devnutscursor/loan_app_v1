import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { Shield, CheckCircle, AlertTriangle, Clock, Mail } from 'lucide-react';
import customAxios from '../../utils/axios';

/**
 * Public Credit Report Consent Page
 * 
 * Accessible via email link (no login required)
 * Allows borrowers to provide credit report authorization
 */
export default function CreditReportConsentPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (token && router.isReady) {
      verifyToken();
    }
  }, [token, router.isReady]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customAxios.get(`/api/v1/consent-email/verify-token/${token}`);
      
      if (response.data.success) {
        setTokenData(response.data.data);
      }
    } catch (err) {
      console.error('Error verifying token:', err);
      
      if (err.response?.data?.error === 'TOKEN_EXPIRED') {
        setError('expired');
      } else if (err.response?.data?.error === 'TOKEN_ALREADY_USED') {
        setError('already_used');
      } else {
        setError('invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async () => {
    if (!agreed) {
      toast.error('Please confirm you understand and agree to provide authorization');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await customAxios.post('/api/v1/consent-email/grant-via-token', {
        token
      });
      
      if (response.data.success) {
        setSuccess(true);
        toast.success('Authorization provided successfully!');
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      console.error('Error granting consent:', err);
      toast.error(err.response?.data?.message || 'Failed to provide authorization');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-gray-600">Verifying authorization request...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Link Expired</h1>
            <p className="text-gray-600">
              This authorization request link has expired. Please contact your lender for a new link.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'already_used') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Already Authorized</h1>
            <p className="text-gray-600">
              You have already provided authorization using this link. No further action is needed.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
            <p className="text-gray-600">
              This authorization link is invalid or has been revoked. Please contact your lender for assistance.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-900">Authorization Granted!</h1>
            <p className="text-gray-600">
              Thank you for providing your authorization. Your lender can now access your credit report 
              to evaluate your loan application.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You will be redirected to the home page in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main consent form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Credit Report Authorization</h1>
          <p className="text-blue-100">Secure consent request from {tokenData?.lenderName}</p>
        </div>
        
        {/* Body */}
        <div className="p-8">
          {/* Borrower Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Authorization for:</p>
            <p className="text-lg font-semibold text-gray-900">{tokenData?.borrowerName}</p>
            <p className="text-sm text-gray-500">{tokenData?.borrowerEmail}</p>
          </div>
          
          {/* What this is */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What is this?</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>{tokenData?.lenderName}</strong> has requested your authorization to obtain your 
              credit report from credit reporting agencies for the purpose of evaluating your loan application.
            </p>
          </div>
          
          {/* What it means */}
          <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What this means:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Your lender will be able to pull your credit report from Equifax, Experian, and/or TransUnion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>This authorization will remain valid for future loan applications with this lender</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Your credit information will be used solely for loan evaluation purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>You can revoke this authorization at any time</span>
              </li>
            </ul>
          </div>
          
          {/* FCRA Compliance */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Legal Information</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This authorization is compliant with the Fair Credit Reporting Act (FCRA). By providing 
              authorization, you acknowledge that {tokenData?.lenderName} has a permissible purpose 
              to obtain your credit report. Your information will be handled in accordance with federal 
              and state privacy laws.
            </p>
          </div>
          
          {/* Consent Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                <strong className="text-gray-900">I understand and authorize</strong> {tokenData?.lenderName} to 
                obtain my credit report from credit reporting agencies for the purpose of evaluating my 
                loan application. This authorization will remain valid for future applications.
              </span>
            </label>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGrantConsent}
              disabled={!agreed || submitting}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Provide Authorization'
              )}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              disabled={submitting}
              className="w-full py-2 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {/* Expiration Notice */}
          {tokenData?.expiresAt && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                This authorization link expires on {new Date(tokenData.expiresAt).toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              If you did not request a loan with {tokenData?.lenderName}, please disregard this page 
              and close your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

