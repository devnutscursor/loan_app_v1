import React from 'react';
import { FiUser, FiMail, FiPhone, FiSave, FiBriefcase } from 'react-icons/fi';
import ProfileField from '../../common/ProfileField';

/**
 * Component for the profile form with all input fields
 * Handles form submission and displays all profile fields
 */
const ProfileForm = ({ 
  profileData, 
  errors, 
  saving, 
  onChange, 
  onSubmit, 
  onEmailEditClick 
}) => {
  return (
    <div className="md:w-2/3">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ProfileField 
            label="First Name" 
            name="firstName" 
            value={profileData.firstName} 
            onChange={onChange}
            icon={FiUser}
            required
          />
          <ProfileField 
            label="Last Name" 
            name="lastName" 
            value={profileData.lastName} 
            onChange={onChange}
            icon={FiUser}
            required
          />
        
          <ProfileField
            label="Email"
            name="email"
            type="email"
            disabled
            value={profileData.email}
            onChange={onChange}
            icon={FiMail}
            showEditIcon={true}
            onEditClick={onEmailEditClick}
          />
          <ProfileField 
            label="Phone" 
            name="phone" 
            type="tel"
            value={profileData.phone} 
            onChange={onChange}
            icon={FiPhone}
            required
          />
          
          <ProfileField 
            label="User Role" 
            name="role" 
            value={profileData.role}
            disabled
            icon={FiBriefcase}
          />
        </div>
        
        <div className="pt-8 mt-8 border-t border-gray-100 flex justify-center">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
