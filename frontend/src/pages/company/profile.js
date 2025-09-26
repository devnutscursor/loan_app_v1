import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import CompanyLayout from '../../components/layout/CompanyLayout';
import { companyService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Mail, 
  Phone, 
  Users, 
  Save,
  Edit,
  X,
  Check,
  Globe,
  FileEdit,
  Trash2
} from 'lucide-react';

const CompanyProfile = () => {
  const { user } = useAuth();
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
    if (!user || user.role !== 'company') {
      router.push('/login');
      return;
    }

    fetchCompanyProfile();
  }, [user, router]);

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
      console.error('Error fetching company profile:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if (file) {
      setLogoUploading(true);
      try {
        const res = await companyService.uploadLogo(user.company, file);
        const {logoUrl, logoKey} = res.data?.data || {};

        const freshUrl = logoUrl ? `${logoUrl}?t=${Date.now()}` : undefined;
        setCompany(prev => ({ ...prev, logo: logoKey, logoUrl: freshUrl }));
        toast.success('Company logo uploaded successfully');
      } catch (error) {
        console.error('Error uploading company logo:', error);
        toast.error('Failed to upload company logo');
      } finally {
        setLogoUploading(false);
        e.target.value = '';
      }
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async (e) => {
    setLogoDeleting(true);
    try {
      await companyService.deleteLogo(user.company);
      setCompany(prev => ({ ...prev, logo: null, logoUrl: null }));
      toast.success('Company logo deleted successfully');
    } catch (error) {
      console.error('Error deleting company logo:', error);
      toast.error('Failed to delete company logo');
    } finally {
      setLogoDeleting(false);
      e.target.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      await companyService.updateProfile(user.company, payload);
      
      setCompany(prev => ({ ...prev, ...payload }));
      setEditing(false);
      toast.success('Company profile updated successfully');
    } catch (error) {
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

  if (loading) {
    return (
      <CompanyLayout title="Company Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Profile">
      <div className="max-w-[1215px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-600 mt-1">Manage your company information and settings</p>
          </div>
          <div className="flex space-x-2">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Branding / Logo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Logo</h2>
          <div className="flex items-center gap-8 flex-col">
            <div className="w-40 h-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {company?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-sm">No Logo</span>
              )}
            </div>
            <div className={`flex items-center gap-3 ${logoUploading ? 'cursor-not-allowed' : ''}`}>
              <label className={`inline-flex items-center px-4 py-2 bg-primary text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg cursor-pointer transition-colors disabled:opacity-50`} disabled={logoUploading}>
                <FileEdit className="h-4 w-4 mr-2" />
                <span>{logoUploading ? 'Uploading...' : (company?.logoUrl ? 'Change Logo' : 'Upload Logo')}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={logoUploading || logoDeleting} />
              </label>
              {company?.logoUrl && (
                <button onClick={handleLogoDelete} disabled={logoDeleting} className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>{logoDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Company Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter company name"
                />
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{company?.name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter email address"
                />
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{company?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{company?.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Max Lenders - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Lenders
              </label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{company?.maxLenders || 0}</span>
                <span className="text-xs text-gray-500 ml-2">(Read Only)</span>
              </div>
            </div>

          </div>

          {/* Additional fields row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              {editing ? (
                <input type="url" name="website" value={formData.website} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://example.com" />
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{company?.website || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* NMLS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NMLS #</label>
              {editing ? (
                <input type="text" name="nmls" value={formData.nmls} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="123456" />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.nmls || 'Not set'}</div>
              )}
            </div>

            {/* Legal Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Legal Entity Type</label>
              {editing ? (
                <input type="text" name="legalEntityType" value={formData.legalEntityType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="LLC, Inc.." />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.legalEntityType || 'Not set'}</div>
              )}
            </div>
            {/* Legal Entity Organized Under */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organized Under The Laws Of</label>
              {editing ? (
                <input type="text" name="legalEntityOrganizedUnder" value={formData.legalEntityOrganizedUnder} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Delaware, California..." />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.legalEntityOrganizedUnder || 'Not set'}</div>
              )}
            </div>

            {/* Legal Organized Under */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">POS Loan App Assignee</label>
              {editing ? (
                <input type="text" name="posLoanAppAssignee" value={formData.posLoanAppAssignee} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Name or email" />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.posLoanAppAssignee || 'Not set'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {editing ? (
                <div className="space-y-3">
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Street Address" />
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Apt/Unit" />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="City" />
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="State" />
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="ZIP" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 p-3 bg-gray-50 rounded-lg text-gray-900 truncate overflow-hidden text-ellipsis">
                  <div>{company?.address?.addressLine1 || '—'}</div>
                  <div>{company?.address?.addressLine2 || ''}</div>
                  <div>{[company?.address?.city, company?.address?.state, company?.address?.zipCode].filter(Boolean).join(', ') || ''}</div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
          </div>
        </div>
        


        {/* Company Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {company?.users?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {company?.maxLenders || 0}
              </div>
              <div className="text-sm text-gray-600">Max Lenders</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Created Date</div>
            </div>
          </div>
        </div>

        {/* Primary Contact Information */}
        {company?.primaryContact && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Primary Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {company.primaryContact.firstName} {company.primaryContact.lastName}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{company.primaryContact.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}

export default CompanyProfile;
