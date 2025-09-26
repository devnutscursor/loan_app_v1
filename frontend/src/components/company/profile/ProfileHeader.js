import React from 'react';
import { X, Check, Edit } from 'lucide-react';

const ProfileHeader = ({ editing, saving, onEdit, onCancel, onSave }) => (
  <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
      <p className="text-gray-600 mt-1">Manage your company information and settings</p>
    </div>
    <div className="flex space-x-2">
      {editing ? (
        <>
          <button onClick={onCancel} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button onClick={onSave} disabled={saving} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </>
      ) : (
        <button onClick={onEdit} className="flex items-center space-x-2 px-4 py-2 bg-primary text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-colors">
          <Edit className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      )}
    </div>
  </div>
);

export default ProfileHeader;


