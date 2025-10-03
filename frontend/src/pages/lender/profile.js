import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useLenderProfile } from '../../hooks/lender/useLenderProfile';
import LoadingSpinner from '../../components/lender/profile/LoadingSpinner';
import ProfileContainer from '../../components/lender/profile/ProfileContainer';
import EmailChangeModal from '../../components/common/EmailChangeModal';
import LenderProfileTabs from '../../components/lender/profile/LenderProfileTabs';
import { useLenderCredentials } from '../../hooks/lender/useLenderCredentials';
import CredentialList from '../../components/lender/credentials/CredentialList';
import AddCredentialModal from '../../components/lender/credentials/AddCredentialModal';
import EditCredentialModal from '../../components/lender/credentials/EditCredentialModal';
import { useEffect, useMemo, useState } from 'react';

const ProfilePage = () => {
  const {
    user,
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

  const [activeTab, setActiveTab] = useState('profile');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const userId = user?._id;
  const companyId = user?.company;
  const creds = useLenderCredentials({ userId, companyId, role: user?.role });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute roles={"lender"}>
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 px-0 sm:px-6 lg:px-8">
          <LenderProfileTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === 'profile' && (
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
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-900">Your Vendor Credentials</div>
                <button onClick={() => setAddOpen(true)} className="px-3 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">Add</button>
              </div>
              <CredentialList
                items={creds.credentials}
                onClick={(c) => { setSelected(c); setEditOpen(true); }}
                onDelete={creds.remove}
              />
            </div>
          )}
        </div>
      </MainLayout>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={emailChangeModalOpen}
        onClose={() => setEmailChangeModalOpen(false)}
        currentEmail={form.email}
        onEmailChanged={handleEmailChanged}
      />

      {/* Add/Edit Modals */}
      <AddCredentialModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={creds.create}
        vendors={creds.vendors}
      />
      <EditCredentialModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={creds.update}
        onDelete={creds.remove}
        vendors={creds.vendors}
        credential={selected}
      />
    </ProtectedRoute>
  );
};

export default ProfilePage;
