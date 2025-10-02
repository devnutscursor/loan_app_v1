import React, { useState } from 'react';

export default function AddCredentialModal({ isOpen, onClose, onSubmit, vendors }) {
  const [vendorKey, setVendorKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit?.({ vendorKey, username, password });
    if (ok?.success) {
      setVendorKey('');
      setUsername('');
      setPassword('');
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow w-full max-w-md p-6">
        <div className="text-lg font-semibold mb-4">Add Credential</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select value={vendorKey} onChange={(e) => setVendorKey(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">Select vendor</option>
              {vendors.map(v => (
                <option key={v.key} value={v.key}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password/Secret</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}


