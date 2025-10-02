import React from 'react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow w-full max-w-md p-6">
        <div className="text-lg font-semibold mb-2">{title || 'Confirm Delete'}</div>
        <div className="text-sm text-gray-700 mb-4">{message || 'Are you sure you want to delete this item?'}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}


