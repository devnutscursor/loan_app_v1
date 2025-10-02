import React, { useEffect, useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function EditCredentialModal({ isOpen, onClose, onSubmit, onDelete, vendors, credential }) {
  const [vendorKey, setVendorKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (credential) {
      setVendorKey(credential.vendorKey || '');
      setUsername(credential.username || '');
      setPassword('');
    }
  }, [credential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit?.(credential._id, { vendorKey, username, password: password || undefined });
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
      <div className="bg-white rounded-md shadow w-full max-w-md p-6">
        <div className="text-lg font-semibold mb-4">Edit Credential</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select value={vendorKey} onChange={(e) => setVendorKey(e.target.value)} className="w-full border rounded px-3 py-2">
              {vendors.map(v => (
                <option key={v.key} value={v.key}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password/Secret</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Leave blank to keep current" />
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded border border-red-600 text-red-600">Delete</button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
              <button type="submit" className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">Save</button>
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


