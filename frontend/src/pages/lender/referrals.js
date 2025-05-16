import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.service';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { Copy, Share2, User, Users, Link } from 'lucide-react';

const ReferralLinks = () => {
  const router = useRouter();
  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Fetch lender details
  const fetchLenderProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Make the API request using the configured API service
      const response = await api.get('/api/v1/lenders/profile');
      
      setLender(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lender profile:', err);
      setError('Failed to load your profile. Please try again later.');
      // Toast error is handled by API service interceptors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLenderProfile();
  }, [fetchLenderProfile]);

  // Generate referral link
  const generateGeneralLink = useCallback(() => {
    if (!lender) return '';
    return `${window.location.origin}/register/borrower?lenderId=${lender._id}`;
  }, [lender]);

  // Copy to clipboard function
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(type);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy. Please try again.');
    });
  };

  // Share via email
  const shareViaEmail = (linkType) => {
    const link = linkType === 'general' ? generateGeneralLink() : '';
    const subject = encodeURIComponent('Register for your loan application');
    const body = encodeURIComponent(`Hello,\n\nPlease use this link to register for your loan application:\n\n${link}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Referral Links</h1>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-indigo-200"></div>
              <p className="mt-2 text-sm text-gray-500">Loading your referral links...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex space-x-4 border-b border-gray-200">
                  <button
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${
                      activeTab === 'general'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('general')}
                  >
                    General Referral Link
                  </button>
                  <button
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${
                      activeTab === 'qr'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('qr')}
                  >
                    QR Code
                  </button>
                </div>
              </div>

              {activeTab === 'general' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Borrower Registration Link
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Share this link with potential borrowers to register them under your account.
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <label htmlFor="general-link" className="block text-sm font-medium text-gray-700">
                      Your general registration link
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <div className="relative flex items-stretch flex-grow">
                        <input
                          type="text"
                          id="general-link"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                          value={generateGeneralLink()}
                          readOnly
                        />
                      </div>
                      <button
                        type="button"
                        className={`inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium ${
                          copySuccess === 'general'
                            ? 'text-green-700 bg-green-100 hover:bg-green-200'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => copyToClipboard(generateGeneralLink(), 'general')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {copySuccess === 'general' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => shareViaEmail('general')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share via Email
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:px-6">
                    <h3 className="text-sm font-medium text-gray-500">How it works</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>When a borrower uses this link, they will:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Be directed to a registration page that's pre-filled with your lender ID</li>
                        <li>Create their borrower account that's automatically associated with you</li>
                        <li>Appear in your "Borrowers" section once registered</li>
                        <li>All their loans will be associated with your account</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <Link className="h-5 w-5 mr-2" />
                      QR Code for Borrower Registration
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Use this QR code in printed materials or to quickly share your registration link.
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 flex justify-center">
                    <div className="text-center">
                      <div className="bg-white border border-gray-200 p-2 inline-block">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateGeneralLink())}`} 
                          alt="QR Code for borrower registration" 
                          className="h-52 w-52"
                        />
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateGeneralLink())}`;
                            window.open(qrImageUrl, '_blank');
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Download QR Code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-indigo-700">
                      You can also manage and view your borrowers from the <a href="/lender/borrowers" className="font-medium underline">Borrowers page</a>.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ReferralLinks;
