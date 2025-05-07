import React from 'react';
import MainLayout from './MainLayout';

/**
 * LenderLayout extends MainLayout with lender-specific settings
 * This provides consistent layout across all lender pages
 */
const LenderLayout = ({ children, title }) => {
  return (
    <MainLayout title={title || 'Lender Dashboard'}>
      <div className="space-y-6">
        {children}
      </div>
    </MainLayout>
  );
};

export default LenderLayout;
