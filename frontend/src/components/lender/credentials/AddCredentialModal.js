import React, { useState, useEffect } from 'react';
import { credentialTypeService } from '../../../services/credentialTypeService';
import { meridianLinkService } from '../../../services/meridianLinkService';

export default function AddCredentialModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    credentialType: '',
    vendorKey: '',
    vendorName: '',
    username: '',
    password: '',
    displayName: ''
  });
  
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [meridianLinkProviders, setMeridianLinkProviders] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCredentialTypes();
      fetchMeridianLinkProviders();
    }
  }, [isOpen]);

  const fetchCredentialTypes = async () => {
    try {
      const response = await credentialTypeService.getAvailableTypes();
      console.log('Credential types:', response.data);
      setCredentialTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching credential types:', error);
    }
  };

  const fetchMeridianLinkProviders = async () => {
    try {
      const response = await meridianLinkService.getProviders();
      console.log('MeridianLink providers:', response.data);
      setMeridianLinkProviders(response.data.data);
    } catch (error) {
      console.error('Error fetching MeridianLink providers:', error);
    }
  };

  const handleTypeChange = (typeId) => {
    const type = credentialTypes.find(t => t.id === typeId);
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      credentialType: typeId,
      displayName: type?.displayName || ''
    }));
  };

  const handleProviderChange = (providerKey) => {
    const provider = meridianLinkProviders.find(p => p.key === providerKey);
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      vendorKey: providerKey,
      vendorName: provider?.name || '',
      smartApiUrl: provider?.smartApiUrl || '',
      creditApiUrl: provider?.creditApiUrl || '',
      mlcId: provider?.mlcId || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ok = await onSubmit?.(formData);
      if (ok?.success) {
        // Reset form
        setFormData({
          credentialType: '',
          vendorKey: '',
          vendorName: '',
          username: '',
          password: '',
          displayName: ''
        });
        setSelectedType(null);
        setSelectedProvider(null);
        onClose?.();
      }
    } catch (error) {
      console.error('Error creating credential:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <div className="text-lg font-semibold mb-4">Create New Credential</div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* MeridianLink Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MeridianLink Provider *
            </label>
            <select
              value={formData.vendorKey}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select MeridianLink provider...</option>
              {meridianLinkProviders.map(provider => (
                <option key={provider.key} value={provider.key}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Credential Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Type *
            </label>
            <select
              value={formData.credentialType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select credential type...</option>
              {credentialTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Basic credential fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.credentialType || !formData.vendorKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


