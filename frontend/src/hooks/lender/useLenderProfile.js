import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { UserService } from '../../services';
import { lenderService } from '../../services/api';
import api from '../../services/api';
import {useAuth} from '../../contexts/AuthContext';

export const useLenderProfile = () => {
  const { user } = useAuth();
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

  const handleImageDelete = async () => {
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
  };

  const handleEmailChanged = (newEmail) => {
    setForm(prev => ({ ...prev, email: newEmail }));
    toast.success('Email address updated successfully!');
  };

  return {
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
  };
};
