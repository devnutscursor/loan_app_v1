import React from 'react';
import { FileText } from 'lucide-react';

const ProviderSelectionForm = ({
  showForm,
  selectedProviders,
  loading,
  onProviderChange,
  onCreateReport,
  onCancel
}) => {
  if (!showForm) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Credit Bureaus</h2>
      <p className="text-gray-600 mb-6">Choose which credit bureaus to include in the report.</p>
      
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
      
      <div className="flex gap-4">
        <button
          onClick={onCreateReport}
          disabled={loading || !Object.values(selectedProviders).some(Boolean)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Creating...' : 'Create Report'}
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
