import React from 'react';

export default function LenderProfileTabs({ active, onChange, tabs }) {
  const defaultTabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'credentials', label: 'Credentials' }
  ];

  const finalTabs = Array.isArray(tabs) && tabs.length > 0 ? tabs : defaultTabs;

  return (
    <div className="flex gap-3 mb-6">
      {finalTabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange?.(t.key)}
          className={`px-3 py-2 rounded-lg ${active === t.key ? 'text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'border bg-white'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}


