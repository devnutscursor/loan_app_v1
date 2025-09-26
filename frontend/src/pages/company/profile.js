import React from 'react';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { useCompanyProfile } from '@/hooks/company/useCompanyProfile';
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
      </div>
    </CompanyLayout>
  );
}

export default CompanyProfile;
