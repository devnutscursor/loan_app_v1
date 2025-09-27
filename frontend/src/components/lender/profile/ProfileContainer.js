import React from 'react';
import ProfileHeader from './ProfileHeader';
import ProfilePicture from './ProfilePicture';
import ProfileInformation from './ProfileInformation';

const ProfileContainer = ({ 
  form, 
  saving, 
  uploading, 
  deleting, 
  onFormChange, 
  onFormSubmit, 
  onImageUpload, 
  onImageDelete, 
  onEmailEditClick 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <ProfileHeader />
      
      <div className="px-8 py-10">
        <div className="space-y-6">
          <ProfilePicture
            profileImage={form.profileImage}
            uploading={uploading}
            deleting={deleting}
            onImageUpload={onImageUpload}
            onImageDelete={onImageDelete}
          />

          <ProfileInformation
            form={form}
            saving={saving}
            onFormChange={onFormChange}
            onFormSubmit={onFormSubmit}
            onEmailEditClick={onEmailEditClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileContainer;
