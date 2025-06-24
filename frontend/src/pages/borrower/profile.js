import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import FormField from '../../components/common/FormField';
import { UserService } from '../../services';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  
  const fileInputRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await UserService.getUserProfile();
        
        if (response.success) {
          const user = response.data.user;
          if (user) {
            setProfileData(prev => ({ ...prev, ...user }));
            if (user.profilePicture) {
              setProfilePicture(user.profilePicture);
            }
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
    
    // Personal Information Validation
    if (activeTab === 'personal') {
      if (!profileData.firstName) newErrors.firstName = 'First name is required';
      if (!profileData.lastName) newErrors.lastName = 'Last name is required';
      if (!profileData.phone) newErrors.phone = 'Phone number is required';
    }
    
    // Financial Information Validation
    if (activeTab === 'financial') {
      if (!profileData.employment.status) newErrors['employment.status'] = 'Employment status is required';
      if (profileData.employment.status === 'employed') {
        if (!profileData.employment.employer) newErrors['employment.employer'] = 'Employer name is required';
        if (!profileData.employment.position) newErrors['employment.position'] = 'Position is required';
        if (!profileData.employment.yearsEmployed) newErrors['employment.yearsEmployed'] = 'Years employed is required';
      }
      if (!profileData.employment.annualIncome) newErrors['employment.annualIncome'] = 'Annual income is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      setUploadingImage(true);
      
      try {
        const response = await UserService.uploadProfilePicture(file);
        
        if (response.success) {
          setProfilePicture(response.data.profilePicture);
          toast.success('Profile picture updated successfully');
        } else {
          toast.error(response.message || 'Failed to upload profile picture');
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to upload profile picture');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      // Only send fields supported by API
    const { firstName, lastName, email, phone } = profileData;
    const response = await UserService.updateProfile({ firstName, lastName, email, phone });
      
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
  
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['borrower']}>
        <MainLayout title="Profile">
          <div className="flex justify-center items-center min-h-screen py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['borrower']}>
      <MainLayout title="Profile">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <div className="relative">
                
           
                </div>
                
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-semibold text-gray-900">{profileData.firstName || ''} {profileData.lastName || ''}</h1>
                <p className="text-sm text-gray-500">{profileData.email}</p>
              </div>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  
                </nav>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {activeTab === 'personal' ? (
                  <div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FormField
                        label="First Name"
                        name="firstName"
                        type="text"
                        value={profileData.firstName}
                        onChange={handleChange}
                        error={errors.firstName}
                        required
                      />
                      
                      <FormField
                        label="Last Name"
                        name="lastName"
                        type="text"
                        value={profileData.lastName}
                        onChange={handleChange}
                        error={errors.lastName}
                        required
                      />
                      
                      <FormField
                        label="Email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        disabled={true}
                        onChange={handleChange}
                      />
                      
                      <FormField
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        required
                      />
                      
                      
                    </div>
                    
                    
                    
                    
                  </div>
                ) : (
                  <div>
                    
                  
                  </div>
                )}
                
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Profile;
