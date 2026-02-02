import React from 'react';
import Script from 'next/script';
import MainLayout from '../../components/layout/MainLayout';
import LoanRates from '../../components/lender/pricing-engine/PricingEngine';

const LoanRatesPage = () => (
  <MainLayout title="Loan Rates">
    <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />
    <div className="py-6">
      <LoanRates />
    </div>
  </MainLayout>
);

export default LoanRatesPage;
