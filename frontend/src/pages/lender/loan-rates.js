import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import MainLayout from '../../components/layout/MainLayout';
import LoanRates from '../../components/lender/pricing-engine/PricingEngine';
import { PPE_ENABLED } from '../../config/featureFlags';

const LoanRatesPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!PPE_ENABLED) {
      router.replace('/lender/dashboard');
    }
  }, [router]);

  if (!PPE_ENABLED) {
    return null;
  }

  return (
    <MainLayout title="Loan Rates">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />
      <div className="py-6">
        <LoanRates />
      </div>
    </MainLayout>
  );
};

export default LoanRatesPage;
