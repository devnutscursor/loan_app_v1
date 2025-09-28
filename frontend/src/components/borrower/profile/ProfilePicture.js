import React from 'react';
import { FiBriefcase } from 'react-icons/fi';

/**
 * Component for displaying user profile picture and basic information
 * Shows user name and role with styling
 */
const ProfilePicture = ({ fullName, role }) => {
  return (
    <div className="md:w-1/3 flex flex-col items-center">
      <div className="text-center mt-2 space-y-1">
        <h3 className="font-medium text-gray-800 text-lg mt-6">{fullName}</h3>
        <div className="capitalize text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-flex items-center">
          <FiBriefcase className="mr-1" size={14} /> {role}
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;
