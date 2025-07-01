import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiSave, FiCamera, FiBriefcase } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { UserService } from '../../services';
import Image from 'next/image';

const ProfileField = ({ label, name, value, onChange, type = 'text', disabled = false, icon: Icon, required = false }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor={name}>
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <div className="relative rounded-md">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`h-5 w-5 ${disabled ? 'text-gray-400' : 'text-primary/70'}`} aria-hidden="true" />
        </div>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${Icon ? 'pl-10' : ''} ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300 hover:border-primary/50'
        } block w-full rounded-lg border py-2.5 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 shadow-sm`}
      />
    </div>
  </div>
);

const ProfilePage = () => {
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '',
    role: ''
  });
  const [profileImage, setProfileImage] = useState('/images/default-avatar.png');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await UserService.getUserProfile();
      if (res.success) {
        const { firstName, lastName, email, phone, role } = res.data.user || {};
        setForm({ 
          firstName: firstName || '', 
          lastName: lastName || '', 
          email: email || '', 
          phone: phone || '',
          role: role || 'lender'
        });
      } else {
        toast.error(res.message || 'Failed to load profile');
      }
      setLoading(false);
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
    const res = await UserService.updateProfile(form);
    if (res.success) {
      toast.success('Profile updated');
    } else {
      toast.error(res.message || 'Update failed');
    }
    setSaving(false);
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
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Profile Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your personal information and account settings
              </p>
            </div>

            <div className="px-8 py-10">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Profile Picture */}
                <div className="md:w-1/3 flex flex-col items-center">
                  
                  <div className="text-center mt-2 space-y-1">
                    <h3 className="font-medium text-gray-800 text-lg mt-6">{form.firstName} {form.lastName}</h3>
                    <div className="capitalize text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-flex items-center">
                      <FiBriefcase className="mr-1" size={14} /> {form.role}
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
                        value={form.firstName} 
                        onChange={handleChange}
                        icon={FiUser}
                        required
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
                      />
                      <ProfileField 
                        label="Phone" 
                        name="phone" 
                        type="tel"
                        value={form.phone} 
                        onChange={handleChange}
                        icon={FiPhone}
                        required
                      />
                      
                      <ProfileField 
                        label="User Role" 
                        name="role" 
                        value={form.role}
                        disabled
                        icon={FiBriefcase}
                      />
                    </div>
                    
                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end">
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
    </ProtectedRoute>
  );
};

export default ProfilePage;
