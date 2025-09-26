import React from 'react';
import { FileEdit, Trash2 } from 'lucide-react';

const LogoCard = ({ company, logoUploading, logoDeleting, onUpload, onDelete }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Logo</h2>
    <div className="flex items-center gap-8 flex-col">
      <div className="w-40 h-40 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
        {company?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
        ) : (
          <span className="text-gray-400 text-sm">No Logo</span>
        )}
      </div>
      <div className={`flex items-center gap-3 ${logoUploading ? 'cursor-not-allowed' : ''}`}>
        <label className={`inline-flex items-center px-4 py-2 bg-primary text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg cursor-pointer transition-colors disabled:opacity-50`} disabled={logoUploading}>
          <FileEdit className="h-4 w-4 mr-2" />
          <span>{logoUploading ? 'Uploading...' : (company?.logoUrl ? 'Change Logo' : 'Upload Logo')}</span>
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={logoUploading || logoDeleting} />
        </label>
        {company?.logoUrl && (
          <button onClick={onDelete} disabled={logoDeleting} className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4 mr-2" />
            <span>{logoDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

export default LogoCard;


