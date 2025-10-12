import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import EmailChangeModal from '../../components/common/EmailChangeModal';
import ProfileHeader from '../../components/borrower/profile/ProfileHeader';
import ProfilePicture from '../../components/borrower/profile/ProfilePicture';
import ProfileForm from '../../components/borrower/profile/ProfileForm';
import ProfileLoadingState from '../../components/borrower/profile/ProfileLoadingState';
import CreditSettings from '../../components/borrower/profile/CreditSettings';
import { useProfile } from '../../hooks/useProfile';

const Profile = () => {
  const {
    // State
    loading,
    saving,
    emailChangeModalOpen,
    setEmailChangeModalOpen,
    profileData,
    errors,
    
    // Handlers
    handleChange,
    handleSubmit,
    handleEmailChanged,
    
    // Computed values
    fullName
  } = useProfile();

  if (loading) {
    return <ProfileLoadingState />;
  }

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Profile">
        <div className="max-w-7xl mx-auto py-8 px-0 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Profile Header */}
            <ProfileHeader />

            <div className="px-4 md:px-8 py-10">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Profile Picture */}
                <ProfilePicture 
                  fullName={fullName}
                  role={profileData.role}
                />

                {/* Profile Form */}
                <ProfileForm
                  profileData={profileData}
                  errors={errors}
                  saving={saving}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onEmailEditClick={() => setEmailChangeModalOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* Credit Settings Section */}
          <div className="mt-8">
            <CreditSettings />
          </div>
        </div>

        {/* Email Change Modal */}
        <EmailChangeModal
          isOpen={emailChangeModalOpen}
          onClose={() => setEmailChangeModalOpen(false)}
          currentEmail={profileData.email}
          onEmailChanged={handleEmailChanged}
        />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Profile;