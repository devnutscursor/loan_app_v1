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
          setProfileData(response.data);
          if (response.data.profilePicture) {
            setProfilePicture(response.data.profilePicture);
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
      if (!profileData.address.street) newErrors['address.street'] = 'Street address is required';
      if (!profileData.address.city) newErrors['address.city'] = 'City is required';
      if (!profileData.address.state) newErrors['address.state'] = 'State is required';
      if (!profileData.address.zipCode) newErrors['address.zipCode'] = 'ZIP code is required';
      if (!profileData.address.country) newErrors['address.country'] = 'Country is required';
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
      const response = await UserService.updateProfile(profileData);
      
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
                <div 
                  className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-primary cursor-pointer"
                  onClick={handleProfilePictureClick}
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  ) : profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer" onClick={handleProfilePictureClick}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`${
                      activeTab === 'personal'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                  >
                    Personal Information
                  </button>
                  <button
                    onClick={() => setActiveTab('financial')}
                    className={`${
                      activeTab === 'financial'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                  >
                    Financial Information
                  </button>
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
                      
                      <FormField
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth?.split('T')[0]}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          label="Street Address"
                          name="address.street"
                          type="text"
                          value={profileData.address?.street}
                          onChange={handleChange}
                          error={errors['address.street']}
                          required
                        />
                        
                        <FormField
                          label="City"
                          name="address.city"
                          type="text"
                          value={profileData.address?.city}
                          onChange={handleChange}
                          error={errors['address.city']}
                          required
                        />
                        
                        <FormField
                          label="State/Province"
                          name="address.state"
                          type="text"
                          value={profileData.address?.state}
                          onChange={handleChange}
                          error={errors['address.state']}
                          required
                        />
                        
                        <FormField
                          label="ZIP/Postal Code"
                          name="address.zipCode"
                          type="text"
                          value={profileData.address?.zipCode}
                          onChange={handleChange}
                          error={errors['address.zipCode']}
                          required
                        />
                        
                        <FormField
                          label="Country"
                          name="address.country"
                          type="text"
                          value={profileData.address?.country}
                          onChange={handleChange}
                          error={errors['address.country']}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          label="Employment Status"
                          name="employment.status"
                          type="select"
                          value={profileData.employment?.status}
                          onChange={handleChange}
                          error={errors['employment.status']}
                          options={[
                            { value: 'employed', label: 'Employed' },
                            { value: 'self-employed', label: 'Self-Employed' },
                            { value: 'unemployed', label: 'Unemployed' },
                            { value: 'retired', label: 'Retired' },
                            { value: 'student', label: 'Student' }
                          ]}
                          required
                        />
                        
                        {(profileData.employment?.status === 'employed' || profileData.employment?.status === 'self-employed') && (
                          <>
                            <FormField
                              label="Employer/Business Name"
                              name="employment.employer"
                              type="text"
                              value={profileData.employment?.employer}
                              onChange={handleChange}
                              error={errors['employment.employer']}
                              required
                            />
                            
                            <FormField
                              label="Position/Title"
                              name="employment.position"
                              type="text"
                              value={profileData.employment?.position}
                              onChange={handleChange}
                              error={errors['employment.position']}
                              required
                            />
                            
                            <FormField
                              label="Years Employed/In Business"
                              name="employment.yearsEmployed"
                              type="number"
                              min="0"
                              step="0.5"
                              value={profileData.employment?.yearsEmployed}
                              onChange={handleChange}
                              error={errors['employment.yearsEmployed']}
                              required
                            />
                          </>
                        )}
                        
                        <FormField
                          label="Annual Income ($)"
                          name="employment.annualIncome"
                          type="number"
                          min="0"
                          value={profileData.employment?.annualIncome}
                          onChange={handleChange}
                          error={errors['employment.annualIncome']}
                          required
                        />
                        
                        <FormField
                          label="Credit Score (if known)"
                          name="creditScore"
                          type="number"
                          min="300"
                          max="850"
                          value={profileData.creditScore}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Banking Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          label="Bank Name"
                          name="bankAccount.bankName"
                          type="text"
                          value={profileData.bankAccount?.bankName}
                          onChange={handleChange}
                        />
                        
                        <FormField
                          label="Account Type"
                          name="bankAccount.accountType"
                          type="select"
                          value={profileData.bankAccount?.accountType}
                          onChange={handleChange}
                          options={[
                            { value: 'checking', label: 'Checking' },
                            { value: 'savings', label: 'Savings' }
                          ]}
                        />
                        
                        <FormField
                          label="Account Number (Last 4 digits)"
                          name="bankAccount.accountNumber"
                          type="text"
                          value={profileData.bankAccount?.accountNumber}
                          onChange={handleChange}
                        />
                        
                        <FormField
                          label="Routing Number"
                          name="bankAccount.routingNumber"
                          type="text"
                          value={profileData.bankAccount?.routingNumber}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
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
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default Profile;
