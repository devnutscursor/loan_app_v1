import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export const useLoanOfficer = () => {
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

  return {
    // State
    user,
    loading,
    lenderId,
    lenderData,
    fetching,
    fetchError,
    
    // Computed values
    hasLenderData: !!lenderData,
    hasCompany: !!(lenderData?.company),
    hasError: !!fetchError,
    isLoading: fetching
  };
};
