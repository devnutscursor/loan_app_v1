import React from 'react';
import { FiUser, FiMail, FiPhone, FiSave, FiBriefcase } from 'react-icons/fi';
import ProfileField from '../../common/ProfileField';

const ProfileInformation = ({ 
  form, 
  saving, 
  onFormChange, 
  onFormSubmit, 
  onEmailEditClick 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal & Contact Information</h2>
      <form onSubmit={onFormSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ProfileField 
            label="First Name" 
            name="firstName" 
            value={form.firstName} 
            onChange={onFormChange}
            icon={FiUser}
            required
          />
          <ProfileField 
            label="Middle Name" 
            name="middleName" 
            value={form.middleName} 
            onChange={onFormChange}
            icon={FiUser}
          />
          <ProfileField 
            label="Last Name" 
            name="lastName" 
            value={form.lastName} 
            onChange={onFormChange}
            icon={FiUser}
            required
          />
        
          <ProfileField
            label="Email"
            name="email"
            type="email"
            disabled
            value={form.email}
            onChange={onFormChange}
            icon={FiMail}
            showEditIcon={true}
            onEditClick={onEmailEditClick}
          />
          <ProfileField 
            label="Mobile Phone" 
            name="mobilePhone" 
            type="tel"
            value={form.mobilePhone || ''} 
            onChange={onFormChange}
            icon={FiPhone}
          />
          <ProfileField 
            label="Office Phone" 
            name="officePhone" 
            type="tel"
            value={form.officePhone || ''} 
            onChange={onFormChange}
            icon={FiPhone}
          />
          <ProfileField 
            label="Office Ext" 
            name="officePhoneExt" 
            value={form.officePhoneExt || ''} 
            onChange={onFormChange}
            icon={FiPhone}
          />
          <ProfileField 
            label="Client-Facing Title" 
            name="clientFacingTitle" 
            value={form.clientFacingTitle || ''} 
            onChange={onFormChange}
            icon={FiBriefcase}
          />
          <ProfileField 
            label="NMLS ID #" 
            name="nmls" 
            value={form.nmls || ''} 
            onChange={onFormChange}
            icon={FiBriefcase}
          />

          <ProfileField 
            label="User Role" 
            name="role" 
            value={form.role}
            disabled
            icon={FiBriefcase}
          />
          <ProfileField 
            label="Twitter Handle" 
            name="twitter" 
            value={form.twitter || ''} 
            onChange={onFormChange}
            icon={FiBriefcase}
          />
          <ProfileField 
            label="Facebook URL" 
            name="facebook" 
            value={form.facebook || ''} 
            onChange={onFormChange}
            icon={FiBriefcase}
          />
          <ProfileField 
            label="LinkedIn URL" 
            name="linkedin" 
            value={form.linkedin || ''} 
            onChange={onFormChange}
            icon={FiBriefcase}
          />
          <ProfileField 
            label="Instagram Handle" 
            name="instagram" 
            value={form.instagram || ''} 
            onChange={onFormChange}
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

export default ProfileInformation;
