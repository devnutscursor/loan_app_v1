import React from 'react';
import { Building2, Mail, Phone, Globe } from 'lucide-react';

const CompanyInfoSection = ({ company, editing, formData, onInputChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
        {editing ? (
          <input type="text" name="name" value={formData.name} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter company name" />
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Building2 className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company?.name || 'Not set'}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        {editing ? (
          <input type="email" name="email" value={formData.email} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter email address" />
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company?.email || 'Not set'}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        {editing ? (
          <input type="tel" name="phone" value={formData.phone} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter phone number" />
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company?.phone || 'Not set'}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
        {editing ? (
          <input type="url" name="website" value={formData.website} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="https://example.com" />
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Globe className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company?.website || 'Not set'}</span>
          </div>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">NMLS #</label>
        {editing ? (
          <input type="text" name="nmls" value={formData.nmls} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="123456" />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.nmls || 'Not set'}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Legal Entity Type</label>
        {editing ? (
          <input type="text" name="legalEntityType" value={formData.legalEntityType} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="LLC, Inc.." />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.legalEntityType || 'Not set'}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Organized Under The Laws Of</label>
        {editing ? (
          <input type="text" name="legalEntityOrganizedUnder" value={formData.legalEntityOrganizedUnder} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Delaware, California..." />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.legalEntityOrganizedUnder || 'Not set'}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">POS Loan App Assignee</label>
        {editing ? (
          <input type="text" name="posLoanAppAssignee" value={formData.posLoanAppAssignee} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Name or email" />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{company?.posLoanAppAssignee || 'Not set'}</div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        {editing ? (
          <div className="space-y-3">
            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Street Address" />
            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={onInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Apt/Unit" />
            <div className="grid grid-cols-3 gap-3">
              <input type="text" name="city" value={formData.city} onChange={onInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="City" />
              <input type="text" name="state" value={formData.state} onChange={onInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="State" />
              <input type="text" name="zipCode" value={formData.zipCode} onChange={onInputChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="ZIP" />
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
  </div>
);

export default CompanyInfoSection;


