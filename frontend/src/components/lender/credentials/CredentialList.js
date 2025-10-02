import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { Trash2, Pencil, User } from 'lucide-react';


export default function CredentialList({ items = [], onClick, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setConfirmOpen(false);
    setSelected(null);
  }, [items]);

  if (!items.length) {
    return (
      <div className="text-gray-500 text-sm">No credentials yet.</div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <div key={c._id} className="bg-white border rounded-md p-4 hover:shadow min-h-[130px] flex flex-col justify-between relative">
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); setSelected(null); onClick?.(c); }}
              className="text-left w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-col gap-3"
            >
              <div className="font-medium">{c.vendorName}</div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <User size={16} />
                {c.username}
              </div>
            </button>
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                aria-label="Edit credential"
                title="Edit"
                onClick={(e) => { e.stopPropagation(); onClick?.(c); }}
                className="text-indigo-600 hover:text-indigo-700 p-2 rounded hover:bg-indigo-50"
              >
                <Pencil size={20} />
              </button>
              <button
                aria-label="Delete credential"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); setSelected(c); setConfirmOpen(true); }}
                className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setSelected(null); }}
        onConfirm={async () => {
          if (selected && onDelete) {
            await onDelete(selected._id);
          }
          setConfirmOpen(false);
          setSelected(null);
        }}
        title="Delete Credential"
        message={`Are you sure you want to delete ${selected?.vendorName} (${selected?.username})? This action cannot be undone.`}
      />
    </>
  );
}


