import React from 'react';
import MainLayout from './MainLayout';

/**
 * AdminLayout extends MainLayout with admin-specific settings
 * This provides consistent layout across all admin pages
 */
const AdminLayout = ({ children, title }) => {
  return (
    <MainLayout title={title || 'Admin Dashboard'}>
      <div className="space-y-6">
        {children}
      </div>
    </MainLayout>
  );
};

export default AdminLayout; 