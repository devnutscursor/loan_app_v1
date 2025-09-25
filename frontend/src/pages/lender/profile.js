import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiSave, FiBriefcase, FiTrash2, FiEdit } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { UserService } from '../../services';
import EmailChangeModal from '../../components/common/EmailChangeModal';
import ProfileField from '../../components/common/ProfileField';
import api, { lenderService } from '../../services/api';

const ProfilePage = () => {
  const [form, setForm] = useState({ 
    firstName: '', 
    middleName: '',
    lastName: '', 
    email: '', 
    phone: '',
    role: '',
    profileImage: '',
    // Lender-specific
    nmls: '',
    clientFacingTitle: '',
    officePhone: '',
    officePhoneExt: '',
    mobilePhone: '',
    twitter: '',
    facebook: '',
    linkedin: '',
    instagram: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
      const res = await UserService.getUserProfile();
        if (res.success) {
        const { firstName, middleName, lastName, email, phone, role, profileImage, profileImageUrl } = res.data.user || {};
          setForm(prev => ({ 
            ...prev,
            firstName: firstName || '', 
            middleName: middleName || '',
            lastName: lastName || '', 
            email: email || '', 
            phone: phone || '',
            role: role || 'lender',
            profileImage: profileImageUrl || profileImage || '',
          }));
        } else {
          toast.error(res.message || 'Failed to load profile');
        }

        // Fetch lender profile
        try {
          const lenderRes = await lenderService.getProfile();
          if (lenderRes && lenderRes.data) {
            const l = lenderRes.data.data;
            setForm(prev => ({
              ...prev,
              nmls: l.nmls || '',
              clientFacingTitle: l.clientFacingTitle || l.title || '',
              officePhone: l.officePhone || '',
              officePhoneExt: l.officePhoneExt || '',
              mobilePhone: l.mobilePhone || '',
              twitter: l.socialLinks?.twitter || l.marketingProfile?.socialMediaLinks?.twitter || '',
              facebook: l.socialLinks?.facebook || l.marketingProfile?.socialMediaLinks?.facebook || '',
              linkedin: l.socialLinks?.linkedin || l.marketingProfile?.socialMediaLinks?.linkedin || '',
              instagram: l.socialLinks?.instagram || l.marketingProfile?.socialMediaLinks?.instagram || ''
            }));
          }
        } catch (e) {
          // Non-fatal
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Update user (exclude email, role, and lender-specifics)
    const { email, role, nmls, clientFacingTitle, officePhone, officePhoneExt, mobilePhone, profileImage, twitter, facebook, linkedin, instagram, ...userData } = form;
    const userRes = await UserService.updateProfile(userData);
    if (!userRes.success) {
      toast.error(userRes.message || 'Failed to update user profile');
      setSaving(false);
      return;
    }

    // Update lender profile fields
    try {
      await lenderService.updateProfile({
        nmls: nmls || undefined,
        clientFacingTitle: clientFacingTitle || undefined,
        officePhone: officePhone || undefined,
        officePhoneExt: officePhoneExt || undefined,
        mobilePhone: mobilePhone || undefined,
        twitter: twitter || undefined,
        facebook: facebook || undefined,
        linkedin: linkedin || undefined,
        instagram: instagram || undefined
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Updated user but failed to update lender details');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      await api.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh profile data
      const res = await UserService.getUserProfile();
      if (res.success) {
        const { firstName, lastName, email, phone, role, profileImage, profileImageUrl } = res.data.user || {};
        setForm(prev => ({ 
          ...prev,
          firstName: firstName || '', 
          lastName: lastName || '', 
          email: email || '', 
          phone: phone || '',
          role: role || 'lender',
          profileImage: profileImageUrl || profileImage || ''
        }));
      }
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error('Failed to upload profile photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute roles={"lender"}>
      <MainLayout>
        <div className="max-w-5xl mx-auto py-8 px-0 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Profile Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">Lender Profile</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your profile information, contact details, and branding</p>
            </div>

            <div className="px-8 py-10">
              <div className="space-y-6">
                {/* Branding / Photo */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
                  <div className="flex items-center gap-6 flex-col sm:flex-row">
                    <div className="w-28 h-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {form.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm">No Photo</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 ${uploading || deleting ? 'cursor-not-allowed' : ''}`}>
                      <label className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors`}>
                        <FiEdit className="h-4 w-4 mr-2" />
                        <span className='sm:text-base text-xs'>{uploading ? 'Uploading...' : (form.profileImage ? 'Change Photo' : 'Upload Photo')}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                      {form.profileImage && (
                        <button type="button" onClick={async () => {
                          setDeleting(true);
                          try {
                            await api.delete('/users/profile-picture');
                            setForm(prev => ({ ...prev, profileImage: '' }));
                            toast.success('Profile photo deleted successfully');
                          } catch (e) {
                            toast.error('Failed to delete profile photo');
                          } finally {
                            setDeleting(false);
                          }
                        }} className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <FiTrash2 className="h-4 w-4 mr-2" />
                          <span className={`sm:text-base text-xs`}>{deleting ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal & Contact Information</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                      <ProfileField 
                        label="First Name" 
                        name="firstName" 
                        value={form.firstName} 
                        onChange={handleChange}
                        icon={FiUser}
                        required
                      />
                      <ProfileField 
                        label="Middle Name" 
                        name="middleName" 
                        value={form.middleName} 
                        onChange={handleChange}
                        icon={FiUser}
                      />
                      <ProfileField 
                        label="Last Name" 
                        name="lastName" 
                        value={form.lastName} 
                        onChange={handleChange}
                        icon={FiUser}
                        required
                      />
                    
                      <ProfileField
                        label="Email"
                        name="email"
                        type="email"
                        disabled
                        value={form.email}
                        onChange={handleChange}
                        icon={FiMail}
                        showEditIcon={true}
                        onEditClick={() => setEmailChangeModalOpen(true)}
                      />
                      <ProfileField 
                        label="Mobile Phone" 
                        name="mobilePhone" 
                        type="tel"
                        value={form.mobilePhone || ''} 
                        onChange={handleChange}
                        icon={FiPhone}
                      />
                      <ProfileField 
                        label="Office Phone" 
                        name="officePhone" 
                        type="tel"
                        value={form.officePhone || ''} 
                        onChange={handleChange}
                        icon={FiPhone}
                      />
                      <ProfileField 
                        label="Office Ext" 
                        name="officePhoneExt" 
                        value={form.officePhoneExt || ''} 
                        onChange={handleChange}
                        icon={FiPhone}
                      />
                      <ProfileField 
                        label="Client-Facing Title" 
                        name="clientFacingTitle" 
                        value={form.clientFacingTitle || ''} 
                        onChange={handleChange}
                        icon={FiBriefcase}
                      />
                      <ProfileField 
                        label="NMLS ID #" 
                        name="nmls" 
                        value={form.nmls || ''} 
                        onChange={handleChange}
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
                        onChange={handleChange}
                        icon={FiBriefcase}
                      />
                      <ProfileField 
                        label="Facebook URL" 
                        name="facebook" 
                        value={form.facebook || ''} 
                        onChange={handleChange}
                        icon={FiBriefcase}
                      />
                      <ProfileField 
                        label="LinkedIn URL" 
                        name="linkedin" 
                        value={form.linkedin || ''} 
                        onChange={handleChange}
                        icon={FiBriefcase}
                      />
                      <ProfileField 
                        label="Instagram Handle" 
                        name="instagram" 
                        value={form.instagram || ''} 
                        onChange={handleChange}
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
              </div>
            </div>
          </div>
        </div>
      </MainLayout>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={emailChangeModalOpen}
        onClose={() => setEmailChangeModalOpen(false)}
        currentEmail={form.email}
        onEmailChanged={(newEmail) => {
          setForm(prev => ({ ...prev, email: newEmail }));
          toast.success('Email address updated successfully!');
        }}
      />
    </ProtectedRoute>
  );
};

export default ProfilePage;
