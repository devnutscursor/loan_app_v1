import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { UserService } from '../../services';

const ProfileField = ({ label, name, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
      {label}
    </label>
    <input
      id={name}
      name={name}
      type="text"
      value={value}
      onChange={onChange}
      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
    />
  </div>
);

const ProfilePage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await UserService.getUserProfile();
      if (res.success) {
        const { firstName, lastName, email, phone } = res.data.user || {};
        setForm({ firstName: firstName || '', lastName: lastName || '', email: email || '', phone: phone || '' });
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <ProtectedRoute roles={["lender"]}>
      <MainLayout>
        <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-md">
          <h2 className="text-xl font-semibold mb-6">My Profile</h2>
          <form onSubmit={handleSubmit}>
            <ProfileField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <ProfileField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            <ProfileField label="Email" name="email" value={form.email} onChange={handleChange} />
            <ProfileField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ProfilePage;
