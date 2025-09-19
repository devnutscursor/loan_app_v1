import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiSave, FiBriefcase } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import { UserService } from '../../services';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import EmailChangeModal from '../../components/common/EmailChangeModal';
import ProfileField from '../../components/common/ProfileField';


const Profile = () => {
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
      <div className="max-w-5xl mx-auto py-8 px-0 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
             {/* Profile Header */}
             <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your personal information and account settings
              </p>
            </div>
            <div className="px-4 md:px-8 py-10">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Profile Picture */}
                <div className="md:w-1/3 flex flex-col items-center">
                  
                  <div className="text-center mt-2 space-y-1">
                    <h3 className="font-medium text-gray-800 text-lg mt-6">{profileData.firstName} {profileData.lastName}</h3>
                    <div className="capitalize text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-flex items-center">
                      <FiBriefcase className="mr-1" size={14} /> {profileData.role}
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="md:w-2/3">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                      <ProfileField 
                        label="First Name" 
                        name="firstName" 
                        value={profileData.firstName} 
                        onChange={handleChange}
                        icon={FiUser}
                        required
                      />
                      <ProfileField 
                        label="Last Name" 
                        name="lastName" 
                        value={profileData.lastName} 
                        onChange={handleChange}
                        icon={FiUser}
                        required
                      />
                    
                      <ProfileField
                        label="Email"
                        name="email"
                        type="email"
                        disabled
                        value={profileData.email}
                        onChange={handleChange}
                        icon={FiMail}
                        showEditIcon={true}
                        onEditClick={() => setEmailChangeModalOpen(true)}
                      />
                      <ProfileField 
                        label="Phone" 
                        name="phone" 
                        type="tel"
                        value={profileData.phone} 
                        onChange={handleChange}
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
              </div>
            </div>
          </div>
        </div>
      </MainLayout>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={emailChangeModalOpen}
        onClose={() => setEmailChangeModalOpen(false)}
        currentEmail={profileData.email}
        onEmailChanged={(newEmail) => {
          setProfileData(prev => ({ ...prev, email: newEmail }));
          toast.success('Email address updated successfully!');
        }}
      />
    </ProtectedRoute>
  );
};

export default Profile;
