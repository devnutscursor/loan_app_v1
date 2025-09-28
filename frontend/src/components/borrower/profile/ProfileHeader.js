import React from 'react';

/**
 * Component for the profile page header
 * Shows title and description for the profile settings section
 */
const ProfileHeader = () => {
  return (
    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
      <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
      <p className="mt-1 text-sm text-gray-500">
        Manage your personal information and account settings
      </p>
    </div>
  );
};

export default ProfileHeader;
