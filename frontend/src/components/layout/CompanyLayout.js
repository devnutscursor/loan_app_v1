import React from 'react';
import MainLayout from './MainLayout';

/**
 * CompanyLayout extends MainLayout with company-specific settings
 * This provides consistent layout across all company pages
 */
const CompanyLayout = ({ children, title }) => {
  return (
    <MainLayout title={title || 'Company Dashboard'}>
      <div className="space-y-6">
        {children}
      </div>
    </MainLayout>
  );
};

export default CompanyLayout;
