import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { UserService } from '../services';

export const useProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailChangeModalOpen, setEmailChangeModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    
    // Financial Information
    employment: {
      status: '',
      employer: '',
      position: '',
      yearsEmployed: '',
      annualIncome: ''
    },
    creditScore: '',
    bankAccount: {
      bankName: '',
      accountType: '',
      accountNumber: '',
      routingNumber: ''
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await UserService.getUserProfile();
        
        if (response.success) {
          const user = response.data.user;
          if (user) {
            setProfileData(prev => ({ ...prev, ...user }));
          }
        } else {
          toast.error(response.message || 'Failed to load your profile information');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load your profile information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields (address, employment, bankAccount)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData({
        ...profileData,
        [parent]: {
          ...profileData[parent],
          [child]: value
        }
      });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation for required fields
    if (!profileData.firstName) newErrors.firstName = 'First name is required';
    if (!profileData.lastName) newErrors.lastName = 'Last name is required';
    if (!profileData.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      // Only send fields that can be updated directly (exclude email and role)
      const { firstName, lastName, phone } = profileData;
      const response = await UserService.updateProfile({ firstName, lastName, phone });
      
      if (response.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChanged = (newEmail) => {
    setProfileData(prev => ({ ...prev, email: newEmail }));
    toast.success('Email address updated successfully!');
  };

  return {
    // State
    loading,
    saving,
    emailChangeModalOpen,
    setEmailChangeModalOpen,
    profileData,
    errors,
    
    // Handlers
    handleChange,
    handleSubmit,
    handleEmailChanged,
    
    // Computed values
    fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
    hasErrors: Object.keys(errors).length > 0
  };
};
