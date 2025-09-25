import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const LoanOfficer = () => {
  const { user, loading } = useAuth();
  const [lenderId, setLenderId] = useState(null);
  const [lenderData, setLenderData] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const resolveLenderId = useCallback(async () => {
    // Prefer a direct lender id on the user if present
    if (user?.lender) {
      setLenderId(typeof user.lender === 'object' ? user.lender._id || user.lender.id : user.lender);
      return;
    }

    // Try to infer from borrower profile if needed
    try {
      setFetching(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borrower/profile`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined, timeout: 10000 }
      );
      const borrower = res?.data?.data;
      const id = borrower?.lender?._id || borrower?.lender || null;
      if (id) setLenderId(id);
      else setFetchError('No lender assigned to your profile yet.');
    } catch (e) {
      console.error('Error resolving lender id:', e);
      setFetchError('Failed to resolve your assigned loan officer.');
    } finally {
      setFetching(false);
    }
  }, [user]);

  const fetchPublicLender = useCallback(async (id) => {
    if (!id) return;
    try {
      setFetching(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lenders/public/${id}`,
        { timeout: 10000 }
      );
      console.log("res", res.data.data);
      setLenderData(res?.data?.data || null);
      setFetchError(null);
    } catch (e) {
      console.error('Failed fetching public lender profile:', e);
      setFetchError('Unable to load loan officer details.');
      toast.error('Unable to load loan officer details');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) return; // MainLayout will show general nav; optionally route to login
    resolveLenderId();
  }, [loading, user, resolveLenderId]);

  useEffect(() => {
    if (lenderId) fetchPublicLender(lenderId);
  }, [lenderId, fetchPublicLender]);

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-0 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Your Loan Officer
            </h2>
            <p className="mt-2 text-sm text-gray-600">View your assigned loan officer and lender details</p>
          </div>

          <div className="space-y-6">
            {/* Loading / Error states */}
            {fetching && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="animate-spin mx-auto rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <div className="mt-3 text-gray-600 text-sm">Loading loan officer details…</div>
              </div>
            )}
            {!fetching && fetchError && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <div className="text-red-700 font-medium">{fetchError}</div>
                <div className="text-sm text-gray-600 mt-1">If this seems wrong, please contact support or your lender.</div>
              </div>
            )}

            {/* Content */}
            {!fetching && lenderData && (
              <>
                {/* Company Section */}
                {lenderData.company && (
                  <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 ring-1 ring-blue-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Lender Company</h3>
                    <hr className="border-t border-gray-300 mb-4" />
                    <div className="flex items-center gap-6 flex-col sm:flex-row mt-10">
                      <div className="w-20 h-20 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {lenderData.company.logoUrl ? (
                          <img src={lenderData.company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-gray-400 text-xs">No Logo</span>
                        )}
                      </div>
                      <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
                        <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Name: </span> {lenderData.company.name}</div>
                        <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">NMLS: </span> {lenderData.company.nmls || '—'}</div>
                        <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Phone: </span> {lenderData.company.phone || '—'}</div>
                        <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Email: </span> {lenderData.company.email || '—'}</div>
                        {lenderData.company.address && (
                          <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                            <span className="text-gray-900 font-bold text-lg">Address: </span>
                            {[lenderData.company.address.addressLine1, lenderData.company.address.city, lenderData.company.address.state, lenderData.company.address.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lender Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Loan Officer</h3>
                  <hr className="border-t border-gray-300 mb-4" />
                  <div className="flex items-center gap-6 flex-col sm:flex-row">
                    <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden min-w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {lenderData.user?.profileImageUrl ? (
                        <img src={lenderData.user.profileImageUrl} alt="Lender" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm">{lenderData.user?.firstName?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
                      <div className="text-gray-900 font-bold text-lg">Name: {lenderData.user?.firstName} {lenderData.user?.lastName}</div>
                      <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Position: </span> {lenderData.clientFacingTitle || lenderData.title || 'Loan Officer'}</div>
                      <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">NMLS: </span> {lenderData.nmls || '—'}</div>
                      <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Phone: </span> {lenderData.phone || lenderData.mobilePhone || '—'}</div>
                      <div className="flex items-center gap-2"><span className="text-gray-900 font-bold text-lg">Email: </span> {lenderData.email || lenderData.user?.email || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  Need to contact your loan officer? Visit the Messages section or
                  {' '}<Link href="/borrower/dashboard" className="text-blue-600 hover:text-blue-700">go back to dashboard</Link>.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoanOfficer;


