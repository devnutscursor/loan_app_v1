import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useLenderProfile } from '../../hooks/lender/useLenderProfile';
import LoadingSpinner from '../../components/lender/profile/LoadingSpinner';
import ProfileContainer from '../../components/lender/profile/ProfileContainer';
import EmailChangeModal from '../../components/common/EmailChangeModal';

const ProfilePage = () => {
  const {
    form,
    loading,
    saving,
    emailChangeModalOpen,
    uploading,
    deleting,
    handleChange,
    handleSubmit,
    handleImageUpload,
    handleImageDelete,
    setEmailChangeModalOpen,
    handleEmailChanged
  } = useLenderProfile();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute roles={"lender"}>
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 px-0 sm:px-6 lg:px-8">
          <ProfileContainer
            form={form}
            saving={saving}
            uploading={uploading}
            deleting={deleting}
            onFormChange={handleChange}
            onFormSubmit={handleSubmit}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            onEmailEditClick={() => setEmailChangeModalOpen(true)}
          />
        </div>
      </MainLayout>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={emailChangeModalOpen}
        onClose={() => setEmailChangeModalOpen(false)}
        currentEmail={form.email}
        onEmailChanged={handleEmailChanged}
      />
    </ProtectedRoute>
  );
};

export default ProfilePage;
