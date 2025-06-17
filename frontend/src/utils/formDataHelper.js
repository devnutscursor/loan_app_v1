/**
 * FormData Helper Utility
 * 
 * Provides helper functions to safely create and manipulate FormData objects
 * for file uploads and multipart/form-data requests.
 */

/**
 * Creates a FormData object with a file and metadata
 * @param {File} file - The file to upload
 * @param {Object} metadata - Key-value pairs of metadata to include
 * @returns {FormData} The prepared FormData object
 */
export const createFileFormData = (file, metadata = {}) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  const formData = new FormData();
  
  // Add the file
  formData.append('file', file);
  
  // Add metadata fields
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          formData.append(key, item);
        });
      } else {
        formData.append(key, value);
      }
    }
  });
  
  return formData;
};

export default {
  createFileFormData
};
