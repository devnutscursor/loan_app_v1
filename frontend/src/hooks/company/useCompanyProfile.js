import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companyService } from '@/services/api';

export const useCompanyProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nmls: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    legalEntityType: '',
    legalEntityOrganizedUnder: '',
    posLoanAppAssignee: ''
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);

  useEffect(() => {
    // Wait for auth bootstrap on refresh; otherwise we can redirect prematurely.
    if (authLoading) return;
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }
    fetchCompanyProfile();
  }, [user, router, authLoading]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await companyService.getProfile(user.company);
      const companyData = response.data.data;
      setCompany(companyData);
      setFormData({
        name: companyData.name || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        nmls: companyData.nmls || '',
        website: companyData.website || '',
        addressLine1: companyData.address?.addressLine1 || '',
        addressLine2: companyData.address?.addressLine2 || '',
        city: companyData.address?.city || '',
        state: companyData.address?.state || '',
        zipCode: companyData.address?.zipCode || '',
        legalEntityType: companyData.legalEntityType || '',
        legalEntityOrganizedUnder: companyData.legalEntityOrganizedUnder || '',
        posLoanAppAssignee: companyData.posLoanAppAssignee || ''
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching company profile:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await companyService.uploadLogo(user.company, file);
      const { logoUrl, logoKey } = res.data?.data || {};
      const freshUrl = logoUrl ? `${logoUrl}?t=${Date.now()}` : undefined;
      setCompany(prev => ({ ...prev, logo: logoKey, logoUrl: freshUrl }));
      toast.success('Company logo uploaded successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading company logo:', error);
      toast.error('Failed to upload company logo');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleLogoDelete = async (e) => {
    setLogoDeleting(true);
    try {
      await companyService.deleteLogo(user.company);
      setCompany(prev => ({ ...prev, logo: null, logoUrl: null }));
      toast.success('Company logo deleted successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting company logo:', error);
      toast.error('Failed to delete company logo');
    } finally {
      setLogoDeleting(false);
      e.target.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nmls: formData.nmls,
        website: formData.website,
        legalEntityType: formData.legalEntityType,
        legalEntityOrganizedUnder: formData.legalEntityOrganizedUnder,
        posLoanAppAssignee: formData.posLoanAppAssignee,
        address: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      };
      await companyService.updateProfile(user.company, payload);
      setCompany(prev => ({
        ...prev,
        ...payload,
        address: { ...(prev?.address || {}), ...(payload.address || {}) },
      }));
      setEditing(false);
      toast.success('Company profile updated successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating company profile:', error);
      toast.error('Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      nmls: company.nmls || '',
      website: company.website || '',
      addressLine1: company.address?.addressLine1 || '',
      addressLine2: company.address?.addressLine2 || '',
      city: company.address?.city || '',
      state: company.address?.state || '',
      zipCode: company.address?.zipCode || '',
      legalEntityType: company.legalEntityType || '',
      legalEntityOrganizedUnder: company.legalEntityOrganizedUnder || '',
      posLoanAppAssignee: company.posLoanAppAssignee || ''
    });
    setEditing(false);
  };

  return {
    user,
    router,
    loading,
    saving,
    editing,
    setEditing,
    company,
    formData,
    setFormData,
    logoUploading,
    logoDeleting,
    fetchCompanyProfile,
    handleLogoUpload,
    handleLogoDelete,
    handleInputChange,
    handleSave,
    handleCancel,
  };
};


