import React, { useEffect, useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { credentialTypeService } from '../../../services/credentialTypeService';
import { meridianLinkService } from '../../../services/meridianLinkService';

export default function EditCredentialModal({ isOpen, onClose, onSubmit, onDelete, credential }) {
  const [formData, setFormData] = useState({
    vendorKey: '',
    vendorName: '',
    username: '',
    password: '',
    credentialType: '',
    displayName: ''
  });
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [meridianLinkProviders, setMeridianLinkProviders] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCredentialTypes();
      fetchMeridianLinkProviders();
    }
  }, [isOpen]);

  // Set form data immediately when credential is available
  useEffect(() => {
    if (credential) {
      setFormData({
        vendorKey: credential.vendorKey || '',
        vendorName: credential.vendorName || '',
        username: credential.username || '',
        password: '',
        credentialType: credential.credentialType || '',
        displayName: credential.credentialTypeInfo?.displayName || ''
      });
    }
  }, [credential]);

  // Update selected type/provider only when arrays are loaded
  useEffect(() => {
    if (credential && credentialTypes.length > 0 && meridianLinkProviders.length > 0) {
      if (credential.credentialType) {
        const type = credentialTypes.find(t => t.id === credential.credentialType);
        setSelectedType(type);
      }
      
      if (credential.vendorKey) {
        const provider = meridianLinkProviders.find(p => p.key === credential.vendorKey);
        setSelectedProvider(provider);
      }
    }
  }, [credential, credentialTypes, meridianLinkProviders]);

  const fetchCredentialTypes = async () => {
    try {
      const response = await credentialTypeService.getAvailableTypes();
      setCredentialTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching credential types:', error);
    }
  };

  const fetchMeridianLinkProviders = async () => {
    try {
      const response = await meridianLinkService.getProviders();
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
      vendorName: provider?.name || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateData = {
      vendorKey: formData.vendorKey,
      username: formData.username,
      credentialType: formData.credentialType,
      password: formData.password || undefined
    };
    const ok = await onSubmit?.(credential._id, updateData);
    if (ok?.success) onClose?.();
  };

  const handleDelete = async () => {
    const ok = await onDelete?.(credential._id);
    if (ok?.success) {
      onClose?.();
      setConfirmOpen(false);
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="text-lg font-semibold mb-4">Edit Credential</div>
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
                Password/Secret
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setConfirmOpen(true)} 
              className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!formData.credentialType || !formData.vendorKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
      <ConfirmDeleteModal
        isOpen={confirmOpen}
        onClose={() => {setConfirmOpen(false);}}
        onConfirm={handleDelete}
        title="Delete Credential"
        message={`Are you sure you want to delete ${credential?.vendorName} (${credential?.username})? This action cannot be undone.`}
      />
    </div>
  );
}


