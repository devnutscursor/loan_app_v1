import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReferralsSkeletonLoader from '../../components/lender/referrals/ReferralsSkeletonLoader';
import ReferralsPageHeader from '../../components/lender/referrals/ReferralsPageHeader';
import TabNavigation from '../../components/lender/referrals/TabNavigation';
import GeneralLinkTab from '../../components/lender/referrals/GeneralLinkTab';
import QRCodeTab from '../../components/lender/referrals/QRCodeTab';
import useReferrals from '../../hooks/lender/useReferrals';

const ReferralLinks = () => {
  const {
    // Data
    lender,
    activeTab,
    copySuccess,
    
    // Loading states
    loading,
    error,
    
    // Event handlers
    setActiveTab,
    generateGeneralLink,
    copyToClipboard,
    shareViaEmail
  } = useReferrals();

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ReferralsPageHeader />
        
        {loading ? (
          <ReferralsSkeletonLoader />
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
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
              {activeTab === 'general' ? (
                <GeneralLinkTab
                  generateGeneralLink={generateGeneralLink}
                  copySuccess={copySuccess}
                  onCopyToClipboard={copyToClipboard}
                />
              ) : (
                <QRCodeTab
                  generateGeneralLink={generateGeneralLink}
                  copySuccess={copySuccess}
                  onCopyToClipboard={copyToClipboard}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ReferralLinks;
