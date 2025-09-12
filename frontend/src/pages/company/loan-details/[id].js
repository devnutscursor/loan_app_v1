import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import CompanyLayout from '../../../components/layout/CompanyLayout';
import LenderLoanDetails from '../../lender/loans/[id]';

const CompanyLoanDetailsWrapper = () => {
  const router = useRouter();
  const { user } = useAuth();
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
