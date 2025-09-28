import React from 'react';
import MainLayout from '../../layout/MainLayout';
import ProtectedRoute from '../../auth/ProtectedRoute';

/**
 * Component for displaying loading state while profile data is being fetched
 * Shows animated spinner with centered layout
 */
const ProfileLoadingState = () => {
  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Profile">
        <div className="flex justify-center items-center min-h-screen py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ProfileLoadingState;
