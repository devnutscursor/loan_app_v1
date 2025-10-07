import React from 'react';
import { FileText } from 'lucide-react';

const ProviderSelectionForm = ({
  showForm,
  selectedProviders,
  loading,
  currentOperation = 'create',
  onProviderChange,
  onSubmitReport,
  onCancel,
  userRole,
  personalCredentials = [],
  organizationCredentials = [],
  selectedCredentialId,
  onChangeCredential,
  onOpenAddAccount,
  onOpenEditAccount,
  importMethod,
  setImportMethod
}) => {
  if (!showForm) return null;

  // Get dynamic text based on operation
  const operationText = {
    create: { title: 'Create Credit Report', button: 'Create Credit Report' },
    refresh: { title: 'Refresh Credit Report', button: 'Refresh Credit Report' },
    upgrade: { title: 'Upgrade Credit Report', button: 'Upgrade Credit Report' }
  };

  const { title, button } = operationText[currentOperation] || operationText.create;

  const isOrgSelected = 
   userRole === 'lender' &&
   !!selectedCredentialId &&
   organizationCredentials.some(c => c._id === selectedCredentialId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-6">Configure settings for the credit report operation.</p>
      
      <div className="space-y-4 mb-6">
        {Object.entries(selectedProviders).map(([provider, enabled]) => (
          <label key={provider} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onProviderChange(provider, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-900 font-medium">
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </span>
          </label>
        ))}
      </div>
      {/* Credit Account Selection */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Credit Account</h3>
          <button
            type="button"
            onClick={onOpenAddAccount}
            className="px-3 py-1.5 text-sm text-black border border-gray-300 hover:bg-gray-50 rounded-lg"
          >
            + Add New Account
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCredentialId || ''}
            onChange={(e) => onChangeCredential?.(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select an account</option>
            {userRole === 'lender' && personalCredentials.length > 0 && (
              <optgroup label="Individual">
                {personalCredentials.map(c => (
                  <option key={`p-${c._id}`} value={c._id} className='tooltip' data-tooltip={c.vendorName}>{c.vendorName} — {c.username}</option>
                ))}
              </optgroup>
            )}
            {userRole === 'lender' && organizationCredentials.length > 0 && (
              <optgroup label="Organization">
                {organizationCredentials.map(c => (
                  <option key={`o-${c._id}`} value={c._id} className='tooltip' data-tooltip={c.vendorName}>{c.vendorName} — {c.username}</option>
                ))}
              </optgroup>
            )}
            {userRole === 'company' && personalCredentials.length > 0 && (
              personalCredentials.map(c => (
                <option key={`c-${c._id}`} value={c._id} className='tooltip' data-tooltip={c.vendorName}>{c.vendorName} — {c.username}</option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={onOpenEditAccount}
            disabled={!selectedCredentialId || isOrgSelected}
            className={`px-3 py-2 rounded border ${
              !selectedCredentialId || isOrgSelected
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
            }`}
             >
             Edit
           </button>
        </div>
      </div>

      {/* Liabilities Import Method */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Liabilities Import Method</h3>
        <select
          value={importMethod}
          onChange={(e) => setImportMethod?.(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="merge" className='tooltip' data-tooltip='Merge Current Liabilities with Credit Report Liabilities'>Merge Current Liabilities with Credit Report Liabilities</option>
          <option value="dont_merge" className='tooltip' data-tooltip="Don't Merge Credit Report Liabilities">Don’t Merge Credit Report Liabilities</option>
          <option value="override" className='tooltip' data-tooltip='Override Current Liabilities with Credit Report Liabilities'>Override Current Liabilities with Credit Report Liabilities</option>
        </select>
      </div>
      
      <div className="flex gap-4 mt-4">
        <button
          onClick={onSubmitReport}
          disabled={loading || !Object.values(selectedProviders).some(Boolean)}
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Processing...' : button}
        </button>
        
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProviderSelectionForm;
