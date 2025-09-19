import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import CompanyLayout from '../../../components/layout/CompanyLayout';
import LenderLoanDetails from '../../lender/loans/[id]';

const CompanyLoanDetailsWrapper = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading while hydrating
  if (!isClient) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </CompanyLayout>
    );
  }

  const { id, borrowerId, lenderId } = router.query;

  // Redirect to login if not a company user
  if (!user || user.role !== 'company') {
    router.push('/login');
    return null;
  }

  // Determine the back URL based on whether borrowerId is provided
  const backUrl = borrowerId 
    ? `/company/lender-borrowers/${borrowerId}/loans${lenderId ? `?lenderId=${lenderId}` : ''}`
    : '/company/lenders';

  return (
    <CompanyLayout>
      <LenderLoanDetails 
        backUrl={backUrl}
        isCompanyView={true}
      />
    </CompanyLayout>
  );
};

export default CompanyLoanDetailsWrapper;