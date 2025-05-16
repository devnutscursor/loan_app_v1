import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.service';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import { Clipboard, ArrowUpRight, Plus, UserPlus } from 'lucide-react';

// Component for displaying each borrower
const BorrowerCard = ({ borrower, onShowReferralLink }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md mb-4">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {borrower.user?.firstName} {borrower.user?.lastName}
          </h3>
          <button
            onClick={() => onShowReferralLink(borrower._id)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Clipboard className="h-4 w-4 mr-1" />
            Get Referral Link
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {borrower.user?.email}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {borrower.user?.phone || 'N/A'}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(borrower.createdAt)}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Loans</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <Link href={`/lender/loans?borrowerId=${borrower._id}`} className="text-indigo-600 hover:text-indigo-900">
                View Loans <ArrowUpRight className="inline h-4 w-4" />
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

// Modal component for displaying and copying the referral link
const ReferralLinkModal = ({ isOpen, onClose, lenderId, borrowerId }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = borrowerId
    ? `${window.location.origin}/register/borrower?lenderId=${lenderId}&ref=${borrowerId}`
    : `${window.location.origin}/register/borrower?lenderId=${lenderId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {borrowerId ? 'Borrower Referral Link' : 'New Borrower Registration Link'}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {borrowerId
            ? 'Share this link to invite someone as a co-borrower for this borrower:'
            : 'Share this link to register new borrowers under your account:'}
        </p>
        <div className="flex mb-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-r-md text-sm font-medium text-white ${
              copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component for the borrowers page
const LenderBorrowers = () => {
  const router = useRouter();
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const [lenderId, setLenderId] = useState(null);

  // Fetch the borrowers associated with this lender
  const fetchBorrowers = useCallback(async () => {
    try {
      setLoading(true);
      // Get lender profile first to get the lender ID
      const lenderResponse = await api.get('/api/v1/lenders/profile');
      const lenderId = lenderResponse.data.data._id;
      setLenderId(lenderId);

      // Now fetch all borrowers for this lender
      const response = await api.get(`/api/v1/lenders/${lenderId}/borrowers`);
      setBorrowers(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
      setError('Failed to load borrowers. Please try again later.');
      toast.error('Failed to load borrowers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  const handleShowReferralLink = (borrowerId = null) => {
    setSelectedBorrowerId(borrowerId);
    setReferralModalOpen(true);
  };

  const handleCloseReferralModal = () => {
    setReferralModalOpen(false);
    setSelectedBorrowerId(null);
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Borrowers</h1>
            <button
              onClick={() => handleShowReferralLink()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add New Borrower
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-indigo-200"></div>
              <p className="mt-2 text-sm text-gray-500">Loading borrowers...</p>
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
          ) : borrowers.length === 0 ? (
            <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowers yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new borrower.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleShowReferralLink()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add New Borrower
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowers.map((borrower) => (
                <BorrowerCard
                  key={borrower._id}
                  borrower={borrower}
                  onShowReferralLink={handleShowReferralLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ReferralLinkModal
        isOpen={referralModalOpen}
        onClose={handleCloseReferralModal}
        lenderId={lenderId}
        borrowerId={selectedBorrowerId}
      />
    </MainLayout>
  );
};

export default LenderBorrowers;
