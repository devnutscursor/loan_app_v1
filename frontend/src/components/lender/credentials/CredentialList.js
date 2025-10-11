import React, { useState, useEffect, useMemo } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { Trash2, Pencil, User } from 'lucide-react';

export default function CredentialList({ items = [], onClick, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setConfirmOpen(false);
    setSelected(null);
  }, [items]);

  // Define credential type tabs
  const credentialTypeTabs = [
    { id: 'all', label: 'All Credentials', type: null },
    { id: 'credit_account', label: 'Credit Account', type: 'credit_account' },
    { id: 'aus_du', label: 'AUS-DU', type: 'aus_du' },
    { id: 'aus_lpa', label: 'AUS-LPA', type: 'aus_lpa' },
    { id: 'freddie_lpa', label: 'FHLMC', type: 'freddie_lpa' },
    { id: 'fannie_du', label: 'FNMA', type: 'fannie_du' }
  ];

  // Filter credentials based on active tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') {
      return items;
    }
    return items.filter(item => item.credentialType === activeTab);
  }, [items, activeTab]);

  const getTypeDisplayName = (type) => {
    const typeMap = {
      'credit_account': 'Credit Account',
      'aus_du': 'AUS-DU',
      'aus_lpa': 'AUS-LPA', 
      'doc_magic': 'Doc-Magic',
      'freddie_lpa': 'FHLMC',
      'fannie_du': 'FNMA'
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colorMap = {
      'credit_account': 'text-blue-800',
      'aus_du': 'text-green-800',
      'aus_lpa': 'text-green-800', 
      'doc_magic': 'text-purple-800',
      'freddie_lpa': 'text-orange-800',
      'fannie_du': 'text-yellow-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (!items.length) {
    return (
      <div className="text-gray-500 text-sm">No credentials yet.</div>
    );
  }

  return (
    <>
      {/* Credential Type Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {credentialTypeTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.type ? items.filter(item => item.credentialType === tab.type).length : items.length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filtered Credentials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((c) => (
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
              {c.credentialType && (
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(c.credentialType)}`}>
                  {getTypeDisplayName(c.credentialType)}
                </span>
              )}
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

      {/* Show message when no credentials match the selected filter */}
      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No credentials found for the selected type.</p>
          <button
            onClick={() => setActiveTab('all')}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all credentials
          </button>
        </div>
      )}

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


