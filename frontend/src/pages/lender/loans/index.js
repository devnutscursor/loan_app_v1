import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../../components/layout/MainLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { lenderService } from '../../../services/api';
import { toast } from 'react-hot-toast';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const LenderLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const response = await lenderService.getLoans();
        const data = response.data?.data?.loans || [];
        setLoans(data);
      } catch (e) {
        console.error('Error fetching lender loans:', e);
        toast.error('Failed to load loans');
        setError('Failed to load loans');
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  return (
    <ProtectedRoute allowedRoles={[ 'lender' ]}>
      <MainLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Active Loans</h1>
            <p className="mt-1 text-sm text-gray-500">List of active loan applications</p>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : loans.length === 0 ? (
              <div>No active loans found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {loans.map((loan) => (
                  <Link
                    key={loan._id}
                    href={`/lender/loans/${loan._id}`}
                    className="block bg-white p-4 rounded-lg shadow hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          {loan.borrowerDetails.firstName} {loan.borrowerDetails.lastName}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Loan Number: {loan.loanNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Amount: {formatCurrency(loan.loanDetails?.loanAmount || 0)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{formatDate(loan.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default LenderLoans;
