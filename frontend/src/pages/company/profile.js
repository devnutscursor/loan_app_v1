import React from 'react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useCompanyProfile } from '@/hooks/company/useCompanyProfile';
import CredentialList from '@/components/lender/credentials/CredentialList';
import AddCredentialModal from '@/components/lender/credentials/AddCredentialModal';
import EditCredentialModal from '@/components/lender/credentials/EditCredentialModal';
import { useCompanyCredentials } from '@/hooks/company/useCompanyCredentials';
import { useMemo, useState } from 'react';
import LenderProfileTabs from '@/components/lender/profile/LenderProfileTabs';
import ProfileHeader from '@/components/company/profile/ProfileHeader';
import LogoCard from '@/components/company/profile/LogoCard';
import CompanyInfoSection from '@/components/company/profile/CompanyInfoSection';
import StatsSection from '@/components/company/profile/StatsSection';
import PrimaryContactSection from '@/components/company/profile/PrimaryContactSection';

const CompanyProfile = () => {
  const {
    loading,
    saving,
    editing,
    setEditing,
    company,
    formData,
    logoUploading,
    logoDeleting,
    handleLogoUpload,
    handleLogoDelete,
    handleInputChange,
    handleSave,
    handleCancel,
  } = useCompanyProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const companyId = useMemo(() => company?._id, [company]);
  const creds = useCompanyCredentials({ companyId });
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <CompanyLayout title="Company Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Profile">
      <div className="max-w-[1215px] mx-auto space-y-6">
        {/* Tabs */}
        <LenderProfileTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'profile' && (
          <>
            <ProfileHeader
              editing={editing}
              saving={saving}
              onEdit={() => setEditing(true)}
              onCancel={handleCancel}
              onSave={handleSave}
            />

            <LogoCard
              company={company}
              logoUploading={logoUploading}
              logoDeleting={logoDeleting}
              onUpload={handleLogoUpload}
              onDelete={handleLogoDelete}
            />
            <CompanyInfoSection
              company={company}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <StatsSection company={company} />
            <PrimaryContactSection company={company} />
          </>
        )}

        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-900">Company Vendor Credentials</div>
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
      {/* Add/Edit Modals (reuse lender modals) */}
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
    </CompanyLayout>
  );
}

export default CompanyProfile;
