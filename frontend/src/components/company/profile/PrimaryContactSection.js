import React from 'react';
import { Mail, Users } from 'lucide-react';

const PrimaryContactSection = ({ company }) => {
  if (!company?.primaryContact) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Primary Contact</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company.primaryContact.firstName} {company.primaryContact.lastName}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900">{company.primaryContact.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimaryContactSection;


