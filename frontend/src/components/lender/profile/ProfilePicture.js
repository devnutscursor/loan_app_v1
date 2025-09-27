import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const ProfilePicture = ({ 
  profileImage, 
  uploading, 
  deleting, 
  onImageUpload, 
  onImageDelete 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Picture</h2>
      <div className="flex items-center gap-6 flex-col">
        <div className="w-28 h-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">No Photo</span>
          )}
        </div>
        <div className={`flex items-center gap-3 ${uploading || deleting ? 'cursor-not-allowed' : ''}`}>
          <label className={`inline-flex items-center px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg`}>
            <FiEdit className="h-4 w-4 mr-2" />
            <span className='sm:text-base text-xs'>{uploading ? 'Uploading...' : (profileImage ? 'Change Photo' : 'Upload Photo')}</span>
            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" disabled={uploading} />
          </label>
          {profileImage && (
            <button 
              type="button" 
              onClick={onImageDelete} 
              className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FiTrash2 className="h-4 w-4 mr-2" />
              <span className={`sm:text-base text-xs`}>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;
