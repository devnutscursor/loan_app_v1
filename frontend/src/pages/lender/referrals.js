import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.service';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { Copy, Share2, User, Users, Link, ArrowRight } from 'lucide-react';

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-6">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div key={item} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-12 bg-gray-200 rounded-md w-full mt-4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReferralLinks = () => {
  const router = useRouter();
  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const fetchLenderProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/lenders/profile');
      setLender(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lender profile:', err);
      setError('Failed to load your profile. Please try again later.');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLenderProfile();
  }, [fetchLenderProfile]);

  const generateGeneralLink = useCallback(() => {
    if (!lender) return '';
    return `${window.location.origin}/register/borrower?lenderId=${lender._id}`;
  }, [lender]);

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

  const shareViaEmail = (linkType) => {
    const link = linkType === 'general' ? generateGeneralLink() : '';
    const subject = encodeURIComponent('Register for your loan application');
    const body = encodeURIComponent(`Hello,\n\nPlease use this link to register for your loan application:\n\n${link}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Links</h1>
          <p className="mt-2 text-gray-600">Share these links to invite borrowers to join your network</p>
        </div>
        
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['general', 'qr'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                  >
                    {tab === 'general' ? 'General Link' : 'QR Code'}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
              {activeTab === 'general' ? (
                <>
                  <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Link className="h-5 w-5" />
                      </div>
                      <h2 className="ml-3 text-lg font-medium text-gray-900">Borrower Registration Link</h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Share this link with potential borrowers to register them under your account</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="general-link" className="block text-sm font-medium text-gray-700 mb-1">
                          Your registration link
                        </label>
                        <div className="flex rounded-md shadow-sm">
                          <input
                            type="text"
                            id="general-link"
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={generateGeneralLink()}
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generateGeneralLink(), 'general')}
                            className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md text-sm font-medium ${copySuccess === 'general' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                          >
                            <Copy className={`h-4 w-4 mr-2 ${copySuccess === 'general' ? 'text-green-600' : 'text-gray-500'}`} />
                            {copySuccess === 'general' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">How it works</h3>
                        <ul className="space-y-3">
                          {[
                            'Be directed to a registration page with your lender ID',
                            'Borrowers create accounts associated with you',
                            'New borrowers appear in your dashboard',
                            'All their loans will be under your management'
                          ].map((item, idx) => (
                            <li key={idx} className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>
                              <span className="ml-2 text-sm text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Link className="h-5 w-5" />
                      </div>
                      <h2 className="ml-3 text-lg font-medium text-gray-900">QR Code</h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Use this QR code for printed materials or quick sharing</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateGeneralLink())}`} 
                          alt="QR Code for borrower registration" 
                          className="h-52 w-52"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generateGeneralLink(), 'qr')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copySuccess === 'qr' ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ReferralLinks;
